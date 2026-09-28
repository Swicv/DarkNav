import bcrypt from 'bcryptjs';
import {
  Env,
  DEFAULT_ADMIN_PASSWORD,
  INITIAL_DATA,
  jsonResponse,
  verifyPassword,
  normalizeData,
  sanitizeData,
  isBcryptHash,
  corsHeaders
} from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    if (!env.NAV_KV) {
      console.warn('NAV_KV is not bound in Cloudflare Pages settings. Returning default data.');
      return jsonResponse(INITIAL_DATA, 200, env);
    }

    const rawData = await env.NAV_KV.get('data');
    if (!rawData) {
      return jsonResponse(INITIAL_DATA, 200, env);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      parsed = INITIAL_DATA;
    }

    return jsonResponse(sanitizeData(parsed), 200, env);
  } catch (error: any) {
    return jsonResponse({ error: 'Failed to read data from KV: ' + error.message }, 500, env);
  }
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    if (!env.NAV_KV) {
      return jsonResponse({
        error: 'Cloudflare KV (NAV_KV) 未绑定。请在 Cloudflare Pages 设置中的 Functions -> KV namespace bindings 添加 NAV_KV 绑定。'
      }, 500, env);
    }

    const providedPassword = request.headers.get('x-admin-password') || '';
    
    // 1. 获取当前存储的密码（KV 或环境变量）
    let currentStoredPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const rawData = await env.NAV_KV.get('data');
    let existingData: any = null;

    if (rawData) {
      try {
        existingData = JSON.parse(rawData);
        if (existingData?.adminPassword) {
          currentStoredPassword = existingData.adminPassword;
        }
      } catch {}
    }

    // 2. 校验管理员身份
    const isAuthenticated = verifyPassword(providedPassword, currentStoredPassword);
    if (!isAuthenticated) {
      return jsonResponse({ error: 'Unauthorized: Password incorrect' }, 403, env);
    }

    // 3. 解析与校验提交数据
    const body: any = await request.json();
    const normalized = normalizeData(body);
    if (!normalized) {
      return jsonResponse({ error: 'Invalid data structure' }, 400, env);
    }

    // 4. 处理密码变更
    let passwordToSave = currentStoredPassword;
    if (body.adminPassword) {
      if (!isBcryptHash(body.adminPassword)) {
        passwordToSave = bcrypt.hashSync(body.adminPassword, 8);
      } else {
        passwordToSave = body.adminPassword;
      }
    }

    const dataToWrite = {
      ...normalized,
      adminPassword: passwordToSave
    };

    // 5. 写入 Cloudflare KV
    await env.NAV_KV.put('data', JSON.stringify(dataToWrite));

    return jsonResponse({ success: true }, 200, env);
  } catch (error: any) {
    return jsonResponse({ error: 'Failed to save data: ' + error.message }, 500, env);
  }
};
