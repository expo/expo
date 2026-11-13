import { recoverNotFoundAsync } from '../worker/url-recovery.ts';

const NOT_FOUND_MARKDOWN = `# Page not found

No markdown exists for this path. Useful starting points:

- [Documentation index](https://docs.expo.dev/llms.txt)
- [Sitemap](https://docs.expo.dev/sitemap.xml)
- [Documentation home](https://docs.expo.dev/)
`;

const NOT_FOUND_JSON = JSON.stringify({
  error: {
    status: 404,
    code: "not_found",
    message:
      "No documentation page exists at this path. Find a valid path in the documentation index or the sitemap.",
  },
  links: {
    index: "https://docs.expo.dev/llms.txt",
    sitemap: "https://docs.expo.dev/sitemap.xml",
    home: "https://docs.expo.dev/",
  },
});

const AI_USER_AGENTS = /\b(?:ChatGPT-User|Claude-User|Perplexity-User)\b/i;

function prefersType(accept, wanted) {
  let wantedQuality = 0;
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

    if (name === wanted) {
      wantedQuality = Math.max(wantedQuality, quality);
    } else if (name === "text/html" || name === "text/*" || name === "*/*") {
      htmlQuality = Math.max(htmlQuality, quality);
    }
  }

  return wantedQuality > 0 && wantedQuality >= htmlQuality;
}

function listsHtml(accept) {
  return accept.split(",").some(entry => entry.split(";")[0].trim().toLowerCase() === "text/html");
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

export default {
  async fetch(request, env) {
    const accept = request.headers.get("Accept") || "";
    const url = new URL(request.url);
    const pairPath = upgradeHelperPairPath(url);

    const directMarkdown = url.pathname.endsWith(".md");
    const wantsMarkdown =
      directMarkdown ||
      prefersType(accept, "text/markdown") ||
      (pairPath !== null && /\.md$/.test(url.searchParams.get("toSdk") || ""));
    const offersMarkdown =
      !wantsMarkdown && AI_USER_AGENTS.test(request.headers.get("User-Agent") || "");

    if (wantsMarkdown || offersMarkdown) {
      if (!directMarkdown) {
        let mdPath = url.pathname;
        if (!mdPath.endsWith("/")) mdPath += "/";
        mdPath += "index.md";

        const candidates = [];
        if (pairPath) candidates.push(pairPath);
        candidates.push(mdPath);

        for (const candidate of candidates) {
          url.pathname = candidate;
          const mdResponse = await env.ASSETS.fetch(new Request(url, request));

          const contentType = mdResponse.headers.get("Content-Type") || "";
          if (
            (mdResponse.ok && contentType.includes("text/markdown")) ||
            mdResponse.status === 304 ||
            mdResponse.status === 416 ||
            mdResponse.status >= 500
          ) {
            const response = new Response(mdResponse.body, mdResponse);
            if (contentType.includes("text/markdown")) {
              response.headers.set("Content-Type", "text/markdown; charset=utf-8");
            }
            response.headers.append("Vary", offersMarkdown ? "Accept, User-Agent" : "Accept");
            return response;
          }
        }
      }
    }

    if (wantsMarkdown) {
      const passthrough = await env.ASSETS.fetch(request);
      if (
        (directMarkdown && passthrough.status !== 404) ||
        (passthrough.status >= 300 && passthrough.status < 400)
      ) {
        return passthrough;
      }

      if (passthrough.status === 404) {
        const recovered = await recoverNotFoundAsync(request, env, true).catch(() => null);
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
      const recovered = await recoverNotFoundAsync(request, env, false).catch(() => null);
      if (recovered) return recovered;

      const wantsJson =
        prefersType(accept, "application/json") ||
        (url.pathname.startsWith("/api/") && !listsHtml(accept));

      if (wantsJson) {
        return new Response(request.method === "HEAD" ? null : NOT_FOUND_JSON, {
          status: 404,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Vary: "Accept",
          },
        });
      }
    }
    const response = new Response(htmlResponse.body, htmlResponse);
    response.headers.append("Vary", "Accept");
    return response;
  },
};
