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
    (name = "_expo/server/render.js", commonJsModule = embed "_expo/server/render.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
    (name = "_expo/loaders/env.js", commonJsModule = embed "_expo/loaders/env.js"),
    (name = "_expo/loaders/second.js", commonJsModule = embed "_expo/loaders/second.js"),
    (name = "_expo/loaders/posts/[postId].js", commonJsModule = embed "_expo/loaders/posts/[postId].js"),
    (name = "_expo/loaders/nullish/[value].js", commonJsModule = embed "_expo/loaders/nullish/[value].js"),
    (name = "_expo/loaders/request.js", commonJsModule = embed "_expo/loaders/request.js"),
    (name = "_expo/loaders/response.js", commonJsModule = embed "_expo/loaders/response.js"),
  ],
  bindings = [
    (name = "TEST_SECRET_RUNTIME_KEY", text = "runtime-secret-value"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
