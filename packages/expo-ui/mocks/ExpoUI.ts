/**
 * Mock of the `ExpoUI` native module, which `jest-expo` loads for `requireNativeModule('ExpoUI')`
 * in `src/ExpoUIModule.ts`. The generated mock table in `jest-expo` lists only functions and
 * constants, so it cannot describe the `ObservableState` and `WorkletCallback` classes.
 *
 * Jest has no UI runtime, so worklets never run: `setOnChange`, `setWorklet`, and `withAnimation`
 * do nothing.
 */

const SharedObject: (typeof globalThis.expo)['SharedObject'] = globalThis.expo.SharedObject;

export class ObservableState extends SharedObject {
  #value: unknown;

  constructor({ value }: { value: unknown }) {
    super();
    this.#value = value;
  }

  getValue(): unknown {
    return this.#value;
  }

  setValue({ value }: { value: unknown }): void {
    this.#value = value;
  }

  setOnChange(_callback: WorkletCallback | null): void {}
}

export class WorkletCallback extends SharedObject {
  setWorklet(_worklet: unknown): void {}
}

export async function completeRefresh(_id: string): Promise<void> {}

export async function withAnimation(
  _animation: unknown,
  _body: WorkletCallback,
  _completion: WorkletCallback | null,
  _completionCriteria: unknown
): Promise<void> {}

// Android. The sizes are the Material 3 `SwitchDefaults` and `ToggleButtonDefaults` values in dp.
export const SwitchDefaultIconSize = 16;
export const ToggleButtonIconSpacing = 8;
export const ToggleButtonIconSize = 20;
export const isDynamicColorAvailable = false;

export function getMaterialColors(_options: unknown): Record<string, string> {
  return {};
}
