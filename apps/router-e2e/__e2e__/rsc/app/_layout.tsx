// import { CartProvider } from '../components/cart/cart-context';
import { Navbar } from '../components/layout/navbar';
// import { WelcomeToast } from '../components/welcome-toast';
// import { Slot } from 'expo-router';
// import { GeistSans } from 'geist/font/sans';
import { cookies } from '../lib/expo-shim';
import { ReactNode } from 'react';
// import { Toaster } from 'sonner';
import '../globals.css';

import { SafeAreaView, ScrollView, View } from '../lib/react-native';
import { Div, Main } from '@expo/html-elements';

export default function RootLayout({ children }: { children: ReactNode }) {
  const cartId = cookies().get('cartId')?.value;
  // Don't await the fetch, pass the Promise to the context provider
  // const cart = getCart(cartId);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Div className="flex flex-1 bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        {/* <CartProvider> */}
        {/* <Navbar /> */}

        {process.env.EXPO_OS === 'web' ? (
          <main>
            {children}
            {/* <Toaster closeButton /> */}
            {/* <WelcomeToast /> */}
          </main>
        ) : (
          <ScrollView>{children}</ScrollView>
        )}
        {/* </CartProvider> */}
      </Div>
    </SafeAreaView>
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
