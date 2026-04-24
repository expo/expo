"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function _configplugins() {
    const data = require("expo/config-plugins");
    _configplugins = function() {
        return data;
    };
    return data;
}
const pkg = require('../../package.json');
const withBrightness = (config)=>{
    return _configplugins().AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.WRITE_SETTINGS'
    ]);
};
const _default = (0, _configplugins().createRunOncePlugin)(withBrightness, pkg.name, pkg.version);

//# sourceMappingURL=withBrightness.js.map
