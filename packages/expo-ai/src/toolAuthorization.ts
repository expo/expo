import { LanguageModelError } from './LanguageModelError';
import type { Operation } from './Operation';

export type ToolDecision = {
  callId: string;
  name: string;
  arguments: unknown;
  signal: AbortSignal;
};

type AuthorizationMessages = {
  denied: string;
  invalid: string;
};

export function snapshotToolArguments(argumentsValue: unknown): unknown {
  return JSON.parse(JSON.stringify(argumentsValue));
}

/** Runs the shared fail-closed tool authorization policy with cancellation precedence. */
export async function authorizeToolCall(
  operation: Operation,
  beforeTool: ((request: ToolDecision) => boolean | Promise<boolean>) | undefined,
  call: Omit<ToolDecision, 'arguments' | 'signal'> & { arguments: unknown },
  messages: AuthorizationMessages
): Promise<void> {
  if (!beforeTool) return;
  let decision: boolean;
  try {
    decision = await operation.run(() =>
      beforeTool({
        ...call,
        arguments: snapshotToolArguments(call.arguments),
        signal: operation.signal,
      })
    );
  } catch (cause) {
    operation.check();
    throw new LanguageModelError('ERR_TOOL_DECISION_FAILED', 'The beforeTool callback failed.', {
      cause,
    });
  }
  if (decision !== true) {
    throw new LanguageModelError(
      decision === false ? 'ERR_TOOL_DENIED' : 'ERR_TOOL_DECISION_INVALID',
      decision === false ? messages.denied : messages.invalid
    );
  }
}
