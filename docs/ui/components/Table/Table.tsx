import { mergeClasses } from '@expo/styleguide';
import type { PropsWithChildren } from 'react';

import { TableHeaders } from './TableHeaders';
import { TextAlign } from './types';

type TableProps = PropsWithChildren<{
  headers?: string[];
  headersAlign?: TextAlign[];
  className?: string;
  containerClassName?: string;
}>;

export const Table = ({
  children,
  headers = [],
  headersAlign,
  className,
  containerClassName,
}: TableProps) => (
  <div
    className={mergeClasses(
      'table-wrapper border-default mb-4 overflow-x-auto overflow-y-hidden rounded-md border shadow-xs',
      containerClassName
    )}>
    <table
      className={mergeClasses(
        'text-default w-full rounded-none border-0 text-sm',
        '[&_p]:text-sm',
        '[&_li]:text-sm',
        '[&_span]:text-sm',
        '[&_code_span]:text-xs',
        '[&_strong]:text-sm',
        '[&_blockquote_div]:text-sm',
        '[&_blockquote_code]:px-1 [&_blockquote_code]:py-0',
        className
      )}>
      {headers.length > 0 ? (
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
