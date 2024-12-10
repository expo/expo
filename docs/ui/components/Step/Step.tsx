import { mergeClasses } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { HEADLINE, P } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  label: string;
}>;

export const Step = ({ children, label }: Props) => {
  return (
    <div className="mb-8 mt-6 flex gap-4">
      <HEADLINE
        theme="secondary"
        className={mergeClasses(
          'mt-1 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-element',
          label.length >= 3 && '!text-xs'
        )}>
        {label}
      </HEADLINE>
      <div className="w-full max-w-[calc(100%-44px)] pt-1.5 prose-h2:!-mt-1.5 prose-h3:!-mt-1 prose-h4:!-mt-px [&>*:last-child]:!mb-0">
        {typeof children === 'string' ? <P>{children}</P> : children}
      </div>
    </div>
  );
};
