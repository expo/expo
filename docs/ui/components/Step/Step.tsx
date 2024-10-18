import { mergeClasses } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { HEADLINE, P } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  label: string;
}>;

export const Step = ({ children, label }: Props) => {
  return (
    <div className="flex gap-4 mt-6 mb-8">
      <HEADLINE
        theme="secondary"
        className={mergeClasses(
          'flex min-w-[28px] h-7 bg-element rounded-full items-center justify-center mt-1',
          label.length >= 3 && '!text-xs'
        )}>
        {label}
      </HEADLINE>
      <div className="pt-1.5 w-full max-w-[calc(100%-44px)] prose-h2:!-mt-1.5 prose-h3:!-mt-1 prose-h4:!-mt-px [&>*:last-child]:!mb-0">
        {typeof children === 'string' ? <P>{children}</P> : children}
      </div>
    </div>
  );
};
