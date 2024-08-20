// import { CartProvider } from '../components/cart/cart-context';
import { Navbar } from '../components/layout/navbar';
// import { WelcomeToast } from '../components/welcome-toast';
// import { Slot } from 'expo-router';
// import { GeistSans } from 'geist/font/sans';
import { cookies } from '../lib/expo-shim';
import { ensureStartsWith } from '../lib/utils';
import { ReactNode } from 'react';
// import { Toaster } from 'sonner';
import '../globals.css';
import { Children } from 'expo-router/build/rsc/router/host';

const { TWITTER_CREATOR, TWITTER_SITE, SITE_NAME } = process.env;
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined;
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined;

// export const metadata = {
//   metadataBase: new URL(baseUrl),
//   title: {
//     default: SITE_NAME!,
//     template: `%s | ${SITE_NAME}`
//   },
//   robots: {
//     follow: true,
//     index: true
//   },
//   ...(twitterCreator &&
//     twitterSite && {
//       twitter: {
//         card: 'summary_large_image',
//         creator: twitterCreator,
//         site: twitterSite
//       }
//     })
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  const cartId = cookies().get('cartId')?.value;
  // Don't await the fetch, pass the Promise to the context provider
  // const cart = getCart(cartId);

  return (
    <div className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
      {/* <CartProvider> */}
      <Navbar />
      <main>
        {children}
        {/* <Toaster closeButton /> */}
        {/* <WelcomeToast /> */}
      </main>
      {/* </CartProvider> */}
    </div>
  );
  // return (
  //   <html lang="en">
  //     {/* <html lang="en" className={GeistSans.variable}> */}
  //     <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
  //       <CartProvider cartPromise={cart}>
  //         <Navbar />
  //         <main>
  //           {/* {children} */}
  //           <Slot />
  //           <Toaster closeButton />
  //           <WelcomeToast />
  //         </main>
  //       </CartProvider>
  //     </body>
  //   </html>
  // );
}
