import { requireNativeView } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

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

function transformFormProps(props: FormProps): FormProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

export function Form(props: FormProps) {
  return <FormNativeView {...transformFormProps(props)} />;
}
