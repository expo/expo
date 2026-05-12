import { PropsWithChildren } from 'react';

type TableHeadProps = PropsWithChildren<object>;

export const TableHead = ({ children }: TableHeadProps) => (
  <thead className="border-b-default bg-subtle border-b">{children}</thead>
);
