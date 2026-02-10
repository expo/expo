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

      const contentType = mdResponse.headers.get("Content-Type") || "";
      if (mdResponse.ok && contentType.includes("text/markdown")) {
        return new Response(mdResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
          },
        });
      }

      return new Response("Not found\n", { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
