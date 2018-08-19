// @flow

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

type Status = 'sent' | 'saved' | 'cancelled';

type Result = {
  status: Status,
};

export async function composeAsync(options: ComposeOptions): Promise<Result> {
  return ExponentMailComposer.composeAsync(options);
}
