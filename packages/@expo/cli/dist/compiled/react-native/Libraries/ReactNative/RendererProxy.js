Object.defineProperty(exports, "__esModule", {
  value: true
});
var _RendererImplementation = require("./RendererImplementation");
Object.keys(_RendererImplementation).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _RendererImplementation[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _RendererImplementation[key];
    }
  });
});