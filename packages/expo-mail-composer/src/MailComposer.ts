import ExponentMailComposer from './ExponentMailComposer';
import { ComposeOptions, ComposeResult } from './MailComposer.types';

export async function composeAsync(options: ComposeOptions): Promise<ComposeResult> {
  return await ExponentMailComposer.composeAsync(options);
}
