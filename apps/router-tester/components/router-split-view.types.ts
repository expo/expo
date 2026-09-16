import { type ReactElement, type ReactNode } from 'react';

export type SplitViewColumn = {
  title: string;
  titleDisplayMode?: 'automatic' | 'inline' | 'large';
  backButtonHidden?: boolean;
  toolbarItems?: ReactNode;
  children: ReactElement;
};

export type RouterSplitViewProps = {
  sidebar: SplitViewColumn;
  content: SplitViewColumn;
  detail: SplitViewColumn;
  compactColumn: 'sidebar' | 'content' | 'detail';
  onCompactColumnChange: (column: 'sidebar' | 'content' | 'detail') => void;
};
