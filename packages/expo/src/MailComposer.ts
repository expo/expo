import { NativeModules } from 'react-native';

const { ExponentMailComposer } = NativeModules;

type ComposeOptions = {
  recipients?: string[],
  ccRecipients?: string[],
  bccRecipients?: string[],
  subject?: string,
  body?: string,
  isHtml?: boolean,
  attachments?: string[],
};

type ComposeResult = {
  status: ComposeStatus,
};

type ComposeStatus = 'sent' | 'saved' | 'cancelled';

export async function composeAsync(options: ComposeOptions): Promise<ComposeResult> {
  return ExponentMailComposer.composeAsync(options);
}
