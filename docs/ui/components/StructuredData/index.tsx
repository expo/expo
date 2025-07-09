import Head from 'next/head';

type Props = {
  data: Record<string, any>;
};

export function StructuredData({ data }: Props) {
  return (
    <Head>
      <script
        key="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    </Head>
  );
}
