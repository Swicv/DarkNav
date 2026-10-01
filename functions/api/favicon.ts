import { Env, corsHeaders } from './_utils';

export const onRequestOptions = async ({ env }: { env: Env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env)
  });
};

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain')?.trim() || '';

  if (!domain || domain.length > 255 || !domain.includes('.')) {
    return new Response('Invalid domain', { status: 400, headers: corsHeaders(env) });
  }

  // 1. Try Google S2 (Cloudflare Edge can access Google without any GFW restriction)
  try {
    const googleRes = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`, {
      signal: AbortSignal.timeout(2500)
    });
    if (googleRes.ok && googleRes.body) {
      const contentType = googleRes.headers.get('content-type') || 'image/png';
      return new Response(googleRes.body, {
        status: 200,
        headers: {
          ...corsHeaders(env),
          'Content-Type': contentType,
          // Instruct Cloudflare Edge & Browser to cache the icon for 7 days
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable'
        }
      });
    }
  } catch (err) {}

  // 2. Try DuckDuckGo
  try {
    const ddgRes = await fetch(`https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`, {
      signal: AbortSignal.timeout(2000)
    });
    if (ddgRes.ok && ddgRes.body) {
      const contentType = ddgRes.headers.get('content-type') || 'image/x-icon';
      return new Response(ddgRes.body, {
        status: 200,
        headers: {
          ...corsHeaders(env),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable'
        }
      });
    }
  } catch (err) {}

  // 3. Fallback: Return 404 so client instantly displays the aesthetic monogram avatar
  return new Response('Favicon not found', {
    status: 404,
    headers: {
      ...corsHeaders(env),
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
