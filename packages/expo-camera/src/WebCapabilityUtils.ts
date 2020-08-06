/*
 * Native web camera (Android) has a torch: boolean
 */
export function convertFlashModeJSONToNative(input: string): boolean {
  switch (input) {
    case 'torch':
      return true;
    case 'on':
    case 'off':
    case 'auto':
    default:
      return false;
  }
}

export function convertWhiteBalanceJSONToNative(input: string): MeteringMode | undefined {
  switch (input) {
    case 'on':
    case 'auto':
      return 'continuous';
    case 'off':
      return 'none';
    case 'singleShot':
      return 'single-shot';
    default:
      return undefined;
  }
}

export function convertAutoFocusJSONToNative(input: string): MeteringMode | undefined {
  switch (input) {
    case 'on':
    case 'auto':
      return 'continuous';
    case 'off':
      return 'manual';
    case 'singleShot':
      return 'single-shot';
    default:
      return undefined;
  }
}
