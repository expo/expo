import { mergeClasses } from '@expo/styleguide';
import { AndroidIcon } from '@expo/styleguide-icons/custom/AndroidIcon';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { ComponentType, HTMLAttributes } from 'react';

import { FOOTNOTE } from '~/ui/components/Text';

import { type Platform } from './platform';

const PLATFORM_LABEL: Record<Platform, string> = {
  android: 'Android',
  ios: 'iOS',
};

const PLATFORM_ICON: Record<Platform, ComponentType<HTMLAttributes<SVGSVGElement>>> = {
  android: AndroidIcon,
  ios: AppleIcon,
};

type Props = {
  available: Platform[];
  active: Platform;
  select: (platform: Platform) => void;
  className?: string;
};

export function PlatformTabs({ available, active, select, className }: Props) {
  if (available.length < 2) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="Screenshot platform"
      className={mergeClasses('flex gap-1', className)}>
      {available.map(platform => {
        const Icon = PLATFORM_ICON[platform];
        const isActive = platform === active;
        return (
          <button
            key={platform}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              select(platform);
            }}
            className={mergeClasses(
              'flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 transition-colors',
              isActive
                ? 'border-default bg-default shadow-xs dark:bg-subtle'
                : 'border-transparent dark:hocus:bg-subtle hocus:bg-element'
            )}>
            <Icon
              aria-hidden="true"
              className={mergeClasses(
                'icon-xs shrink-0 transition-colors',
                isActive ? 'text-icon-default' : 'text-icon-tertiary'
              )}
            />
            <FOOTNOTE
              theme={isActive ? 'default' : 'tertiary'}
              weight="medium"
              className="transition-colors">
              {PLATFORM_LABEL[platform]}
            </FOOTNOTE>
          </button>
        );
      })}
    </div>
  );
}
