import { mergeClasses } from '@expo/styleguide';
import { PropsWithChildren } from 'react';

import { HEADLINE, P } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  label: string;
}>;

export const Step = ({ children, label }: Props) => {
  return (
    <div data-md="step" className="mt-6 mb-8 flex gap-4">
      <HEADLINE
        theme="secondary"
        className={mergeClasses(
          'bg-element mt-1 flex h-7 min-w-[28px] items-center justify-center rounded-full',
          label.length >= 3 && 'text-sm!'
        )}>
        {label}
      </HEADLINE>
      <div
        data-md="step-content"
        className="prose-h2:!-mt-1.5 prose-h3:!-mt-1 prose-h4:!-mt-px w-full max-w-[calc(100%-44px)] pt-1.5 [&>*:last-child]:mb-0!">
        {typeof children === 'string' ? <P>{children}</P> : children}
      </div>
    </div>
  );
};
