import ExpoUI from './modules/expo-ui';

const nativeModuleStubs: Record<string, any> = { ExpoUI };

export function requireNativeModule(name: string) {
  return nativeModuleStubs[name] ?? {};
}

export function requireNativeView(moduleName: string, viewName: string) {
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
