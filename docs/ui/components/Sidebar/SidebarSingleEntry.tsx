import { css } from '@emotion/react';
import {
  borderRadius,
  spacing,
  theme,
  typography,
  iconSize,
  ArrowUpRightIcon,
} from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';
import { ComponentType } from 'react';

import { A } from '../Text';

type SidebarSingleEntryProps = {
  href: string;
  title: string;
  Icon: ComponentType<IconProps>;
  isActive?: boolean;
  isExternal?: boolean;
  secondary?: boolean;
};

export const SidebarSingleEntry = ({
  href,
  title,
  Icon,
  isActive = false,
  isExternal = false,
  secondary = false,
}: SidebarSingleEntryProps) => {
  return (
    <A
      href={href}
      css={[containerStyle, isActive && activeContainerStyle, secondary && secondaryContainerStyle]}
      isStyled>
      <span
        css={[
          iconWrapperStyle,
          isActive && activeIconWrapperStyle,
          secondary && secondaryIconWrapperStyle,
        ]}>
        <Icon
          color={isActive ? theme.palette.blue11 : theme.icon.secondary}
          size={secondary ? iconSize.sm : iconSize.xs}
          width={secondary ? iconSize.sm : iconSize.xs}
        />
      </span>
      {title}
      {isExternal && (
        <ArrowUpRightIcon
          color={theme.icon.secondary}
          size={iconSize.sm}
          css={css({ marginLeft: 'auto' })}
        />
      )}
    </A>
  );
};

const containerStyle = css({
  ...typography.fontSizes[14],
  minHeight: 38,
  lineHeight: '100%',
  padding: `${spacing[1]}px ${spacing[1]}px`,
  color: theme.text.secondary,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  transition: 'color 150ms, opacity 150ms',
  textDecoration: 'none',
  borderRadius: borderRadius.md,
  fontWeight: 600,
  gap: spacing[2.5],

  '&:hover': {
    color: theme.text.default,
    opacity: 1,
  },
});

const secondaryContainerStyle = css({
  fontWeight: 400,

  '&:hover': {
    color: theme.text.secondary,
    opacity: 0.8,
  },
});

const activeContainerStyle = css({
  color: theme.text.link,

  '&:hover': {
    color: theme.text.link,
  },
});

const iconWrapperStyle = css({
  display: 'flex',
  backgroundColor: theme.background.element,
  width: spacing[6],
  height: spacing[6],
  borderRadius: borderRadius.sm,
  alignItems: 'center',
  justifyContent: 'center',
});

const activeIconWrapperStyle = css({
  backgroundColor: theme.palette.blue4,
});

const secondaryIconWrapperStyle = css({
  backgroundColor: 'transparent',
});
