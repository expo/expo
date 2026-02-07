export default {
  async fetch(request, env) {
    const accept = request.headers.get("Accept") || "";

    if (accept.includes("text/markdown")) {
      const url = new URL(request.url);
      let mdPath = url.pathname;
      if (!mdPath.endsWith("/")) mdPath += "/";
      mdPath += "index.md";

      url.pathname = mdPath;
      const mdResponse = await env.ASSETS.fetch(new Request(url, request));

      if (mdResponse.ok) {
        return new Response(mdResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
          },
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
