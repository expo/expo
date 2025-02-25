import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren } from 'react';

type RequirementProps = PropsWithChildren<{
  title: string;
  number: number;
}>;

export function Requirement({ title, number, children }: RequirementProps) {
  return (
    <div className={mergeClasses('flex gap-1.5 border-t border-default p-5')}>
      <p className="mb-2 text-right font-medium">{number}.</p>
      <div>
        <p className="mb-2 font-medium">{title}</p>
        <div className={mergeClasses('last:[&>*]:!mb-0 [&_p]:ml-0 [&_pre>pre]:mt-0')}>
          {children}
        </div>
      </div>
    </div>
  );
}
