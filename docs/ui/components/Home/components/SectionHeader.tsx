import { mergeClasses } from '@expo/styleguide';
import { type ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={mergeClasses('flex items-start justify-between gap-4 pt-16 pb-6', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="heading-xl text-default">{title}</h2>
        {description && (
          <p className="text-sm leading-[1.4] font-medium text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
