import { requireNativeView } from 'expo';

import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
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
  const { modifiers, children, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    children: markChildrenAsNestedInSwiftUI(children),
    ...restProps,
  };
}

export function Form(props: FormProps) {
  if (isMissingHost(props)) {
    return <MissingHostErrorView componentName="Form" />;
  }
  return <FormNativeView {...transformFormProps(props)} />;
}
