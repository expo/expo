import type { HTMLAttributes } from 'react';

export type TagProps = {
  name: string;
  firstElement?: boolean;
} & HTMLAttributes<HTMLDivElement>;
