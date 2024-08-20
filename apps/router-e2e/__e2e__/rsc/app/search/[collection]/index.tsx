import { getCollection, getCollectionProducts } from '../../../lib/shopify';

import Grid from '../../../components/grid';
import ProductGridItems from '../../../components/layout/product-grid-items';
import { defaultSort, sorting } from '../../../lib/constants';
import { notFound } from '../../../lib/expo-shim';

export default async function CategoryPage({
  searchParams,
  ...props
}: {
  searchParams: URLSearchParams;
}) {
  const sort = searchParams.get('sort');
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCollectionProducts({ collection: props.collection, sortKey, reverse });

  const collection = await getCollection(props.collection);
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
