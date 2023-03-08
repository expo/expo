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
      {...rest}>
      <FOOTNOTE css={alwaysDark && { color: theme.palette.white }}>{children}</FOOTNOTE>
    </Button>
  );
};

const snippetActionStyle = css({
  border: 0,
  borderRadius: 0,
  borderLeft: `1px solid ${theme.border.default}`,
  height: 42,
  lineHeight: 42,
  padding: `0 16px`,

  ':hover': {
    backgroundColor: theme.background.subtle,
    boxShadow: 'none',
  },
});

const alwaysDarkStyle = css({
  borderColor: 'transparent',
  background: 'transparent',

  ':hover': {
    borderColor: palette.dark.gray9,
    background: palette.dark.gray5,
    boxShadow: shadows.xs,
  },
});
