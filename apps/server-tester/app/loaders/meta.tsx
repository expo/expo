import { useLoaderData } from 'expo-router';
import Head from 'expo-router/head';
import type { Metadata } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

// Covers metadata in streaming SSR. The `Head` element below covers metadata in SSG.
export function generateMetadata() {
  return {
    title: 'Meta page',
    description: 'Meta tag testing',
    keywords: 'expo-router,loaders,meta',
    authors: {
      name: 'Expo',
    },
  } satisfies Metadata;
}

export async function loader() {
  return {
    title: 'Meta page',
    description: 'Meta tag testing',
    keywords: 'expo-router,loaders,meta',
    author: 'Expo',
  };
}

export default function MetaRoute() {
  return (
    <Page title="Metadata" testID="loaders-meta">
      <Suspense fallback={<Loading />}>
        <MetaScreen />
      </Suspense>
    </Page>
  );
}

function MetaScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Head>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
        <meta name="keywords" content={data.keywords} />
        <meta name="author" content={data.author} />
      </Head>
      <RouteDetails>
        <LoaderData value={data} />
      </RouteDetails>
    </>
  );
}
