"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBuildPodfilePropsConfigPlugin = void 0;
Object.defineProperty(exports, "updateIosBuildPropertiesFromConfig", {
  enumerable: true,
  get: function () {
    return AppleImpl().updateAppleBuildPropertiesFromConfig;
  }
});
Object.defineProperty(exports, "updateIosBuildProperty", {
  enumerable: true,
  get: function () {
    return AppleImpl().updateAppleBuildProperty;
  }
});
exports.withJsEnginePodfileProps = void 0;
function AppleImpl() {
  const data = _interopRequireWildcard(require("../apple/BuildProperties"));
  AppleImpl = function () {
    return data;
  };
  return data;
}
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * Creates a `withPodfileProperties` config-plugin based on given config to property mapping rules.
 *
 * The factory supports two modes from generic type inference
 * ```ts
 * // config-plugin without `props`, it will implicitly use the expo config as source config.
 * createBuildPodfilePropsConfigPlugin<ExpoConfig>(): ConfigPlugin<void>;
 *
 * // config-plugin with a parameter `props: CustomType`, it will use the `props` as source config.
 * createBuildPodfilePropsConfigPlugin<CustomType>(): ConfigPlugin<CustomType>;
 * ```
 *
 * @param configToPropertyRules config to property mapping rules
 * @param name the config plugin name
 */
const createBuildPodfilePropsConfigPlugin = exports.createBuildPodfilePropsConfigPlugin = AppleImpl().createBuildPodfilePropsConfigPlugin('ios');

/**
 * A config-plugin to update `ios/Podfile.properties.json` from the `jsEngine` in expo config
 */
const withJsEnginePodfileProps = exports.withJsEnginePodfileProps = AppleImpl().withJsEnginePodfileProps('ios');
//# sourceMappingURL=BuildProperties.js.map