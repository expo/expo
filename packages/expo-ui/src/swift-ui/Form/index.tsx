import { requireNativeLayoutView } from '../../requireNativeLayoutView';
import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export interface FormProps extends CommonViewModifierProps {
  /**
   * The content of the form.
   */
  children: React.ReactNode;
}

const FormNativeView: React.ComponentType<FormProps> = requireNativeLayoutView(
  'ExpoUI',
  'FormView'
);

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
