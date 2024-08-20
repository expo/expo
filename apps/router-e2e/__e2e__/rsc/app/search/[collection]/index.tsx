import { getCollection, getCollectionProducts } from '../../../lib/shopify';

import Grid from '../../../components/grid';
import ProductGridItems from '../../../components/layout/product-grid-items';
import { defaultSort, sorting } from '../../../lib/constants';
import { notFound } from '../../../lib/expo-shim';

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { collection: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCollectionProducts({ collection: params.collection, sortKey, reverse });

  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  return (
    <section>
      <title>{collection.seo?.title || collection.title}</title>
      <meta name="description" content={collection.seo?.description || collection.description} />

      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      )}
    </section>
  );
}
