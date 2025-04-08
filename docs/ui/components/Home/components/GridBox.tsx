import { mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import type { ReactNode } from 'react';

import { A, LABEL } from '~/ui/components/Text';

type GridBoxProps = {
  icon?: ReactNode;
  title?: string;
  link?: string;
  className?: string;
};

export function GridBox({ icon, title, link, className }: GridBoxProps) {
  const Icon = link?.startsWith('https://') ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <A
      href={link}
      className={mergeClasses(
        'group relative flex min-h-[200px] flex-col overflow-hidden rounded-lg border border-default bg-subtle shadow-xs transition',
        '[&_h2]:!my-0 [&_h3]:!mt-0',
        'hocus:shadow-sm',
        className
      )}
      isStyled>
      <div className="flex min-h-[142px] items-center justify-center transition-transform group-hover:scale-105">
        {icon}
      </div>
      <LABEL className="flex h-full min-h-[30px] items-center justify-between gap-3 bg-default p-4">
        {title}
        <Icon className="text-icon-secondary" />
      </LABEL>
    </A>
  );
}
