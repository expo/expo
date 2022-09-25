import { css } from '@emotion/react';
import { borderRadius, spacing, theme, typography, iconSize } from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';
import Link from 'next/link';
import * as React from 'react';

type SidebarHeadEntryProps = {
  href: string;
  title: string;
  isActive: boolean;
  Icon: React.ComponentType<IconProps>;
};

export const SidebarHeadEntry = ({ href, title, isActive, Icon }: SidebarHeadEntryProps) => {
  return (
    <Link href={href} passHref>
      <a css={[entryContainerStyle, isActive && activeEntryContainerStyle]}>
        <Icon
          css={entryIconStyle}
          color={isActive ? theme.link.default : theme.icon.default}
          width={iconSize.small}
        />
        <span>{title}</span>
      </a>
    </Link>
  );
};

const entryContainerStyle = css({
  ...typography.fontSizes[14],
  minHeight: 38,
  lineHeight: '100%',
  padding: `${spacing[2]}px ${spacing[3]}px`,
  color: theme.text.secondary,
  marginBottom: spacing[1.5],
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  transition: 'color 100ms',
  textDecoration: 'none',

  '&:last-of-type': {
    marginBottom: 0,
  },

  '&:hover': {
    color: theme.text.default,
  },
});

const activeEntryContainerStyle = css({
  color: theme.text.default,
  fontFamily: typography.fontFaces.medium,
  background: theme.background.tertiary,
  borderRadius: borderRadius.medium,

  '[data-expo-theme="dark"] &': {
    backgroundColor: theme.background.tertiary,
  },
});

const entryIconStyle = css({
  marginRight: spacing[2.5],
});
