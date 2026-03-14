import Head from 'next/head';

type StructuredDataProps = {
  data: Record<string, any>;
  id: string;
};

export function StructuredData({ data, id }: StructuredDataProps) {
  return (
    <Head>
      <script
        key={id}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, '\\u003c'),
        }}
      />
    </Head>
  );
}
