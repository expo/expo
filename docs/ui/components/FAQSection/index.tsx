import Head from 'next/head';
import React, { Children, PropsWithChildren, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/** When wrapped around `Collapsible` components, this element generates the static ld+json required for Google search indexing. */
export function FAQSection({ name, children }: PropsWithChildren<{ name: string }>) {
  const mainEntity = useMemo(() => {
    const faqs: { question: string; answer: string }[] = [];

    Children.forEach(children, child => {
      if (
        child &&
        typeof child === 'object' &&
        'props' in child &&
        child?.props?.mdxType === 'Collapsible'
      ) {
        const content = child.props.children;
        faqs.push({
          question: child.props.summary,
          answer: renderToStaticMarkup(content).replace(
            /\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\//g,
            'https://docs.expo.dev/'
          ),
        });
      }
    });
    return faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    }));
  }, [children]);

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@name': name,
    mainEntity,
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      </Head>
      {children}
    </>
  );
}
