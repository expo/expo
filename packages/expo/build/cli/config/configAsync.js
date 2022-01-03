"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.logConfig = logConfig;
exports.configAsync = configAsync;
var _config = require("@expo/config");
var _modCompiler = require("@expo/config-plugins/build/plugins/mod-compiler");
var _prebuildConfig = require("@expo/prebuild-config");
var _assert = _interopRequireDefault(require("assert"));
var _util = _interopRequireDefault(require("util"));
var Log = _interopRequireWildcard(require("../Log"));
var _errors = require("../utils/errors");
var _profile = require("../utils/profile");
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for(var key in obj){
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};
                    if (desc.get || desc.set) {
                        Object.defineProperty(newObj, key, desc);
                    } else {
                        newObj[key] = obj[key];
                    }
                }
            }
        }
        newObj.default = obj;
        return newObj;
    }
}
function logConfig(config) {
    const isObjStr = (str)=>/^\w+: {/g.test(str)
    ;
    Log.log(_util.default.inspect(config, {
        colors: true,
        compact: false,
        // Sort objects to the end so that smaller values aren't hidden between large objects.
        sorted (a, b) {
            if (isObjStr(a)) return 1;
            if (isObjStr(b)) return -1;
            return 0;
        },
        showHidden: false,
        depth: null
    }));
}
async function configAsync(projectRoot, options) {
    if (options.type) {
        _assert.default.match(options.type, /public|prebuild|introspect/);
    }
    let config;
    if (options.type === 'prebuild') {
        config = await (0, _profile).profile(_prebuildConfig.getPrebuildConfigAsync)(projectRoot, {
            platforms: [
                'ios',
                'android'
            ]
        });
    } else if (options.type === 'introspect') {
        config = await (0, _profile).profile(_prebuildConfig.getPrebuildConfigAsync)(projectRoot, {
            platforms: [
                'ios',
                'android'
            ]
        });
        await (0, _modCompiler).compileModsAsync(config.exp, {
            projectRoot,
            introspect: true,
            platforms: [
                'ios',
                'android'
            ],
            assertMissingModProviders: false
        });
        // @ts-ignore
        delete config.modRequest;
        // @ts-ignore
        delete config.modResults;
    } else if (options.type === 'public') {
        config = (0, _profile).profile(_config.getConfig)(projectRoot, {
            skipSDKVersionRequirement: true,
            isPublicConfig: true
        });
    } else if (options.type) {
        throw new _errors.CommandError(`Invalid option: --type ${options.type}. Valid options are: public, prebuild`);
    } else {
        config = (0, _profile).profile(_config.getConfig)(projectRoot, {
            skipSDKVersionRequirement: true
        });
    }
    const configOutput = options.full ? config : config.exp;
    if (!options.json) {
        Log.log();
        logConfig(configOutput);
        Log.log();
    } else {
        Log.log(JSON.stringify(configOutput));
    }
}

//# sourceMappingURL=configAsync.js.map