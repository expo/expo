import { mergeClasses } from '@expo/styleguide';

import { NavigationRoute } from '~/types/common';

const BADGE_CLASSES = {
  blue: {
    base: 'border-palette-blue10',
    selected: 'border-palette-blue11 bg-palette-blue11 text-palette-white dark:text-palette-black',
    unselected:
      'border-palette-blue10 bg-none text-palette-blue11 dark:border-palette-blue9 dark:text-palette-blue9',
  },
  purple: {
    base: 'border-palette-purple10',
    selected: 'bg-palette-purple10 text-palette-white dark:text-palette-black',
    unselected:
      'border-palette-purple10 bg-none text-palette-purple11 dark:border-palette-purple9 dark:text-palette-purple10',
  },
};

type SidebarBadgeProps = {
  label: string;
  color: keyof typeof BADGE_CLASSES;
  isSelected?: boolean;
  className?: string;
};

function SidebarBadge({ label, color, isSelected = false, className }: SidebarBadgeProps) {
  const classes = BADGE_CLASSES[color];
  return (
    <span
      className={mergeClasses(
        'ml-2 inline-flex h-4.25 items-center rounded-full border px-1.25 text-[10px] leading-none font-semibold text-palette-white',
        classes.base,
        isSelected ? classes.selected : classes.unselected,
        className
      )}>
      {label}
    </span>
  );
}

type SidebarBadgesProps = {
  info: NavigationRoute;
  isSelected?: boolean;
  className?: string;
};

/**
 * Renders the status badges (new, alpha, beta, preview) of a sidebar page or section.
 */
export function SidebarBadges({ info, isSelected, className }: SidebarBadgesProps) {
  return (
    <>
      {info.isNew && (
        <SidebarBadge label="NEW" color="blue" isSelected={isSelected} className={className} />
      )}
      {info.isAlpha && (
        <SidebarBadge label="ALPHA" color="purple" isSelected={isSelected} className={className} />
      )}
      {info.isBeta && (
        <SidebarBadge label="BETA" color="purple" isSelected={isSelected} className={className} />
      )}
      {info.isPreview && (
        <SidebarBadge
          label="PREVIEW"
          color="purple"
          isSelected={isSelected}
          className={className}
        />
      )}
    </>
  );
}
