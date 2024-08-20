// 'use dom';

// import { ThreeItemGrid } from '../components/grid/three-items';
// import { Carousel } from '../components/carousel';

// import '../globals.css';
// import Footer from '../components/layout/footer';
// import { Meta } from 'expo-router/head';
// import { Text } from '../lib/react-native';
// // export const metadata = {
// //   description: 'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
// //   openGraph: {
// //     type: 'website'
// //   }
// // };

// export default function HomePage() {
//   return (
//     <>
//       <Meta
//         name="description"
//         content="High-performance ecommerce store built with Next.js, Vercel, and Shopify."
//       />
//       <Meta property="og:type" content="website" />
//       <ThreeItemGrid />
//       {/* <Carousel />
//       <Footer /> */}
//     </>
//   );
// }

import Main from '../components/main';
import { getCollectionProducts } from '../lib/shopify';

export default async function HomePage() {
  // Collections that start with `hidden-*` are hidden from the search page.
  const homepageItems = await getCollectionProducts({
    collection: 'hidden-homepage-featured-items',
  });

  return (
    <Main
      products={homepageItems}
      dom={{
        style: {
          minHeight: '100%',
          height: 720,
          flex: 1,
        },
      }}
    />
  );
}
