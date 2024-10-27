import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Children, isValidElement, NamedExoticComponent } from 'react';

export function Trigger({ children, asChild, ...rest }: TooltipPrimitive.TooltipTriggerProps) {
  if (process.env.NODE_ENV === 'development' && !asChild) {
    Children.forEach(children, child => {
      if (
        isValidElement(child) &&
        !child.props?.href &&
        typeof child.type === 'object' &&
        (child.type as NamedExoticComponent)?.displayName === 'Button'
      ) {
        throw Error(
          'If wrapping button with tooltip trigger use `asChild` prop to prevent hydration issues'
        );
      }
    });
  }
  return (
    <TooltipPrimitive.Trigger asChild={asChild} {...rest}>
      {children}
    </TooltipPrimitive.Trigger>
  );
}
