import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren } from 'react';

import { A } from '~/ui/components/Text';

type HomeCardProps = PropsWithChildren<{
  href: string;
  className?: string;
}>;

export function HomeCard({ href, className, children }: HomeCardProps) {
  return (
    <A
      href={href}
      isStyled
      className={mergeClasses(
        'flex flex-col rounded-lg bg-default p-6 outline-(--expo-theme-border-default) outline-[0.5px] outline-offset-[-0.5px]',
        className
      )}>
      {children}
    </A>
  );
}

type CardTextProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

export function CardText({ title, className, children }: CardTextProps) {
  return (
    <div className={mergeClasses('flex flex-col gap-1', className)}>
      <p className="heading-base text-default">{title}</p>
      <p className="text-sm leading-[1.4] font-medium text-secondary">{children}</p>
    </div>
  );
}
