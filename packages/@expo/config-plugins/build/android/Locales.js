"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocales = getLocales;
exports.setLocalesAsync = setLocalesAsync;
exports.withLocales = void 0;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _() {
  const data = require("..");
  _ = function () {
    return data;
  };
  return data;
}
function _XML() {
  const data = require("../utils/XML");
  _XML = function () {
    return data;
  };
  return data;
}
function _locales() {
  const data = require("../utils/locales");
  _locales = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const withLocales = config => {
  return (0, _().withDangerousMod)(config, ['android', async config => {
    config.modResults = await setLocalesAsync(config, {
      projectRoot: config.modRequest.projectRoot
    });
    return config;
  }]);
};
exports.withLocales = withLocales;
function getLocales(config) {
  return config.locales ?? null;
}
async function setLocalesAsync(config, {
  projectRoot
}) {
  const locales = getLocales(config);
  if (!locales) {
    return config;
  }
  const localesMap = await (0, _locales().getResolvedLocalesAsync)(projectRoot, locales, 'android');
  for (const [lang, localizationObj] of Object.entries(localesMap)) {
    const stringsFilePath = _path().default.join(await _().AndroidConfig.Paths.getResourceFolderAsync(projectRoot), `values-b+${lang.replaceAll('-', '+')}`, 'strings.xml');
    (0, _XML().writeXMLAsync)({
      path: stringsFilePath,
      xml: {
        resources: Object.entries(localizationObj).map(([k, v]) => ({
          string: {
            $: {
              name: k
            },
            _: `"${v}"`
          }
        }))
      }
    });
  }
  return config;
}
//# sourceMappingURL=Locales.js.map