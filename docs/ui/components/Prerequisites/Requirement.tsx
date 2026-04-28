import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren, type ReactNode } from 'react';

type RequirementProps = PropsWithChildren<{
  title: ReactNode;
  number: number;
}>;

export function Requirement({ title, number, children }: RequirementProps) {
  return (
    <div className={mergeClasses('border-default flex items-baseline gap-1.5 border-t p-5')}>
      <p className="mb-2 text-right font-medium">{number}.</p>
      <div className="flex-1 overflow-hidden">
        <div className="mb-2 flex items-baseline gap-2 font-medium">{title}</div>
        <div className={mergeClasses('[&_p]:ml-0 [&_pre>pre]:mt-0 [&>*:last-child]:mb-0!')}>
          {children}
        </div>
      </div>
    </div>
  );
}
