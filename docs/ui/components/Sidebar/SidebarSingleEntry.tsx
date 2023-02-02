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
};

export const SidebarSingleEntry = ({
  href,
  title,
  Icon,
  isActive = false,
  isExternal = false,
}: SidebarSingleEntryProps) => {
  return (
    <A href={href} css={[entryContainerStyle, isActive && activeEntryContainerStyle]} isStyled>
      <Icon
        css={entryIconStyle}
        color={isActive ? theme.text.link : theme.icon.default}
        width={iconSize.sm}
      />
      <span>{title}</span>
      {isExternal && (
        <ArrowUpRightIcon color={theme.icon.secondary} css={css({ marginLeft: 'auto' })} />
      )}
    </A>
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
  fontWeight: 500,
  background: theme.background.element,
  borderRadius: borderRadius.md,

  '.dark-theme &': {
    backgroundColor: theme.background.element,
  },
});

const entryIconStyle = css({
  marginRight: spacing[2.5],
});
