import type { PropsWithChildren } from 'react';
import type { Components } from 'react-markdown';

export type MDComponents = Components;

export type CodeComponentProps = PropsWithChildren<{
  className?: string;
  node: { data?: { meta?: string } };
}>;
