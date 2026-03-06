import { Button, ButtonProps, mergeClasses } from '@expo/styleguide';

import { FOOTNOTE } from '~/ui/components/Text';

export type SnippetActionProps = ButtonProps & {
  alwaysDark?: boolean;
};

export const SnippetAction = ({
  children,
  leftSlot,
  rightSlot,
  className,
  alwaysDark = false,
  ...rest
}: SnippetActionProps) => {
  return (
    <Button
      size="xs"
      theme="quaternary"
      leftSlot={leftSlot}
      rightSlot={rightSlot}
      className={mergeClasses(
        'gap-1.5 focus-visible:-outline-offset-2',
        alwaysDark &&
          'dark-theme hocus:border-palette-gray9 hocus:bg-palette-gray5 hocus:shadow-xs border-transparent bg-transparent',
        !alwaysDark &&
          'border-l-default hocus:bg-subtle hocus:shadow-none h-10 rounded-none border-0 border-l leading-10',
        className
      )}
      {...rest}>
      {children && (
        <FOOTNOTE className={mergeClasses(alwaysDark && 'text-palette-white!')}>
          {children}
        </FOOTNOTE>
      )}
    </Button>
  );
};
