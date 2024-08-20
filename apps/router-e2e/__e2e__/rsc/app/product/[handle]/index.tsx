import { GridTileImage } from '../../../components/grid/tile';
import Footer from '../../../components/layout/footer';
import { Gallery } from '../../../components/product/gallery';
import { ProductProvider } from '../../../components/product/product-context';
import { ProductDescription } from '../../../components/product/product-description';
import { Link } from 'expo-router';
import { HIDDEN_PRODUCT_TAG } from '../../../lib/constants';
import { notFound } from '../../../lib/expo-shim';
import { getProduct, getProductRecommendations } from '../../../lib/shopify';
import { Image } from '../../../lib/shopify/types';
import { Suspense } from 'react';

export default async function ProductPage(props: { handle: string }) {
  const product = await getProduct(props.handle);

  if (!product) return notFound();

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.featuredImage.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      highPrice: product.priceRange.maxVariantPrice.amount,
      lowPrice: product.priceRange.minVariantPrice.amount,
    },
  };

  const { url, width, height, altText: alt } = product.featuredImage || {};
  const indexable = !product.tags.includes(HIDDEN_PRODUCT_TAG);

  const meta = (
    <>
      <title>{product.seo?.title || product.title}</title>
      <meta name="description" content={product.seo?.description || product.description} />
      <meta property="og:type" content="article" />

      {/* robots */}
      <meta
        name="robots"
        content={`${indexable ? 'index' : 'noindex'}, ${indexable ? 'follow' : 'nofollow'}`}
      />
      <meta name="googlebot" content={`index, ${indexable ? 'follow' : 'nofollow'}`} />

      {/* Open Graph */}
      {url && (
        <>
          <meta property="og:image" content={url} />
          <meta property="og:image:width" content={width} />
          <meta property="og:image:height" content={height} />
          <meta property="og:image:alt" content={alt} />
        </>
      )}
    </>
  );

  return (
    <ProductProvider>
      {meta}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
          <div className="h-full w-full basis-full lg:basis-4/6">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden" />
              }>
              <Gallery
                images={product.images.slice(0, 5).map((image: Image) => ({
                  src: image.url,
                  altText: image.altText,
                }))}
              />
            </Suspense>
          </div>

          <div className="basis-full lg:basis-2/6">
            <Suspense fallback={null}>
              <ProductDescription product={product} />
            </Suspense>
          </div>
        </div>
        <RelatedProducts id={product.id} />
      </div>
      <Footer />
    </ProductProvider>
  );
}

async function RelatedProducts({ id }: { id: string }) {
  const relatedProducts = await getProductRecommendations(id);

  if (!relatedProducts.length) return null;

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {relatedProducts.map((product) => (
          <li
            key={product.handle}
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5">
            <Link className="relative h-full w-full" href={`/product/${product.handle}`}>
              <GridTileImage
                alt={product.title}
                label={{
                  title: product.title,
                  amount: product.priceRange.maxVariantPrice.amount,
                  currencyCode: product.priceRange.maxVariantPrice.currencyCode,
                }}
                src={product.featuredImage?.url}
                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
