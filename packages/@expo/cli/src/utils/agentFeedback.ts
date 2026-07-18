import { isInteractive } from './interactive';
import { getAgentTelemetryContext } from './telemetry/utils/agent';

export function installAgentFeedback(command: string): void {
  if (isInteractive() || !getAgentTelemetryContext()) {
    return;
  }

  process.once('exit', () => {
    process.stdout.write(
      `\nExpo CLI issue? Report it: npx --yes submit-expo-feedback --category expo-cli --subject ${JSON.stringify(command)} "<what happened and how to reproduce>"\n`
    );
  });
}
