import { CodedError } from 'expo-modules-core';

export class ClipboardUnavailableException extends CodedError {
  constructor() {
    super('ERR_CLIPBOARD_UNAVAILABLE', "The 'AsyncClipboard' API is not available on this browser");
  }
}

export class CopyFailureException extends CodedError {
  constructor(cause: string) {
    super('ERR_COPY_FAILURE', `Failed to copy to clipboard: ${cause}`);
  }
}

export class PasteFailureException extends CodedError {
  constructor(cause: string) {
    super('ERR_COPY_FAILURE', `Failed to paste from clipboard: ${cause}`);
  }
}

export class NoPermissionException extends CodedError {
  constructor() {
    super('ERR_NO_PERMISSION', 'User denied permission to access clipboard');
  }
}
