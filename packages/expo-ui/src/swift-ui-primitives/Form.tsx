import { requireNativeView } from 'expo';

export type FormProps = {
  children: React.ReactNode;
};

const FormNativeView: React.ComponentType<FormProps> = requireNativeView('ExpoUI', 'FormView');

export function Form(props: FormProps) {
  return <FormNativeView {...props} />;
}
