import {
  Env,
  DEFAULT_ADMIN_PASSWORD,
  jsonResponse,
  verifyPassword,
  corsHeaders
} from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { password } = (await request.json().catch(() => ({}))) as { password?: string };

    let currentStoredPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (env.NAV_KV) {
      try {
        const rawData = await env.NAV_KV.get('data');
        if (rawData) {
          const parsed = JSON.parse(rawData);
          if (parsed?.adminPassword) {
            currentStoredPassword = parsed.adminPassword;
          }
        }
      } catch {}
    }

    if (!password || !verifyPassword(password, currentStoredPassword)) {
      return jsonResponse({ error: 'Unauthorized: Password incorrect' }, 403, env);
    }

    return jsonResponse({ success: true }, 200, env);
  } catch (error: any) {
    return jsonResponse({ error: 'Login failed: ' + error.message }, 500, env);
  }
};
