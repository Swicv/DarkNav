import { Env, jsonResponse, corsHeaders } from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const cf = (request as any).cf;
  const clientIp = request.headers.get('cf-connecting-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '';

  // 1. 如果有真实公网 IP，优先请求高可靠的 HTTPS 地名接口（输出中文地名）
  if (clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
    try {
      const response = await fetch(`https://ipwho.is/${clientIp}?lang=zh-CN`, {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data.success && data.latitude && data.longitude) {
          return jsonResponse({
            status: 'success',
            city: data.city || data.region || '本地',
            lat: parseFloat(data.latitude),
            lon: parseFloat(data.longitude)
          }, 200, env);
        }
      }
    } catch (e) {}

    try {
      const response = await fetch(`http://ip-api.com/json/${clientIp}?lang=zh-CN`, {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data.status !== 'fail') {
          return jsonResponse({
            status: 'success',
            city: data.city || data.regionName || '本地',
            lat: data.lat,
            lon: data.lon
          }, 200, env);
        }
      }
    } catch (e) {}
  }

  // 2. 降级使用 Cloudflare 原生地理位置标头
  if (cf && cf.latitude && cf.longitude) {
    return jsonResponse({
      status: 'success',
      city: cf.city || cf.country || '本地',
      lat: parseFloat(cf.latitude),
      lon: parseFloat(cf.longitude)
    }, 200, env);
  }

  // 3. 终极兜底默认坐标（北京）
  return jsonResponse({
    status: 'success',
    city: '北京',
    lat: 39.9042,
    lon: 116.4074
  }, 200, env);
};
