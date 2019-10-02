import ExpoMailComposer from './ExpoMailComposer';
import { ComposeOptions, ComposeResult } from './MailComposer.types';

export async function composeAsync(options: ComposeOptions): Promise<ComposeResult> {
  return await ExpoMailComposer.composeAsync(options);
}
