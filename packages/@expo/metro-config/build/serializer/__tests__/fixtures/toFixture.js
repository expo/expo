"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFixture = exports.simplifyGraph = void 0;
function modifyDep(mod) {
    return {
        dependencies: Object.fromEntries([...mod.dependencies.entries()].map(([key, value]) => {
            return [key, value];
        })),
        getSource: '[MOCK_FUNCTION]',
        inverseDependencies: Array.from(mod.inverseDependencies),
        path: mod.path,
        output: mod.output.map((output) => ({
            type: output.type,
            data: { ...output.data, map: [], code: '...', functionMap: {} },
        })),
    };
}
function simplifyGraph(graph) {
    return {
        ...graph,
        dependencies: Object.fromEntries([...graph.dependencies.entries()].map(([key, value]) => {
            return [key, modifyDep(value)];
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
function toFixture(...props) {
    const [entryFile, preModules, graph, options] = props;
    console.log('DATA:\n\n');
    console.log(require('util').inspect([
        entryFile,
        preModules.map((mod) => modifyDep(mod)),
        simplifyGraph(graph),
        {
            ...options,
            processModuleFilter: '[Function: processModuleFilter]',
            createModuleId: '[Function (anonymous)]',
            getRunModuleStatement: '[Function: getRunModuleStatement]',
            shouldAddToIgnoreList: '[Function: shouldAddToIgnoreList]',
        },
    ], { depth: 5000 }));
    console.log('\n\n....');
}
exports.toFixture = toFixture;
