export const name = 'ExpoUIMeasurement';

// The real cases live in the platform files: hosted React Native content is positioned by SwiftUI or
// Compose, and there is nothing to measure anywhere else. This exists so the module resolves on
// other platforms, since `TestModules` requires it without an extension.
export async function test({ describe, it }: any) {
  describe(name, () => {
    it('is only implemented on iOS and Android', () => {});
  });
}
