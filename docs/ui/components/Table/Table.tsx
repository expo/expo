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
  <div className="table-wrapper border border-default rounded-md overflow-y-hidden overflow-x-auto mb-4 shadow-xs">
    <table
      className={mergeClasses(
        'w-full border-0 rounded-none text-xs text-default',
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
