import { css } from '@emotion/react';
import { darkTheme, iconSize, palette, shadows, theme } from '@expo/styleguide';
import { cloneElement } from 'react';

import { Button, ButtonProps } from '~/ui/components/Button';
import { FOOTNOTE } from '~/ui/components/Text';

export type SnippetActionProps = ButtonProps & {
  alwaysDark?: boolean;
};

export const SnippetAction = (props: SnippetActionProps) => {
  const { children, icon, alwaysDark = false, ...rest } = props;
  const iconStyle = {
    color: alwaysDark ? darkTheme.text.default : undefined,
    size: iconSize.sm,
  };

  const styledIcon = icon && cloneElement(icon as any, iconStyle);

  return (
    <Button
      size="mini"
      theme="ghost"
      icon={styledIcon}
      css={[!alwaysDark && snippetActionStyle, alwaysDark && alwaysDarkStyle]}
      {...rest}>
      <FOOTNOTE css={alwaysDark && { color: darkTheme.text.default }}>{children}</FOOTNOTE>
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
    boxShadow: shadows.xs,
  },
});
