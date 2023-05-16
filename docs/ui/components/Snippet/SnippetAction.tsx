import { Button, ButtonProps, mergeClasses } from '@expo/styleguide';

import { FOOTNOTE } from '~/ui/components/Text';

export type SnippetActionProps = ButtonProps & {
  alwaysDark?: boolean;
};

export const SnippetAction = (props: SnippetActionProps) => {
  const { children, leftSlot, rightSlot, alwaysDark = false, ...rest } = props;

  return (
    <Button
      size="xs"
      theme="quaternary"
      leftSlot={leftSlot}
      rightSlot={rightSlot}
      className={mergeClasses(
        alwaysDark &&
          'dark-theme border-transparent bg-[transparent] hocus:shadow-xs hocus:border-palette-gray9 hocus:bg-palette-gray5',
        !alwaysDark &&
          'border-0 rounded-none border-l border-l-default h-10 leading-10 px-4 hocus:bg-subtle hocus:shadow-none'
      )}
      {...rest}>
      <FOOTNOTE className={mergeClasses(alwaysDark && '!text-palette-white')}>{children}</FOOTNOTE>
    </Button>
  );
};
