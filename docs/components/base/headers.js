import React from 'react';
import * as Constants from '~/style/constants';

export const H1 = ({ children }) => (
  <h1>
    {children}
    <style jsx>
      {`
        h1 {
          font-family: ${Constants.fonts.book};
          font-size: 2.25rem;
          line-height: 2.75rem;
          margin-bottom: 3rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ccc;
        }
      `}
    </style>
  </h1>
);

export const H2 = ({ children }) => (
  <h2>
    {children}
    <style jsx>
      {`
        h2 {
          font-family: ${Constants.fonts.book};
          line-height: 1.75rem;
          font-size: 1.5rem;
          margin-bottom: 1.8rem;
          margin-top: 2rem;
          padding-bottom: 0.3rem;
          border-bottom: 1px solid #eee;
        }
      `}
    </style>
  </h2>
);

export const H3 = ({ children }) => (
  <h3>
    {children}
    <style jsx>
      {`
        h3 {
          font-size: 1.1rem;
          line-height: 1.75rem;
          font-family: ${Constants.fonts.bold};
          margin-bottom: 1rem;
          margin-top: 2rem;
        }
      `}
    </style>
    <style jsx global>
      {`
        /* Function names and other similar headers don't stand out enough so add this styling to improve scannability */
        h3 code.inline {
          background-color: ${Constants.colors.portage};
          font-weight: bold;
        }
      `}
    </style>
  </h3>
);

export const H4 = ({ children }) => (
  <h4>
    {children}
    <style jsx>
      {`
        h4 {
          font-family: ${Constants.fonts.bold};
          font-weight: 400;
          line-height: 1.625rem;
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }
      `}
    </style>
  </h4>
);
