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

const AGENT_INSTRUCTIONS_BLOCK_REGEX =
  /<AgentInstructions>[\S\s]*?<\/AgentInstructions>\n*/g;

function stripAgentInstructions(markdown) {
  return markdown.replace(AGENT_INSTRUCTIONS_BLOCK_REGEX, "");
}

function directMarkdownAssetPath(pathname) {
  if (pathname === "/index.md" || pathname.endsWith("/index.md")) {
    return pathname;
  }
  return pathname.replace(/\.md$/, "/index.md");
}

async function markdownResponse(mdResponse, excludeAgentInstructions) {
  const body = excludeAgentInstructions
    ? stripAgentInstructions(await mdResponse.text())
    : mdResponse.body;

  return new Response(body, {
    status: mdResponse.status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env) {
    const accept = request.headers.get("Accept") || "";
    const url = new URL(request.url);
    const excludeAgentInstructions =
      url.searchParams.get("includeAgentInstructions") === "false";

    if (url.pathname.endsWith(".md")) {
      url.pathname = directMarkdownAssetPath(url.pathname);
      const mdResponse = await env.ASSETS.fetch(new Request(url, request));
      const contentType = mdResponse.headers.get("Content-Type") || "";

      if (mdResponse.ok && contentType.includes("text/markdown")) {
        if (!excludeAgentInstructions) {
          return mdResponse;
        }
        return markdownResponse(mdResponse, excludeAgentInstructions);
      }
      return mdResponse;
    }

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
          return markdownResponse(mdResponse, excludeAgentInstructions);
        }
      }

      return new Response("Not found\n", { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
