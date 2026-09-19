import { appleTools } from './appleTools';

/**
 * Predefined local image tools. Pass these ordinary tool definitions in tools.
 * Apple Vision reads only labeled images attached to the current request.
 * beforeTool, cancellation, and maximumToolCalls apply to these tools too.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @experimental
 */
export const Tools = appleTools;
