import { PropsWithChildren } from 'react';

type TableHeadProps = PropsWithChildren<object>;

export const TableHead = ({ children }: TableHeadProps) => (
  <thead className="bg-subtle border-b border-b-default">{children}</thead>
);
