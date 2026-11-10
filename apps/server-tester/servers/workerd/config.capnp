# Refer to the comments in /src/workerd/server/workerd.capnp for more details.
using Workerd = import "/workerd/workerd.capnp";

const serverConfig :Workerd.Config = (
  services = [ (name = "main", worker = .server) ],
  sockets = [ ( name = "http", address = "*:8787", http = (), service = "main" ) ]
);

# workerd embeds modules by name. Add one entry for every exported API route under `_expo/functions/`,
# the middleware, and every exported loader under `_expo/loaders/`.
const server :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "workerd.js"),
    (name = "_expo/server/render.js", commonJsModule = embed "_expo/server/render.js"),
    (name = "_expo/routes.json", text = embed "_expo/routes.json"),
    (name = "_expo/functions/+middleware.js", commonJsModule = embed "_expo/functions/+middleware.js"),
    (name = "_expo/functions/api/[dynamic]+api.js", commonJsModule = embed "_expo/functions/api/[dynamic]+api.js"),
    (name = "_expo/functions/api/[...spread]+api.js", commonJsModule = embed "_expo/functions/api/[...spread]+api.js"),
    (name = "_expo/functions/api/empty+api.js", commonJsModule = embed "_expo/functions/api/empty+api.js"),
    (name = "_expo/functions/api/env-vars+api.js", commonJsModule = embed "_expo/functions/api/env-vars+api.js"),
    (name = "_expo/functions/api/error+api.js", commonJsModule = embed "_expo/functions/api/error+api.js"),
    (name = "_expo/functions/api/externals+api.js", commonJsModule = embed "_expo/functions/api/externals+api.js"),
    (name = "_expo/functions/api/headers+api.js", commonJsModule = embed "_expo/functions/api/headers+api.js"),
    (name = "_expo/functions/api/json+api.js", commonJsModule = embed "_expo/functions/api/json+api.js"),
    (name = "_expo/functions/api/magic-import+api.js", commonJsModule = embed "_expo/functions/api/magic-import+api.js"),
    (name = "_expo/functions/api/methods+api.js", commonJsModule = embed "_expo/functions/api/methods+api.js"),
    (name = "_expo/functions/api/redirect+api.js", commonJsModule = embed "_expo/functions/api/redirect+api.js"),
    (name = "_expo/functions/api/runtime+api.js", commonJsModule = embed "_expo/functions/api/runtime+api.js"),
    (name = "_expo/functions/api/throws+api.js", commonJsModule = embed "_expo/functions/api/throws+api.js"),
    (name = "_expo/functions/api/with-page+api.js", commonJsModule = embed "_expo/functions/api/with-page+api.js"),
    (name = "_expo/functions/routing/(a,b)/multi-group-api+api.js", commonJsModule = embed "_expo/functions/routing/(a,b)/multi-group-api+api.js"),
    (name = "_expo/functions/headers/api+api.js", commonJsModule = embed "_expo/functions/headers/api+api.js"),
    (name = "_expo/functions/errors/throw+api.js", commonJsModule = embed "_expo/functions/errors/throw+api.js"),
    (name = "_expo/functions/redirects/dynamic/[slug]/index+api.js", commonJsModule = embed "_expo/functions/redirects/dynamic/[slug]/index+api.js"),
    (name = "_expo/functions/redirects/dynamic/[slug]/[other]+api.js", commonJsModule = embed "_expo/functions/redirects/dynamic/[slug]/[other]+api.js"),
    (name = "_expo/functions/redirects/dynamic/[...catchAll]/index+api.js", commonJsModule = embed "_expo/functions/redirects/dynamic/[...catchAll]/index+api.js"),
    (name = "_expo/loaders/headers/blog.js", commonJsModule = embed "_expo/loaders/headers/blog.js"),
    (name = "_expo/loaders/errors/loader.js", commonJsModule = embed "_expo/loaders/errors/loader.js"),
    (name = "_expo/loaders/loaders/index.js", commonJsModule = embed "_expo/loaders/loaders/index.js"),
    (name = "_expo/loaders/loaders/env.js", commonJsModule = embed "_expo/loaders/loaders/env.js"),
    (name = "_expo/loaders/loaders/large-suspense.js", commonJsModule = embed "_expo/loaders/loaders/large-suspense.js"),
    (name = "_expo/loaders/loaders/meta.js", commonJsModule = embed "_expo/loaders/loaders/meta.js"),
    (name = "_expo/loaders/loaders/nested/index.js", commonJsModule = embed "_expo/loaders/loaders/nested/index.js"),
    (name = "_expo/loaders/loaders/second.js", commonJsModule = embed "_expo/loaders/loaders/second.js"),
    (name = "_expo/loaders/loaders/posts/[postId].js", commonJsModule = embed "_expo/loaders/loaders/posts/[postId].js"),
    (name = "_expo/loaders/loaders/nullish/[value].js", commonJsModule = embed "_expo/loaders/loaders/nullish/[value].js"),
    (name = "_expo/loaders/loaders/request.js", commonJsModule = embed "_expo/loaders/loaders/request.js"),
    (name = "_expo/loaders/loaders/response.js", commonJsModule = embed "_expo/loaders/loaders/response.js"),
    (name = "_expo/loaders/loaders/groups/(group)/index.js", commonJsModule = embed "_expo/loaders/loaders/groups/(group)/index.js"),
    (name = "_expo/loaders/loaders/groups/(group)/platform/[...slug].js", commonJsModule = embed "_expo/loaders/loaders/groups/(group)/platform/[...slug].js"),
    (name = "_expo/loaders/loaders/static-helper.js", commonJsModule = embed "_expo/loaders/loaders/static-helper.js"),
    (name = "_expo/loaders/loaders/server-helper.js", commonJsModule = embed "_expo/loaders/loaders/server-helper.js"),
  ],
  bindings = [
    (name = "TEST_SECRET_RUNTIME_KEY", text = "runtime-secret-value"),
    (name = "E2E_ROUTER_WEB_OUTPUT", text = "server"),
    (name = "EXPO_PUBLIC_TEST_VALUE", text = "foobar"),
    (name = "EXPO_NOT_PUBLIC_TEST_VALUE", text = "not-public-value"),
  ],
  compatibilityDate = "2025-05-05",
  compatibilityFlags = [
    "nodejs_compat",
    "global_fetch_strictly_public",
  ],
);
