"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xdl_1 = require("@expo/xdl");
const path_1 = __importDefault(require("path"));
function main(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectRoot = path_1.default.resolve(args[0]);
        console.log('Building', projectRoot);
        try {
            yield xdl_1.Webpack.bundleAsync(projectRoot, {
                nonInteractive: true,
                mode: 'production',
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