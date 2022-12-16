import NextHead from 'next/head';
import React, { PropsWithChildren } from 'react';

type HeadProps = PropsWithChildren<{ title?: string }>;

const BASE_TITLE = 'Expo Documentation';

const Head = ({ title, children }: HeadProps) => (
  <NextHead>
    <title>{title ? `${title} - ${BASE_TITLE}` : BASE_TITLE}</title>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />
    {children}
  </NextHead>
);

export default Head;
