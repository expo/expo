# Imports the base schema for workerd configuration files.
# Refer to the comments in /src/workerd/server/workerd.capnp for more details.
using Workerd = import "/workerd/workerd.capnp";

# Config for the middleware-mode export: E2E_ROUTER_SERVER_MIDDLEWARE=true with redirects and
# rewrites configured, no server rendering and no loaders. The module list mirrors that mode's
# `server/` output.
const serverConfig :Workerd.Config = (
  services = [ (name = "main", worker = .server) ],
  sockets = [ ( name = "http", address = "*:8787", http = (), service = "main" ) ]
);

const server :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "workerd.js"),
    (name = "(group)/index.html", text = embed "(group)/index.html"),
    (name = "+not-found.html", text = embed "+not-found.html"),
    (name = "_sitemap.html", text = embed "_sitemap.html"),
    (name = "about.html", text = embed "about.html"),
    (name = "asset.html", text = embed "asset.html"),
    (name = "blog/[post].html", text = embed "blog/[post].html"),
    (name = "blog/other.html", text = embed "blog/other.html"),
    (name = "blog/welcome-to-the-universe.html", text = embed "blog/welcome-to-the-universe.html"),
    (name = "catch-all/[...post].html", text = embed "catch-all/[...post].html"),
    (name = "catch-all/other.html", text = embed "catch-all/other.html"),
    (name = "catch-all/welcome-to-the-universe.html", text = embed "catch-all/welcome-to-the-universe.html"),
    (name = "env.html", text = embed "env.html"),
    (name = "error.html", text = embed "error.html"),
    (name = "index.html", text = embed "index.html"),
    (name = "links.html", text = embed "links.html"),
    (name = "meta.html", text = embed "meta.html"),
    (name = "metadata-async/[id].html", text = embed "metadata-async/[id].html"),
    (name = "metadata.html", text = embed "metadata.html"),
    (name = "nested/index.html", text = embed "nested/index.html"),
    (name = "no-loader.html", text = embed "no-loader.html"),
    (name = "nullish/[value].html", text = embed "nullish/[value].html"),
    (name = "nullish/null.html", text = embed "nullish/null.html"),
    (name = "nullish/undefined.html", text = embed "nullish/undefined.html"),
    (name = "posts/[postId].html", text = embed "posts/[postId].html"),
    (name = "posts/static-post-1.html", text = embed "posts/static-post-1.html"),
    (name = "posts/static-post-2.html", text = embed "posts/static-post-2.html"),
    (name = "redirect.html", text = embed "redirect.html"),
    (name = "request.html", text = embed "request.html"),
    (name = "response.html", text = embed "response.html"),
    (name = "second.html", text = embed "second.html"),
    (name = "server-helper.html", text = embed "server-helper.html"),
    (name = "static-helper.html", text = embed "static-helper.html"),
    (name = "styled.html", text = embed "styled.html"),
    (name = "_expo/functions/+middleware.js", commonJsModule = embed "_expo/functions/+middleware.js"),
    (name = "_expo/functions/api+api.js", commonJsModule = embed "_expo/functions/api+api.js"),
    (name = "_expo/functions/data+api.js", commonJsModule = embed "_expo/functions/data+api.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
