# Imports the base schema for workerd configuration files.
# Refer to the comments in /src/workerd/server/workerd.capnp for more details.
using Workerd = import "/workerd/workerd.capnp";

# Config for the SSR-mode export: E2E_ROUTER_SERVER_RENDERING=true, no loaders and no
# middleware. Pages render at request time via the render module; no HTML is pre-rendered.
const serverConfig :Workerd.Config = (
  services = [ (name = "main", worker = .server) ],
  sockets = [ ( name = "http", address = "*:8787", http = (), service = "main" ) ]
);

const server :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "workerd.js"),
    (name = "_expo/server/render.js", commonJsModule = embed "_expo/server/render.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
    (name = "_expo/functions/api+api.js", commonJsModule = embed "_expo/functions/api+api.js"),
    (name = "_expo/functions/data+api.js", commonJsModule = embed "_expo/functions/data+api.js"),
  ],
  bindings = [
    (name = "EXPO_PUBLIC_TEST_VALUE", text = "foobar"),
    (name = "EXPO_NOT_PUBLIC_TEST_VALUE", text = "not-public-value"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
