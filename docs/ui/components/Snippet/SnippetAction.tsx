import { css } from '@emotion/react';
import { shadows, theme, Button, ButtonProps, mergeClasses } from '@expo/styleguide';
import { palette } from '@expo/styleguide-base';
import { cloneElement, ReactElement } from 'react';

import { FOOTNOTE } from '~/ui/components/Text';

export type SnippetActionProps = ButtonProps & {
  icon?: ReactElement;
  iconRight?: ReactElement;
  alwaysDark?: boolean;
};

export const SnippetAction = (props: SnippetActionProps) => {
  const { children, icon, iconRight, alwaysDark = false, ...rest } = props;

  const styledIcon =
    icon &&
    cloneElement(icon, {
      className: mergeClasses('icon-sm', alwaysDark && 'text-palette-white'),
    });

  return (
    <Button
      size="xs"
      theme="quaternary"
      leftSlot={styledIcon}
      rightSlot={iconRight}
      css={[!alwaysDark && snippetActionStyle, alwaysDark && alwaysDarkStyle]}
      className={mergeClasses(
        !alwaysDark && 'border-0 rounded-none border-l border-l-default h-10 leading-10 px-4',
        alwaysDark && 'border-transparent bg-[transparent]'
      )}
      {...rest}>
      <FOOTNOTE className={mergeClasses(alwaysDark && '!text-palette-white')}>{children}</FOOTNOTE>
    </Button>
  );
};

const snippetActionStyle = css({
  ':hover': {
    backgroundColor: theme.background.subtle,
    boxShadow: 'none',
  },
});

const alwaysDarkStyle = css({
  ':hover': {
    borderColor: palette.dark.gray9,
    background: palette.dark.gray5,
    boxShadow: shadows.xs,
  },
});
