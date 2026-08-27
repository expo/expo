const NOT_FOUND_MARKDOWN = `# Page not found

No markdown exists for this path. Useful starting points:

- [Documentation index](https://docs.expo.dev/llms.txt)
- [Sitemap](https://docs.expo.dev/sitemap.xml)
- [Documentation home](https://docs.expo.dev/)
`;

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

    const wantsMarkdown =
      accept.includes("text/markdown") ||
      (pairPath !== null && /\.md$/.test(url.searchParams.get("toSdk") || ""));

    if (wantsMarkdown) {
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
        if (mdResponse.ok && contentType.includes("text/markdown")) {
          return new Response(mdResponse.body, {
            status: 200,
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              Vary: "Accept",
            },
          });
        }
      }

      return new Response(NOT_FOUND_MARKDOWN, {
        status: 404,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
