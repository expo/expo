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
      'table-wrapper mb-4 overflow-clip rounded-3xl border border-default shadow-xs',
      containerClassName
    )}>
    <div className="[scrollbar-color:var(--slate-5)_transparent] scrollbar-thin overflow-x-auto overflow-y-hidden">
      <table
        className={mergeClasses(
          'w-full rounded-none border-0 text-sm text-default',
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
  </div>
);
