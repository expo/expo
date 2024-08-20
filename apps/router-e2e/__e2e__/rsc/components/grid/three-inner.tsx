'use dom';

import GridTileImage from './tile';
import type { Product } from '../../lib/shopify/types';
import { Link } from 'expo-router';

import '../../globals.css';

function ThreeItemGridItem({
  item,
  size,
  priority,
}: {
  item: Product;
  size: 'full' | 'half';
  priority?: boolean;
}) {
  if (process.env.EXPO_OS === 'web') {
    return (
      <div
        className={size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1'}>
        <Link
          className="relative block aspect-square h-full w-full"
          href={`/product/${item.handle}`}>
          <GridTileImage
            src={item.featuredImage.url}
            sizes={
              size === 'full' ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'
            }
            alt={item.title}
            label={{
              position: size === 'full' ? 'center' : 'bottom',
              title: item.title as string,
              amount: item.priceRange.maxVariantPrice.amount,
              currencyCode: item.priceRange.maxVariantPrice.currencyCode,
            }}
          />
        </Link>
      </div>
    );
  }
  return (
    <Div
      className={size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1'}>
      <Link
        asChild
        className="relative web:block aspect-square h-full w-full"
        href={`/product/${item.handle}`}>
        <TouchableOpacity>
          <GridTileImage
            src={item.featuredImage.url}
            sizes={
              size === 'full' ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'
            }
            dom={{
              style: {
                width: '100%',
                height: 148,
                backgroundColor: 'orange',
              },
            }}
            alt={item.title}
            label={{
              position: size === 'full' ? 'center' : 'bottom',
              title: item.title as string,
              amount: item.priceRange.maxVariantPrice.amount,
              currencyCode: item.priceRange.maxVariantPrice.currencyCode,
            }}
          />
        </TouchableOpacity>
      </Link>
    </Div>
  );
}

import { Div, Section } from '@expo/html-elements';
import { TouchableOpacity } from '../../lib/react-native';

export default function ThreeInner({ products }: { products: Product[] }) {
  const [firstProduct, secondProduct, thirdProduct] = products;

  if (process.env.EXPO_OS === 'web') {
    return (
      <section className="mx-auto grid max-w-screen-2xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
        <ThreeItemGridItem size="full" item={firstProduct} />
        <ThreeItemGridItem size="half" item={secondProduct} />
        <ThreeItemGridItem size="half" item={thirdProduct} />
      </section>
    );
  }

  return (
    <Section className="max-w-screen-2xl gap-4 px-4 pb-4">
      <ThreeItemGridItem size="full" item={firstProduct} />
      <ThreeItemGridItem size="half" item={secondProduct} />
      <ThreeItemGridItem size="half" item={thirdProduct} />
    </Section>
  );
}
