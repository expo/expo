import { ExpoCliExtensionAppInfo } from './CliExtension.types';

export class SendMessageError extends Error {
  constructor(
    message: string,
    public app: ExpoCliExtensionAppInfo
  ) {
    super(message);
  }
}
