import React from 'react';
import * as Constants from '~/style/constants';

export const P = ({ children }) => (
  <p>
    {children}
    <style jsx>
      {`
        p {
          font-size: 1rem;
          line-height: 1.725rem;
          margin-bottom: 1.5rem;
        }
      `}
    </style>
  </p>
);

const B = ({ children }) => (
  <span>
    {children}
    <style jsx>
      {`
        span {
          font-family: ${Constants.fontFamilies.bold};
          font-weight: 400;
          letter-spacing: 0.3px;
        }
      `}
    </style>
  </span>
);

P.B = B;

export const PDIV = ({ children }) => {
  const wider = children.props && children.props.snackId;
  return (
    <div className={wider ? 'wider' : ''}>
      {children}
      <style jsx>
        {`
          div {
            font-size: 1rem;
            line-height: 1.8rem;
            margin-bottom: 1.4rem;
          }

          div.wider {
            max-width: 800px;
            width: 800px;
          }

          @media screen and (max-width: ${Constants.breakpoints.mobile}) {
            div.wider {
              max-width: 100%;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export const Quote = ({ children }) => (
  <blockquote>
    {children}
    <style jsx>{`
      blockquote {
        font-family: ${Constants.fontFamilies.book};
        padding: 12px 24px;
        border-left: 5px solid ${Constants.colors.darkGrey};
        margin: 0 0 1.5rem 0;
        color: ${Constants.colors.black80};
      }

      blockquote :global(div) {
        margin: 0;
      }
    `}</style>
  </blockquote>
);
