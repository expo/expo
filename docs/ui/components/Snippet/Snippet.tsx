import { mergeClasses } from '@expo/styleguide';
import type { HTMLAttributes } from 'react';

type SnippetProps = HTMLAttributes<HTMLDivElement>;

export const Snippet = ({ children, className, ...rest }: SnippetProps) => (
  <div className={mergeClasses('mb-4 flex flex-col last:mb-0', className)} {...rest}>
    {children}
  </div>
);
