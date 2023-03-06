import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { iconSize, spacing } from '@expo/styleguide-base';
import * as React from 'react';

export type DocIconProps = {
  Icon?: React.ElementType;
  color?: string;
  small?: boolean;
};

export const IconBase = ({ color, small, Icon }: DocIconProps) => {
  if (!Icon) return null;

  return (
    <Icon
      css={iconStyles}
      color={color ?? theme.icon.default}
      size={small ? iconSize.sm : iconSize.md}
    />
  );
};

const iconStyles = css({
  'table &, li &': {
    verticalAlign: 'middle',
  },

  'li &': {
    marginTop: -spacing[0.5],
  },
});
