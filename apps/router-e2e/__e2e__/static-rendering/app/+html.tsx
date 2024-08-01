// Test the custom HTML component is rendered during SSR.

import { usePathname } from 'expo-router';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Html({ children }) {
  // Test that this is defined and works during SSR.
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <meta name="custom-value" content="value" />
        <meta name="expo-e2e-pathname" content={pathname} />
        {/* Test that public env vars are exposed */}
        <meta name="expo-e2e-public-env-var" content={process.env.EXPO_PUBLIC_TEST_VALUE} />
        {/* Test that server-only env vars are exposed as this file is a server file. */}
        <meta name="expo-e2e-private-env-var" content={process.env.EXPO_NOT_PUBLIC_TEST_VALUE} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
