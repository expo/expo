import { mergeClasses } from '@expo/styleguide';
import type { CSSProperties, PropsWithChildren } from 'react';

import { TableHeaders } from './TableHeaders';
import { TextAlign } from './types';

type TableProps = PropsWithChildren<{
  headers?: string[];
  headersAlign?: TextAlign[];
  className?: string;
  containerClassName?: string;
  layout?: 'columns' | 'stacked';
  stackedLabel?: string;
}>;

const STACKED_LAYOUT_CLASSES = [
  'table-fixed [&>thead]:sr-only',
  '[&>tbody>tr]:flex [&>tbody>tr]:flex-wrap [&>tbody>tr]:items-center [&>tbody>tr]:gap-x-4 [&>tbody>tr]:gap-y-2 [&>tbody>tr]:p-4',
  '[&>tbody>tr+tr]:border-t [&>tbody>tr+tr]:border-secondary',
  '[&>tbody>tr>td]:min-w-0 [&>tbody>tr>td]:border-r-0 [&>tbody>tr>td]:p-0 [&>tbody>tr>td]:wrap-anywhere',
  '[&>tbody>tr>td:nth-child(2)]:ml-auto [&>tbody>tr>td:nth-child(2)]:flex [&>tbody>tr>td:nth-child(2)]:items-center [&>tbody>tr>td:nth-child(2)]:justify-end [&>tbody>tr>td:nth-child(2)]:gap-1 [&>tbody>tr>td:nth-child(2)]:text-secondary',
  '[&>tbody>tr>td:nth-child(2)]:before:content-(--stacked-label)',
  '[&>tbody>tr>td:nth-child(n+3)]:basis-full',
];

export const Table = ({
  children,
  headers = [],
  headersAlign,
  className,
  containerClassName,
  layout = 'columns',
  stackedLabel,
}: TableProps) => (
  <div
    className={mergeClasses(
      'table-wrapper mb-5 overflow-clip rounded-lg border border-default shadow-xs',
      containerClassName
    )}>
    <div className="[scrollbar-color:var(--slate-5)_transparent] scrollbar-thin overflow-x-auto overflow-y-hidden">
      <table
        style={
          layout === 'stacked' && stackedLabel
            ? ({ '--stacked-label': JSON.stringify(`${stackedLabel}:`) } as CSSProperties)
            : undefined
        }
        className={mergeClasses(
          'w-full rounded-none border-0 text-sm text-default',
          '[&_p]:text-sm',
          '[&_li]:text-sm',
          '[&_span]:text-sm',
          '[&_code_span]:text-xs',
          '[&_strong]:text-sm',
          '[&_blockquote_div]:text-sm',
          '[&_blockquote_code]:px-1 [&_blockquote_code]:py-0',
          layout === 'stacked' && STACKED_LAYOUT_CLASSES,
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
