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
    (name = "matching-route/alpha.html", text = embed "matching-route/alpha.html"),
    (name = "+not-found.html", text = embed "+not-found.html"),
    (name = "(alpha)/index.html", text = embed "(alpha)/index.html"),
    (name = "(alpha)/beta.html", text = embed "(alpha)/beta.html"),
    (name = "_expo/functions/matching-route/alpha+api.js", commonJsModule = embed "_expo/functions/matching-route/alpha+api.js"),
    (name = "_expo/functions/(a,b)/multi-group-api+api.js", commonJsModule = embed "_expo/functions/(a,b)/multi-group-api+api.js"),
    (name = "_expo/functions/api/error+api.js", commonJsModule = embed "_expo/functions/api/error+api.js"),
    (name = "_expo/functions/api/externals+api.js", commonJsModule = embed "_expo/functions/api/externals+api.js"),
    (name = "_expo/functions/api/redirect+api.js", commonJsModule = embed "_expo/functions/api/redirect+api.js"),
    (name = "_expo/functions/api/a/[...spread]+api.js", commonJsModule = embed "_expo/functions/api/a/[...spread]+api.js"),
    (name = "_expo/functions/api/json+api.js", commonJsModule = embed "_expo/functions/api/json+api.js"),
    (name = "_expo/functions/api/empty+api.js", commonJsModule = embed "_expo/functions/api/empty+api.js"),
    (name = "_expo/functions/api/env-vars+api.js", commonJsModule = embed "_expo/functions/api/env-vars+api.js"),
    (name = "_expo/functions/api/[dynamic]+api.js", commonJsModule = embed "_expo/functions/api/[dynamic]+api.js"),
    (name = "_expo/functions/api/problematic+api.js", commonJsModule = embed "_expo/functions/api/problematic+api.js"),
    (name = "_expo/functions/methods+api.js", commonJsModule = embed "_expo/functions/methods+api.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
    (name = "blog/[post].html", text = embed "blog/[post].html"),
    (name = "blog-ssg/abc.html", text = embed "blog-ssg/abc.html"),
    (name = "blog-ssg/[post].html", text = embed "blog-ssg/[post].html"),
    (name = "(b)/multi-group.html", text = embed "(b)/multi-group.html"),
    (name = "(a)/multi-group.html", text = embed "(a)/multi-group.html"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
