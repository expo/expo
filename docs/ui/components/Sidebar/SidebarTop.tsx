import { LinkBase, Logo } from '@expo/styleguide';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';
import { LayoutLeftIcon } from '@expo/styleguide-icons/outline/LayoutLeftIcon';

import * as Tooltip from '~/ui/components/Tooltip';

type SidebarTopProps = {
  subgroup?: string;
  onCollapse?: () => void;
};

export const SidebarTop = ({ subgroup, onCollapse }: SidebarTopProps) => (
  <div className="mb-2.5 flex items-center justify-between px-2 py-3">
    <div className="flex items-center gap-2">
      <LinkBase href="https://expo.dev" className="flex outline-offset-1">
        <Logo className="icon-md text-[#1b1f23] dark:text-default" title="Expo" />
      </LinkBase>
      <span
        aria-hidden="true"
        className="text-(--expo-theme-border-default) text-base leading-[1.4] font-semibold select-none">
        /
      </span>
      <LinkBase
        href="/"
        className="text-base leading-[1.4] font-semibold text-default decoration-0 outline-offset-1 select-none">
        Docs
      </LinkBase>
      {subgroup && (
        <>
          <ChevronRightIcon aria-hidden="true" className="icon-sm text-icon-secondary" />
          <span className="text-base leading-[1.4] font-semibold text-default select-none">
            {subgroup}
          </span>
        </>
      )}
    </div>
    {onCollapse && (
      <Tooltip.Root delayDuration={300}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Hide navigation"
            onClick={onCollapse}
            className="rounded-lg p-2 text-icon-default hocus:bg-element">
            <LayoutLeftIcon aria-hidden="true" className="icon-sm" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content sideOffset={8} className="max-w-65 text-center text-sm">
          Use Cmd/Ctrl + Shift + Enter to toggle immersive mode.
        </Tooltip.Content>
      </Tooltip.Root>
    )}
  </div>
);
