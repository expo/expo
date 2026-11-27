import ExpoUI from './modules/expo-ui';

const nativeModuleStubs: Record<string, any> = { ExpoUI };

// The objects of `expo.packages`. List each view that `@expo/ui` registers for its package (a public `@ExpoView`).
const nativePackageStubs: Record<string, Record<string, any>> = {
  '@expo/ui': {
    ColorPickerView: createViewStub('ColorPickerView'),
    ConcentricRectangleView: createViewStub('ConcentricRectangleView'),
    FormView: createViewStub('FormView'),
    GlassEffectContainerView: createViewStub('GlassEffectContainerView'),
    GridRowView: createViewStub('GridRowView'),
    GridView: createViewStub('GridView'),
    GroupView: createViewStub('GroupView'),
    LazyHStackView: createViewStub('LazyHStackView'),
    LazyVStackView: createViewStub('LazyVStackView'),
    ListView: createViewStub('ListView'),
    NamespaceView: createViewStub('NamespaceView'),
    NavigationLinkView: createViewStub('NavigationLinkView'),
    ScrollViewComponent: createViewStub('ScrollViewComponent'),
    StepperView: createViewStub('StepperView'),
    ToggleView: createViewStub('ToggleView'),
  },
};

export function requireNativeModule(name: string) {
  return nativeModuleStubs[name] ?? {};
}

export function requireOptionalNative(packageName: string) {
  return nativePackageStubs[packageName] ?? null;
}

export function requireNativeView(moduleName: string, viewName: string) {
  return createViewStub(viewName);
}

function createViewStub(viewName: string) {
  const wrapper = {
    [viewName]: (props?: Record<string, any>) => {
      return {
        type: viewName,
        props: props || {},
      };
    },
  };
  return wrapper[viewName] as unknown as React.ComponentType<any>;
}
