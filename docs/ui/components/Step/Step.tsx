import { PropsWithChildren } from 'react';

import { HEADLINE } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  label: string;
}>;

export const Step = ({ children, label }: Props) => {
  return (
    <div className="flex gap-4 mt-6 mb-4">
      <HEADLINE className="flex min-w-[28px] h-7 bg-element rounded-full items-center justify-center mt-1">
        {label}
      </HEADLINE>
      <div className="pt-1 w-full prose-headings:!-mt-1 prose-ul:!mb-0 prose-ol:!mb-0">{children}</div>
    </div>
  );
};
