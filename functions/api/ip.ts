import { Env, jsonResponse, corsHeaders } from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  // 1. 优先使用 Cloudflare Edge 自带的高精度地理位置，0ms 延迟且不消耗外部配额
  const cf = (request as any).cf;
  if (cf && cf.latitude && cf.longitude) {
    return jsonResponse({
      status: 'success',
      city: cf.city || cf.country || '本地',
      lat: parseFloat(cf.latitude),
      lon: parseFloat(cf.longitude)
    }, 200, env);
  }

  // 2. 本地调试或未携带 CF 标头时，降级请求外部 IP 接口
  try {
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN', {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      return jsonResponse(data, 200, env);
    }
  } catch (error) {
    console.error('IP proxy fallback failed:', error);
  }

  // 3. 终极兜底默认坐标（北京）
  return jsonResponse({
    status: 'success',
    city: '北京',
    lat: 39.9042,
    lon: 116.4074
  }, 200, env);
};
