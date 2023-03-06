import { css } from '@emotion/react';
import { theme, typography } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import type { ComponentType, HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

import { A } from '../Text';

type SidebarSingleEntryProps = {
  href: string;
  title: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
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
          className={twMerge('icon-sm', isActive ? 'text-palette-blue11' : 'text-icon-secondary')}
        />
      </span>
      {title}
      {isExternal && <ArrowUpRightIcon className="icon-sm text-icon-secondary ml-auto" />}
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
  fontWeight: 500,
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
