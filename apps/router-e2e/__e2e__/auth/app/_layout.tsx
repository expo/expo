import { Slot } from 'expo-router';

import { SessionProvider } from '../ctx';

export default function Root() {
  // We won't do any navigation or route protection in the root layout as this
  // could lead to issues where we attempt to navigate before the router has mounted.
  return (
    // Setup the auth context and render our layout inside of it.
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
