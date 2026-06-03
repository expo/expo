export const mockNativeViewRender = jest.fn();

class MockObservableState {
  private currentValue: unknown;

  constructor({ value }: { value: unknown }) {
    this.currentValue = value;
  }

  getValue() {
    return this.currentValue;
  }

  setValue({ value }: { value: unknown }) {
    this.currentValue = value;
  }

  setOnChange() {}

  release() {}
}

export function createExpoUIMock() {
  return {
    requireNativeModule: jest.fn(() => ({
      ObservableState: MockObservableState,
      getMaterialColors: jest.fn(() => ({})),
      isDynamicColorAvailable: false,
    })),
    requireNativeView: jest.fn((moduleName: string, viewName: string) => {
      const { createElement } = require('react');
      const { View } = require('react-native');

      function MockNativeView(props: Record<string, unknown>) {
        mockNativeViewRender({ moduleName, viewName, props });
        return createElement(View, props);
      }

      MockNativeView.displayName = `${moduleName}.${viewName}`;
      return MockNativeView;
    }),
  };
}
