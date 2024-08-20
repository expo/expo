import { ThreeItemGrid } from '../components/grid/three-items';
import { Carousel } from '../components/carousel';

import '../globals.css';
import Footer from '../components/layout/footer';
import { Meta } from 'expo-router/head';
import { Text } from '../lib/react-native';
// export const metadata = {
//   description: 'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
//   openGraph: {
//     type: 'website'
//   }
// };

export default function HomePage() {
  return (
    <>
      <Meta
        name="description"
        content="High-performance ecommerce store built with Next.js, Vercel, and Shopify."
      />
      <Meta property="og:type" content="website" />
      <ThreeItemGrid />
      {/* <Carousel />
      <Footer /> */}
    </>
  );
}
