import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren, type ReactNode } from 'react';

export type RequirementProps = PropsWithChildren<{
  title: ReactNode;
}>;

export function Requirement({ title, children }: RequirementProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="mb-2 flex items-baseline gap-2 font-medium">{title}</div>
      <div className={mergeClasses('[&_p]:ml-0 [&_pre>pre]:mt-0 [&>*:last-child]:mb-0!')}>
        {children}
      </div>
    </div>
  );
}
