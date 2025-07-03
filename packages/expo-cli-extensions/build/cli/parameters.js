"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoCliPluginParameters = void 0;
/**
 * Returns typed parameters for an Expo CLI plugin.
 * Parameters are read from the process.
 */
const getExpoCliPluginParameters = (argv) => {
    // Extract command, args, and apps from process arguments
    const command = argv[2]?.toLowerCase();
    const argsString = argv[3] ?? '{}';
    const appsString = argv[4] ?? '[]';
    // Verify command exists
    if (!command) {
        throw new Error('No command provided.');
    }
    let args;
    let apps;
    try {
        args = JSON.parse(argsString);
    }
    catch (error) {
        throw new Error(`Invalid args JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    try {
        apps = JSON.parse(appsString);
    }
    catch (error) {
        throw new Error(`Invalid apps JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    if (!Array.isArray(apps)) {
        throw new Error('Apps parameter must be an array.');
    }
    return {
        command,
        args,
        apps,
    };
};
exports.getExpoCliPluginParameters = getExpoCliPluginParameters;
//# sourceMappingURL=parameters.js.map