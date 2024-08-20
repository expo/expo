import Grid from '../../components/grid';
import ProductGridItems from '../../components/layout/product-grid-items';
import { useLocalSearchParams } from 'expo-router';
import { defaultSort, sorting } from '../../lib/constants';
import { getProducts } from '../../lib/shopify';

export default async function SearchPage() {
  //   {
  //   searchParams
  // }: {
  //   searchParams?: { [key: string]: string | string[] | undefined };
  // }
  const searchParams = useLocalSearchParams();
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  const products = await getProducts({ sortKey, reverse, query: searchValue });
  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <>
      <title>Search</title>
      <meta name="description" content="Search for products in the store." />
      {searchValue ? (
        <p className="mb-4">
          {products.length === 0
            ? 'There are no products that match '
            : `Showing ${products.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}
      {products.length > 0 ? (
        <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ProductGridItems products={products} />
        </Grid>
      ) : null}
    </>
  );
}
