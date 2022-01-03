#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.expoConfig = void 0;
var _chalk = _interopRequireDefault(require("chalk"));
var Log = _interopRequireWildcard(require("../log"));
var _args = require("../utils/args");
var _configAsync = require("./configAsync");
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
const expoConfig = (argv)=>{
    const args = (0, _args).assertArgs({
        // Types
        '--help': Boolean,
        '--full': Boolean,
        '--json': Boolean,
        '--type': String,
        // Aliases
        '-h': '--help',
        '-t': '--type'
    }, argv);
    if (args['--help']) {
        Log.exit(_chalk.default`
      {bold Description}
        Show the project config

      {bold Usage}
        $ expo config <dir>

      <dir> represents the directory of the Expo application.
      If no directory is provided, the current directory will be used.

      Options
      --full                                   Include all project config data
      --json                                   Output in JSON format
      -t, --type <public|prebuild|introspect>  Type of config to show
      -h, --help                               output usage information
    `, 0);
    }
    return (0, _configAsync).configAsync((0, _args).getProjectRoot(args), {
        // Parsed options
        full: args['--full'],
        json: args['--json'],
        type: args['--type']
    }).catch((err)=>{
        Log.exit(err);
    });
};
exports.expoConfig = expoConfig;

//# sourceMappingURL=index.js.map