import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TableHeaders } from './TableHeaders';
import { TextAlign } from './types';

type TableProps = PropsWithChildren<{
  headers?: string[];
  headersAlign?: TextAlign[];
  className?: string;
}>;

export const Table = ({ children, headers = [], headersAlign, className }: TableProps) => (
  <div className="table-wrapper mb-4 overflow-x-auto overflow-y-hidden rounded-md border border-default shadow-xs">
    <table
      className={mergeClasses(
        'w-full rounded-none border-0 text-xs text-default',
        '[&_p]:text-xs',
        '[&_li]:text-xs',
        '[&_span]:text-xs',
        '[&_code_span]:text-inherit',
        '[&_strong]:text-xs',
        '[&_blockquote_div]:text-xs',
        '[&_blockquote_code]:px-1 [&_blockquote_code]:py-0',
        className
      )}>
      {headers.length ? (
        <>
          <TableHeaders headers={headers} headersAlign={headersAlign} />
          <tbody>{children}</tbody>
        </>
      ) : (
        children
      )}
    </table>
  </div>
);
