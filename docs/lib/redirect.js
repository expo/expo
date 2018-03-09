import React from 'react';
import Head from 'next/head';

const redirectTo = destination =>
  class RedirectRoute extends React.Component {
    render() {
      return (
        <Head>
          <meta httpEquiv="refresh" content={`0; url=${destination}`} />
        </Head>
      );
    }
  };

export default redirectTo;
