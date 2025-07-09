import { mergeClasses } from '@expo/styleguide';
import { cloneElement, PropsWithChildren, ReactElement } from 'react';

type Props = PropsWithChildren<{
  component: ReactElement<{ className?: string }>;
  className?: string;
}>;

export function PermalinkBase({ component, children, className, ...rest }: Props) {
  return cloneElement(
    component,
    {
      className: mergeClasses(className, component.props.className),
      ...rest,
    },
    children
  );
}
