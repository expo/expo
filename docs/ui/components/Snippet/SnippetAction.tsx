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
          'dark-theme border-transparent bg-transparent hocus:border-palette-gray9 hocus:bg-palette-gray5 hocus:shadow-xs',
        className
      )}
      {...rest}>
      {children && (
        <FOOTNOTE
          className={mergeClasses(
            'leading-none font-medium text-button-quaternary',
            alwaysDark && 'text-palette-white!'
          )}>
          {children}
        </FOOTNOTE>
      )}
    </Button>
  );
};
