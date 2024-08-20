import Prose from '../../components/prose';
import { useLocalSearchParams } from 'expo-router';
import { notFound } from '../../lib/expo-shim';
import { getPage } from '../../lib/shopify';

export default async function Page(props) {
  console.log('props', props, props.searchParams.get('page'));
  //   const params = useLocalSearchParams();
  // TODO: Add support to router and the RSC router for searchParams
  const pageId = props.searchParams.get('page') ?? props.page;
  const page = await getPage(pageId);

  if (!page) return notFound();

  const meta = (
    <>
      <title>{page.seo?.title || page.title}</title>
      <meta name="description" content={page.seo?.description || page.bodySummary} />
      <meta property="og:type" content="article" />
      <meta property="article:published_time" content={page.createdAt} />
      <meta property="article:modified_time" content={page.updatedAt} />
    </>
  );

  return (
    <>
      {meta}
      <h1 className="mb-8 text-5xl font-bold">{page.title}</h1>
      <Prose className="mb-8" html={page.body as string} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}
