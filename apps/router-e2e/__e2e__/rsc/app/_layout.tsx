// import { CartProvider } from '../components/cart/cart-context';
import { Navbar } from '../components/layout/navbar';
// import { WelcomeToast } from '../components/welcome-toast';
// import { Slot } from 'expo-router';
// import { GeistSans } from 'geist/font/sans';
import { cookies } from '../lib/expo-shim';
import { ReactNode } from 'react';
// import { Toaster } from 'sonner';
import '../globals.css';

import { View } from '../lib/react-native';

export default function RootLayout({ children }: { children: ReactNode }) {
  const cartId = cookies().get('cartId')?.value;
  // Don't await the fetch, pass the Promise to the context provider
  // const cart = getCart(cartId);

  return (
    <View className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
      {/* <CartProvider> */}
      {/* <Navbar /> */}
      <View>
        {children}
        {/* <Toaster closeButton /> */}
        {/* <WelcomeToast /> */}
      </View>
      {/* </CartProvider> */}
    </View>
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
