import { LanguageModelError, normalizeError } from './LanguageModelError';
import type { ToolContext, ToolDefinition } from './LanguageModels.types';
import type { NativeSession } from './NativeLanguageModels.types';
import { schema } from './schemaHelpers';

export type AppleToolKind = 'ocr' | 'barcode';
const inputSchema = schema.object({
  image: schema.string({ description: 'The label of an image attached to the current request.' }),
});
const handlers = new WeakMap<object, AppleToolKind>();
const contexts = new WeakMap<ToolContext, NativeSession>();

function createTool(kind: AppleToolKind, description: string): ToolDefinition<typeof inputSchema> {
  const execute = async ({ image }: { image: string }, context: ToolContext): Promise<unknown> => {
    const native = contexts.get(context);
    if (!native?.executeBuiltinToolAsync) {
      throw new LanguageModelError(
        'ERR_UNSUPPORTED_FEATURE',
        'Apple image tools must run inside an Apple language model request.'
      );
    }
    try {
      return JSON.parse(await native.executeBuiltinToolAsync(context.callId, kind, image));
    } catch (cause) {
      throw normalizeError(cause, 'ERR_TOOL_FAILED', 'The Apple image tool failed.');
    }
  };
  handlers.set(execute, kind);
  return Object.freeze({ name: `expo_${kind}`, description, inputSchema, execute });
}

/** @hidden */
export const appleTools = Object.freeze({
  ocr: createTool('ocr', 'Read text from a labeled image attached to the current request.'),
  barcode: createTool(
    'barcode',
    'Read barcode and QR code values from a labeled image attached to the current request.'
  ),
});

export function appleToolKind(execute: object): AppleToolKind | undefined {
  return handlers.get(execute);
}

/** Bind only the approved handler's context, and release it when execution settles. */
export async function withAppleToolContext<T>(
  context: ToolContext,
  native: NativeSession,
  execute: () => Promise<T>
): Promise<T> {
  contexts.set(context, native);
  try {
    return await execute();
  } finally {
    contexts.delete(context);
  }
}
