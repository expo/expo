import { mergeClasses } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { LABEL } from '~/ui/components/Text';

type SnippetHeaderProps = PropsWithChildren<{
  title: string;
  alwaysDark?: boolean;
}>;

export const SnippetHeader = ({ title, children, alwaysDark = false }: SnippetHeaderProps) => (
  <div className={mergeClasses(alwaysDark && 'dark-theme')}>
    <div
      className={mergeClasses(
        'flex pl-4 overflow-hidden justify-between bg-default border border-default rounded-t-md border-b-0',
        alwaysDark && 'pr-2 dark:border-transparent !bg-palette-gray3'
      )}>
      <LABEL
        className={mergeClasses(
          'h-10 !leading-10 pr-4 select-none font-medium text-ellipsis whitespace-nowrap overflow-hidden',
          alwaysDark && 'text-palette-white'
        )}>
        {title}
      </LABEL>
      {!!children && <div className="flex justify-end items-center">{children}</div>}
    </div>
  </div>
);
