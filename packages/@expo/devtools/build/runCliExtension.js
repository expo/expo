import { format } from 'util';
/**
 * Executes an Expo CLI extension command with the provided executor function.
 * This function retrieves the command, arguments, and connected applications,
 * then calls the executor with these parameters.
 *
 * @param executor - A function that takes a command, arguments, and connected applications,
 *                   and returns a Promise that resolves when the command execution is complete.
 */
export async function runCliExtension(executor) {
    const params = getExpoCliPluginParameters(process.argv);
    try {
        await executor(params, CliExtensionConsole);
    }
    catch (error) {
        for (const line of formatCliExtensionErrorLines(error)) {
            CliExtensionConsole.error(line);
        }
    }
}
/**
 * Returns typed parameters for an Expo CLI plugin. (exported for testing)
 * Parameters are read from the process.
 */
const getExpoCliPluginParameters = (argv) => {
    // Extract command, args, and apps from process arguments
    const command = argv[2]?.toLowerCase();
    const argsString = argv[3] ?? '{}';
    const metroServerOrigin = argv[4] ?? '';
    // Verify command exists
    if (!command) {
        throw new Error('No command provided.');
    }
    let args = {};
    if (!metroServerOrigin || typeof metroServerOrigin !== 'string') {
        throw new Error('Invalid metroServerOrigin parameter. It must be a non-empty string.');
    }
    try {
        args = JSON.parse(argsString);
    }
    catch (error) {
        throw new Error(`Invalid args JSON: ${error instanceof Error ? error.message : 'Unknown error'} - ${argv.join(', ')}`);
    }
    if (Array.isArray(args) || typeof args !== 'object') {
        throw new Error('Expected object for args parameter, got ' + JSON.stringify(args));
    }
    return {
        command,
        args,
        metroServerOrigin,
    };
};
export { getExpoCliPluginParameters as testing_getExpoCliPluginParameters };
// --------------- LOGGING HELPERS  ---------------
/**
 * We're wrapping console methods to output structured JSON messages.
 */
const asJson = (level, message, args) => JSON.stringify([{ type: 'text', text: format(message, ...args), level }]);
const CliExtensionConsole = {
    log: (message, ...args) => console.log(asJson('info', message, args)),
    info: (message, ...args) => console.log(asJson('info', message, args)),
    warn: (message, ...args) => console.error(asJson('warning', message, args)),
    error: (message, ...args) => console.error(asJson('error', message, args)),
    uri: (uri, altText) => {
        console.log(JSON.stringify([{ type: 'uri', uri, altText }]));
    },
};
// --------------- ERROR HELPERS  ---------------
const stripErrorPrefix = (message) => message.replace(/^Error:\s*/i, '');
const getErrorMessage = (value) => {
    if (value instanceof Error && value.message) {
        return stripErrorPrefix(value.message);
    }
    if (typeof value === 'string') {
        return stripErrorPrefix(value);
    }
    return stripErrorPrefix(String(value));
};
const getErrorCause = (value) => (value instanceof Error ? value.cause : undefined);
const formatCliExtensionErrorLines = (error) => {
    const mainMessage = getErrorMessage(error) || 'Unknown error';
    const lines = [mainMessage];
    const maxCauses = 3;
    let cause = getErrorCause(error);
    let collected = 0;
    let remaining = 0;
    while (cause) {
        if (collected < maxCauses) {
            lines.push(getErrorMessage(cause));
            collected += 1;
        }
        else {
            remaining += 1;
        }
        cause = getErrorCause(cause);
    }
    if (remaining > 0) {
        lines.push(`…and ${remaining} more issues`);
    }
    return lines;
};
//# sourceMappingURL=runCliExtension.js.map