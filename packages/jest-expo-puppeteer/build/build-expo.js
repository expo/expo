"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const process = require('process');
const path = require('path');
const { Webpack } = require('@expo/xdl');
function main(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectRoot = path.resolve(args[0]);
        console.log('Building', projectRoot);
        try {
            yield Webpack.bundleAsync(projectRoot, {
                nonInteractive: true,
                verbose: true,
                mode: 'production',
                webpackEnv: {
                    removeUnusedImportExports: true,
                },
            });
            process.exit(0);
        }
        catch (error) {
            console.log(error);
            process.exit(1);
        }
    });
}
if (require.main === module) {
    main(process.argv.slice(2));
}
//# sourceMappingURL=build-expo.js.map