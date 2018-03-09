import React from 'react';
import NativeLink from 'next/link';
import * as Constants from '~/style/constants';

export const InternalLink = ({ href, as, children }) => (
  <NativeLink prefetch href={href} as={as}>
    <a>
      {children}

      <style jsx>
        {`
          a {
            text-decoration: none;
            color: ${Constants.colors.expoLighter};
            font-size: inherit;
          }

          a:hover {
            text-decoration: underline;
          }
        `}
      </style>
    </a>
  </NativeLink>
);

export const ExternalLink = ({ href, children }) => (
  <a href={href} rel="noopener noreferrer">
    {children}

    <style jsx>
      {`
        a {
          text-decoration: none;
          color: ${Constants.colors.expoLighter};
          font-size: inherit;
        }

        a:hover {
          text-decoration: underline;
        }
      `}
    </style>
  </a>
);
