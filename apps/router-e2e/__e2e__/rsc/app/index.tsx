import { ThreeItemGrid } from '../components/grid/three-items';
import { Carousel } from '../components/carousel';

import '../globals.css';

// export const metadata = {
//   description: 'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
//   openGraph: {
//     type: 'website'
//   }
// };

export default function HomePage() {
  return (
    <>
      <meta
        name="description"
        content="High-performance ecommerce store built with Next.js, Vercel, and Shopify."
      />
      <meta property="og:type" content="website" />
      <ThreeItemGrid />
      <Carousel />
      {/* <Footer /> */}
    </>
  );
}
