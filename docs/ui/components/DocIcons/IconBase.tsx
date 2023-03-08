import { css } from '@emotion/react';
import { mergeClasses } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { ElementType } from 'react';

export type DocIconProps = {
  Icon?: ElementType;
  className?: string;
  small?: boolean;
};

export const IconBase = ({ className, small, Icon }: DocIconProps) => {
  if (!Icon) return null;

  return (
    <Icon
      className={mergeClasses(
        'inline-block',
        small ? 'icon-sm' : 'icon-md',
        'text-icon-default',
        className
      )}
      css={iconStyles}
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
