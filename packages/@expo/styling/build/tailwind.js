"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTailwind = void 0;
const path_1 = __importDefault(require("path"));
const build_1 = require("tailwindcss/lib/cli/build");
function withTailwind(config, { input = path_1.default.relative(process.cwd(), "./global.css"), output = path_1.default.resolve(process.cwd(), "node_modules/.cache/expo/global.css"), } = {}) {
    const getTransformOptions = async (entryPoints, options, getDependenciesOf) => {
        var _a, _b;
        process.stdout.clearLine(0);
        await (0, build_1.build)({
            "--input": input,
            "--output": output,
            "--watch": options.dev ? "always" : false,
            "--poll": true,
        });
        return (_b = (_a = config.transformer) === null || _a === void 0 ? void 0 : _a.getTransformOptions) === null || _b === void 0 ? void 0 : _b.call(_a, entryPoints, options, getDependenciesOf);
    };
    return {
        ...config,
        resolver: {
            ...config.resolver,
            sourceExts: [...config.resolver.sourceExts, "css"],
        },
        transformerPath: require.resolve("@expo/styling/transformer"),
        transformer: {
            ...config.transformer,
            getTransformOptions,
            externallyManagedCss: {
                [input]: output,
            },
        },
    };
}
exports.withTailwind = withTailwind;
//# sourceMappingURL=tailwind.js.map