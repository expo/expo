import { isInteractive } from './interactive';
import { getAgentTelemetryContext } from './telemetry/utils/agent';

let pendingFeedback: (() => void) | undefined;

export function installAgentFeedback(command: string): void {
  if (isInteractive() || !getAgentTelemetryContext()) {
    return;
  }

  const print = () => {
    if (pendingFeedback !== print) {
      return;
    }
    pendingFeedback = undefined;
    process.removeListener('exit', print);
    process.stdout.write(
      `\nExpo CLI issue? Report it: npx --yes submit-expo-feedback@latest --category expo-cli --subject ${JSON.stringify(command)} "<what happened and how to reproduce>"\n`
    );
  };
  pendingFeedback = print;
  process.once('exit', print);
}

export function printAgentFeedback(): void {
  pendingFeedback?.();
}
