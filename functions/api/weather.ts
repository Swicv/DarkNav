import { Env, jsonResponse, corsHeaders } from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

// 内存缓存（边缘实例级别，15分钟缓存）
const weatherCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 15 * 60 * 1000;

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const url = new URL(request.url);
    let lat = parseFloat(url.searchParams.get('lat') || '');
    let lon = parseFloat(url.searchParams.get('lon') || '');
    let city = url.searchParams.get('city') || '';

    const cf = (request as any).cf;
    const clientIp = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

    // 1. 如果没有传入经纬度，自动解析用户定位
    if (isNaN(lat) || isNaN(lon)) {
      let geoFound = false;

      // 尝试通过 ipwho.is 获取精确中文地名与坐标（支持 HTTPS）
      if (clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
        try {
          const ipRes = await fetch(`https://ipwho.is/${clientIp}?lang=zh-CN`, {
            signal: AbortSignal.timeout(3000)
          });
          if (ipRes.ok) {
            const ipData: any = await ipRes.json();
            if (ipData.success && ipData.latitude && ipData.longitude) {
              lat = parseFloat(ipData.latitude);
              lon = parseFloat(ipData.longitude);
              city = ipData.city || ipData.region || '本地';
              geoFound = true;
            }
          }
        } catch (e) {}
      }

      // 降级使用 Cloudflare 原生位置标头
      if (!geoFound && cf && cf.latitude && cf.longitude) {
        lat = parseFloat(cf.latitude);
        lon = parseFloat(cf.longitude);
        city = city || cf.city || cf.country || '本地';
        geoFound = true;
      }

      // 终极兜底坐标（北京）
      if (!geoFound) {
        lat = 39.9042;
        lon = 116.4074;
        city = city || '北京';
      }
    }

    if (!city) city = '本地';

    // 2. 检查缓存
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return jsonResponse({ ...cached.data, city: city || cached.data.city }, 200, env);
    }

    // 3. 从 Open-Meteo 拉取天气预报
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const weatherRes = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(5000)
    });

    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo forecast failed with status ${weatherRes.status}`);
    }

    const weatherData: any = await weatherRes.json();
    if (!weatherData.current) {
      throw new Error('Invalid weather data structure from Open-Meteo');
    }

    // 4. 拉取 AQI 空气质量（可选，失败不影响主天气）
    let aqiValue = 0;
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
      const aqiRes = await fetch(aqiUrl, { signal: AbortSignal.timeout(3000) });
      if (aqiRes.ok) {
        const aqiData: any = await aqiRes.json();
        if (aqiData.current?.us_aqi !== undefined) {
          aqiValue = aqiData.current.us_aqi;
        }
      }
    } catch (e) {}

    const result = {
      temp: Math.round(weatherData.current.temperature_2m),
      weatherCode: weatherData.current.weather_code,
      minTemp: Math.round(weatherData.daily?.temperature_2m_min?.[0] ?? weatherData.current.temperature_2m),
      maxTemp: Math.round(weatherData.daily?.temperature_2m_max?.[0] ?? weatherData.current.temperature_2m),
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      humidity: Math.round(weatherData.current.relative_humidity_2m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      city,
      daily: weatherData.daily,
      aqi: aqiValue
    };

    // 写入内存缓存
    weatherCache.set(cacheKey, { timestamp: now, data: result });
    if (weatherCache.size > 200) {
      for (const [key, val] of weatherCache.entries()) {
        if (now - val.timestamp > CACHE_TTL) weatherCache.delete(key);
      }
    }

    return jsonResponse(result, 200, env);
  } catch (error: any) {
    console.error('Weather API error:', error);
    // 降级兜底天气数据，确保前端绝不白屏或卡死
    return jsonResponse({
      temp: 22,
      weatherCode: 1,
      minTemp: 16,
      maxTemp: 25,
      windSpeed: 8,
      humidity: 55,
      feelsLike: 22,
      city: '本地',
      daily: {
        weather_code: [1],
        temperature_2m_max: [25],
        temperature_2m_min: [16]
      },
      aqi: 45
    }, 200, env);
  }
};
