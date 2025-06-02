import { requireNativeView } from 'expo';

import { type CommonViewModifierProps } from './types';

export interface FormProps extends CommonViewModifierProps {
  children: React.ReactNode;

  /**
   * Makes the form scrollable.
   * @default true
   * @platform ios 16.0+
   */
  scrollEnabled?: boolean;
}

const FormNativeView: React.ComponentType<FormProps> = requireNativeView('ExpoUI', 'FormView');

export function Form(props: FormProps) {
  return <FormNativeView {...props} />;
}
