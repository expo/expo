declare module 'react-native/Libraries/NativeComponent/NativeComponentRegistry' {
  import type { HostComponent } from 'react-native';

  export function get<Props>(
    name: string,
    register: () => {
      uiViewClassName: string;
      validAttributes?: Record<string, any>;
      directEventTypes?: Record<string, { registrationName: string }>;
    }
  ): HostComponent<Props>;
}
