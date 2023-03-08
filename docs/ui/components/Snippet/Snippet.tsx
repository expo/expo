import { mergeClasses } from '@expo/styleguide';
import type { HTMLAttributes } from 'react';

type SnippetProps = HTMLAttributes<HTMLDivElement> & {
  includeMargin?: boolean;
};

export const Snippet = ({ children, className, includeMargin = true, ...rest }: SnippetProps) => (
  <div className={mergeClasses('flex flex-col', includeMargin && 'mb-4', className)} {...rest}>
    {children}
  </div>
);
