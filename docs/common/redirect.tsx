import Head from 'next/head';
import * as React from 'react';

export default destination =>
  class RedirectRoute extends React.Component {
    render() {
      return (
        <Head>
          <meta httpEquiv="refresh" content={`0; url=${destination}`} />
        </Head>
      );
    }
  };
