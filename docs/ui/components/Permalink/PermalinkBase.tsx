import { mergeClasses } from '@expo/styleguide';
import { cloneElement, PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  component: any;
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
