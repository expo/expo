const lazyImportsBlacklist = require("./lazy-imports-blacklist");

module.exports = function(api, options = {}) {
  const { web = {}, native = {} } = options;
  const isWeb = api.caller(isTargetWeb);
  const platformOptions = isWeb
    ? { disableImportExportTransform: true, ...web }
    : { disableImportExportTransform: false, ...native };

  // Note that if `options.lazy` is not set (i.e., `null` or `undefined`),
  // `metro-react-native-babel-preset` will handle it.
  const lazyOption = options && options.lazy;

  return {
    presets: [
      [
        require("metro-react-native-babel-preset"),
        {
          disableImportExportTransform:
            platformOptions.disableImportExportTransform,
          lazyImportExportTransform:
            lazyOption === true
              ? importModuleSpecifier => {
                  // Do not lazy-initialize packages that are local imports (similar to `lazy: true` behavior)
                  // or are in the blacklist.
                  return !(
                    importModuleSpecifier.includes("./") ||
                    lazyImportsBlacklist.has(importModuleSpecifier)
                  );
                }
              : // Pass the option directly to `metro-react-native-babel-preset`
                // (which in turns pass it to `babel-plugin-transform-modules-commonjs`).
                lazyOption
        }
      ]
    ],
    plugins: [
      [
        "babel-plugin-module-resolver",
        {
          alias: {
            "react-native-vector-icons": "@expo/vector-icons"
          }
        }
      ],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      isWeb && ["babel-plugin-react-native-web"]
    ].filter(Boolean)
  };
};

function isTargetWeb(caller) {
  return caller && caller.name === "babel-loader";
}
