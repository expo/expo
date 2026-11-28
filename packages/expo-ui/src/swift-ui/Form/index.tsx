import { requireOptionalNative } from 'expo';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface FormProps extends CommonViewModifierProps {
  /**
   * The content of the form.
   */
  children: React.ReactNode;
}

// Only iOS has native views in `expo.packages`. Android also loads this file
// (through `@expo/ui/swift-ui`), and there `requireNative` would throw.
const FormNativeView: React.ComponentType<FormProps> = requireOptionalNative('@expo/ui')?.FormView;

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
