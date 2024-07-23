import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function Root({ children, delayDuration = 0, ...rest }: TooltipPrimitive.TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration} {...rest}>
      {children}
    </TooltipPrimitive.Root>
  );
}
