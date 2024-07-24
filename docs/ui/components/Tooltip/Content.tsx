import { mergeClasses } from '@expo/styleguide';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HTMLAttributes } from 'react';

type TooltipContentProps = TooltipPrimitive.TooltipContentProps & HTMLAttributes<HTMLDivElement>;

export function Content({ children, className, sideOffset = 4, ...rest }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={mergeClasses(
          'dark-theme flex flex-col rounded-md bg-palette-gray2 px-3 py-1.5 text-default shadow-md',
          'data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade',
          className
        )}
        {...rest}>
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
