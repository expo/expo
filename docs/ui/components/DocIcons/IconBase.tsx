import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import type { ElementType } from 'react';
import { twMerge } from 'tailwind-merge';

export type DocIconProps = {
  Icon?: ElementType;
  className?: string;
  small?: boolean;
};

export const IconBase = ({ className, small, Icon }: DocIconProps) => {
  if (!Icon) return null;

  return (
    <Icon
      className={twMerge(
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
