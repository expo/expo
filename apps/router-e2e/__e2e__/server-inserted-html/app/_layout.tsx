import { Slot } from 'expo-router';

import { StreamedDataProvider } from '../components/StreamedData';

export default function RootLayout() {
  return (
    <StreamedDataProvider>
      <Slot />
    </StreamedDataProvider>
  );
}
