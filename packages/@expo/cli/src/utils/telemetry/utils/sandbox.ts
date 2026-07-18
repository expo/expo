import { detectSandbox } from 'sandbox-cli-detector';

import { debugEvent as event } from '../events';

type SandboxTelemetryContext = string | 'unknown';

let sandboxTelemetryContext: SandboxTelemetryContext | undefined;

export function getSandboxTelemetryContext(): SandboxTelemetryContext {
  if (sandboxTelemetryContext === undefined) {
    sandboxTelemetryContext = resolveSandboxTelemetryContext();
  }

  return sandboxTelemetryContext;
}

function resolveSandboxTelemetryContext(): SandboxTelemetryContext {
  try {
    return detectSandbox().sandbox?.id ?? 'unknown';
  } catch (error: any) {
    event('sandbox_detect_failed', { error: event.error(error as Error) });
    return 'unknown';
  }
}
