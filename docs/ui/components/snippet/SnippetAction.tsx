import { darkTheme, iconSize } from '@expo/styleguide';
import React from 'react';

import { Button, ButtonProps } from '~/ui/components/Button';
import { FOOTNOTE } from '~/ui/components/Text';

export type SnippetActionProps = ButtonProps & {
  alwaysDark?: boolean;
};

export const SnippetAction = (props: SnippetActionProps) => {
  const { children, icon, alwaysDark = false, ...rest } = props;
  const iconStyle = {
    color: alwaysDark ? darkTheme.text.default : undefined,
    size: iconSize.small,
  };

  const styledIcon = icon && React.cloneElement(icon as any, iconStyle);

  return (
    <Button micro theme="transparent" icon={styledIcon} {...rest}>
      <FOOTNOTE css={alwaysDark && { color: darkTheme.text.default }}>{children}</FOOTNOTE>
    </Button>
  );
};
