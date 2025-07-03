"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMyCli = runMyCli;
const extension_1 = require("./extension");
// Usage example with proper type safety
async function runMyCli() {
    await (0, extension_1.cliExtension)(async (params) => {
        // Type narrowing works perfectly here
        if (params.command === 'list') {
            // params.args is now typed as { filter?: string; limit?: number; verbose?: boolean }
            console.log(`Listing with filter: ${params.args.filter}`);
            console.log(`Limit: ${params.args.limit ?? 10}`);
            console.log(`Verbose: ${params.args.verbose ?? false}`);
        }
        else if (params.command === 'deploy') {
            // params.args is now typed as { environment: string; force?: boolean; dryRun?: boolean }
            console.log(`Deploying to: ${params.args.environment}`); // TypeScript knows this is required
            console.log(`Force: ${params.args.force ?? false}`);
            console.log(`Dry run: ${params.args.dryRun ?? false}`);
        }
        else if (params.command === 'test') {
            // params.args is now typed as { pattern?: string; watch?: boolean; coverage?: boolean }
            console.log(`Test pattern: ${params.args.pattern ?? '**/*.test.js'}`);
            console.log(`Watch mode: ${params.args.watch ?? false}`);
            console.log(`Coverage: ${params.args.coverage ?? false}`);
        }
        else {
            // TypeScript will warn you if you haven't handled all cases
            const _exhaustive = params;
            throw new Error(`Unknown command: ${params.command}`);
        }
        // Access to connected apps
        console.log(`Connected apps: ${params.apps.length}`);
        params.apps.forEach((app) => {
            console.log(`- ${app.appId} on ${app.deviceName}`);
        });
    });
}
//# sourceMappingURL=example.js.map