"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFixture = exports.simplifyGraph = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function modifyDep(mod, dropSource = false) {
    return {
        dependencies: Object.fromEntries([...mod.dependencies.entries()].map(([key, value]) => {
            return [key, value];
        })),
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: Array.from(mod.inverseDependencies),
        path: mod.path,
        output: mod.output.map((output) => ({
            type: output.type,
            data: { ...output.data, ...(dropSource ? { map: [], code: '...', functionMap: {} } : {}) },
        })),
    };
}
function simplifyGraph(graph, dropSource = false) {
    return {
        ...graph,
        dependencies: Object.fromEntries([...graph.dependencies.entries()].map(([key, value]) => {
            return [key, modifyDep(value, dropSource)];
        })),
        entryPoints: [...graph.entryPoints.entries()],
        transformOptions: {
            ...graph.transformOptions,
            customTransformOptions: {
                ...graph.transformOptions?.customTransformOptions,
            },
        },
    };
}
exports.simplifyGraph = simplifyGraph;
function storeFixture(name, obj) {
    const filePath = path_1.default.join(__dirname.replace('metro-config/build/', 'metro-config/src/'), `${name}.json`);
    fs_1.default.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}
function toFixture(...props) {
    const [entryFile, preModules, graph, options] = props;
    const dropSource = false;
    const json = [
        entryFile,
        preModules.map((mod) => modifyDep(mod, dropSource)),
        simplifyGraph(graph, dropSource),
        {
            ...options,
            processModuleFilter: '[Function: processModuleFilter]',
            createModuleId: '[Function (anonymous)]',
            getRunModuleStatement: '[Function: getRunModuleStatement]',
            shouldAddToIgnoreList: '[Function: shouldAddToIgnoreList]',
        },
    ];
    console.log('DATA:\n\n');
    console.log(require('util').inspect(json, { depth: 5000 }));
    console.log('\n\n....');
    const hashContents = crypto_1.default.createHash('sha256').update(JSON.stringify(json)).digest('hex');
    const platform = graph.transformOptions?.platform ??
        ((options.sourceUrl ? new URL(options.sourceUrl).searchParams.get('platform') : '') ||
            'unknown_platform');
    storeFixture([path_1.default.basename(entryFile).replace(/\.[tj]sx?/, ''), platform, hashContents]
        .filter(Boolean)
        .join('-'), json);
}
exports.toFixture = toFixture;
