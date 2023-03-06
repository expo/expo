import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

type SnippetProps = HTMLAttributes<HTMLDivElement> & {
  includeMargin?: boolean;
};

export const Snippet = ({ children, className, includeMargin = true, ...rest }: SnippetProps) => (
  <div className={twMerge('flex flex-col', includeMargin && 'mb-4', className)} {...rest}>
    {children}
  </div>
);
