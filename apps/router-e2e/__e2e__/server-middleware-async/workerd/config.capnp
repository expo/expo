# Imports the base schema for workerd configuration files.

# Refer to the comments in /src/workerd/server/workerd.capnp for more details.
using Workerd = import "/workerd/workerd.capnp";

const serverConfig :Workerd.Config = (
  services = [ (name = "main", worker = .server) ],
  sockets = [ ( name = "http", address = "*:8787", http = (), service = "main" ) ]
);

const server :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "workerd.js"),
    (name = "_sitemap.html", text = embed "_sitemap.html"),
    (name = "index.html", text = embed "index.html"),
    (name = "second.html", text = embed "second.html"),
    (name = "redirect.html", text = embed "redirect.html"),
    (name = "+not-found.html", text = embed "+not-found.html"),
    (name = "_expo/functions/api+api.js", commonJsModule = embed "_expo/functions/api+api.js"),
    (name = "_expo/functions/+middleware.js", commonJsModule = embed "_expo/functions/+middleware.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
