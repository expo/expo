"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMetadata = resolveMetadata;
const _ctx_1 = require("expo-router/_ctx");
const serialize_1 = require("../utils/metadata/serialize");
function getGenerateMetadata(moduleExports) {
    return typeof moduleExports.generateMetadata === 'function'
        ? moduleExports.generateMetadata
        : null;
}
async function resolveMetadata(options) {
    const routeModule = (await (0, _ctx_1.ctx)(options.route.file));
    if (!routeModule) {
        return null;
    }
    const generateMetadata = getGenerateMetadata(routeModule);
    if (!generateMetadata) {
        return null;
    }
    const metadata = await generateMetadata(options.request, options.params);
    if (metadata == null) {
        return null;
    }
    return {
        metadata,
        headNodes: (0, serialize_1.serializeMetadataToReact)(metadata),
    };
}
//# sourceMappingURL=metadata.js.map