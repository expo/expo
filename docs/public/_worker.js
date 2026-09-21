import { createUrlRecovery, pagePath } from '../worker/url-recovery.ts';

const NOT_FOUND_MARKDOWN = `# Page not found

No markdown exists for this path. Useful starting points:

- [Documentation index](https://docs.expo.dev/llms.txt)
- [Sitemap](https://docs.expo.dev/sitemap.xml)
- [Documentation home](https://docs.expo.dev/)
`;

function acceptsMarkdown(accept) {
  let markdownListed = false;
  let markdownQuality = 0;
  let htmlQuality = 0;

  for (const entry of accept.split(",")) {
    const [type, ...params] = entry.split(";");
    const name = type.trim().toLowerCase();

    let quality = 1;
    for (const param of params) {
      const [key, value] = param.split("=");
      if (key.trim().toLowerCase() === "q") {
        quality = Number(value);
        if (!Number.isFinite(quality)) quality = 0;
      }
    }

    if (name === "text/markdown") {
      markdownListed = true;
      markdownQuality = Math.max(markdownQuality, quality);
    } else if (name === "text/html" || name === "text/*" || name === "*/*") {
      htmlQuality = Math.max(htmlQuality, quality);
    }
  }

  return markdownListed && markdownQuality > 0 && markdownQuality >= htmlQuality;
}

function upgradeHelperPairPath(url) {
  if (!/^\/bare\/upgrade\/?$/.test(url.pathname)) return null;

  const from = (url.searchParams.get("fromSdk") || "").replace(/\.md$/, "");
  const to = (url.searchParams.get("toSdk") || "").replace(/\.md$/, "");
  const version = /^(\d+|unversioned)$/;
  if (!from || !to || from === to || !version.test(from) || !version.test(to)) {
    return null;
  }

  return `/bare/upgrade/${from}-to-${to}/index.md`;
}

export function createWorker({ recoverNotFound = createUrlRecovery() } = {}) {
  return {
    async fetch(request, env) {
      const accept = request.headers.get("Accept") || "";
      const url = new URL(request.url);
      const pairPath = upgradeHelperPairPath(url);

      const wantsMarkdown =
        url.pathname.endsWith(".md") ||
        acceptsMarkdown(accept) ||
        (pairPath !== null && /\.md$/.test(url.searchParams.get("toSdk") || ""));

      if (wantsMarkdown) {
        const mdPath = pagePath(url.pathname) + "index.md";

        const candidates = [];
        if (pairPath) candidates.push(pairPath);
        candidates.push(mdPath);

        for (const candidate of candidates) {
          url.pathname = candidate;
          const mdResponse = await env.ASSETS.fetch(new Request(url, request));

          const contentType = mdResponse.headers.get("Content-Type") || "";
          if (mdResponse.ok && contentType.includes("text/markdown")) {
            const response = new Response(mdResponse.body, mdResponse);
            response.headers.set("Content-Type", "text/markdown; charset=utf-8");
            response.headers.append("Vary", "Accept");
            return response;
          }
        }

        const passthrough = await env.ASSETS.fetch(request);
        if (passthrough.status >= 300 && passthrough.status < 400) {
          return passthrough;
        }

        if (passthrough.status === 404) {
          const recovered = await recoverNotFound(request, env, true).catch(() => null);
          if (recovered) return recovered;
        }

        return new Response(request.method === "HEAD" ? null : NOT_FOUND_MARKDOWN, {
          status: 404,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept",
          },
        });
      }

      const htmlResponse = await env.ASSETS.fetch(request);
      if (htmlResponse.status === 404) {
        const recovered = await recoverNotFound(request, env, false).catch(() => null);
        if (recovered) return recovered;
      }
      const response = new Response(htmlResponse.body, htmlResponse);
      response.headers.append("Vary", "Accept");
      return response;
    },
  };
}

export default createWorker();
