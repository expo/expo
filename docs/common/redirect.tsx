import Head from 'next/head';

const redirect = (destination: string) => {
  return () => (
    <Head>
      <meta httpEquiv="refresh" content={`0; url=${destination}`} />
    </Head>
  );
};

export default redirect;
