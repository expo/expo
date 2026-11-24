import type { PropsWithChildren, ReactNode } from 'react';

type SidebarTitleProps = PropsWithChildren<{
  sectionName?: string;
  trailing?: ReactNode;
}>;

export const SidebarTitle = ({ children, sectionName, trailing }: SidebarTitleProps) => (
  <div
    className="flex items-center justify-between gap-2 px-(--sidebar-entry-px,12px) py-2"
    {...(sectionName && { 'data-section-name': sectionName })}>
    <span className="eyebrow text-[#80838d] dark:text-tertiary">{children}</span>
    {trailing}
  </div>
);
