import { Children, type PropsWithChildren, type ReactElement, isValidElement } from 'react';

import { toString } from '~/common/utilities';
import { buildFAQPageSchema } from '~/constants/structured-data';
import { StructuredData } from '~/ui/components/StructuredData';

export function FAQ({ children }: PropsWithChildren) {
  const items: { question: string; answer: string }[] = [];

  Children.forEach(children, child => {
    if (
      isValidElement(child) &&
      (child as ReactElement<{ summary?: unknown }>).props.summary !== undefined
    ) {
      const { summary, children: body } = child.props as { summary?: unknown; children?: unknown };
      items.push({
        question: toString(summary as React.ReactNode),
        answer: toString(body as React.ReactNode),
      });
    }
  });

  const schema = buildFAQPageSchema(items);

  return (
    <>
      {schema && <StructuredData data={schema} id="faq" />}
      {children}
    </>
  );
}
