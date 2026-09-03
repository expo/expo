import { detectSandbox } from 'sandbox-cli-detector';

import { debugEvent as event } from '../events';

type SandboxTelemetryContext = string | null;

let sandboxTelemetryContext: SandboxTelemetryContext | undefined;

export function getSandboxTelemetryContext(): SandboxTelemetryContext {
  if (sandboxTelemetryContext === undefined) {
    sandboxTelemetryContext = resolveSandboxTelemetryContext();
  }

  return sandboxTelemetryContext;
}

function resolveSandboxTelemetryContext(): SandboxTelemetryContext {
  try {
    const { detected, sandbox } = detectSandbox();
    if (!detected || sandbox == null) {
      return null;
    }
    return sandbox.id;
  } catch (error: any) {
    event('sandbox_detect_failed', { error: event.error(error as Error) });
    return null;
  }
}
