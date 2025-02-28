import { requireNativeModule } from 'expo';
import { SharedObject } from 'expo/types';
const UIModule = requireNativeModule('ExpoUI');

export type Binding<T> = {
  get(): T;
  set(newValue: T): void;
} & SharedObject<{
  onBindingValueChanged: ({ newValue }: { newValue: T }) => void;
}>;

export const StringBinding = (value: string) => {
  const nativeBinding = new UIModule.StringValueBinding(value);
  console.log({ nativeBinding });
  nativeBinding.toJSON = () => {
    console.log('TOJSON');
    // @ts-ignore
    return nativeBinding.get();
  };
  return nativeBinding as Binding<string>;
};
