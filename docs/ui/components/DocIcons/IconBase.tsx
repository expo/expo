import { css } from '@emotion/react';
import { mergeClasses } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import type { ElementType, HTMLAttributes } from 'react';

export type DocIconProps = HTMLAttributes<SVGSVGElement> & {
  Icon?: ElementType;
  small?: boolean;
};

export const IconBase = ({ className, small, Icon, ...rest }: DocIconProps) => {
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
      {...rest}
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
