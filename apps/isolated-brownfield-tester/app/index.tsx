import ExpoBrownfieldModule from 'expo-brownfield';
import { RootLayout } from '@/layouts';
import useBackHandling from '@/hooks/use-back-handling';
import { NavigationLink } from '@/components/navigation-link';

export default function HomeScreen() {
  // Prevent the default back button behavior of host app
  // if it's possible to go back within the React Native app.
  useBackHandling();

  return (
    <RootLayout
      headerOptions={{
        headerBackgroundColor: { light: '#A1CEDC', dark: '#1D3D47' },
        headerImage: 'reactLogo',
        showWave: true,
        title: 'Welcome!',
      }}
    >
      <NavigationLink
        onPress={() => ExpoBrownfieldModule.popToNative()}
        title="Pop to native"
        subtitle="Return to native app"
      />
      <NavigationLink
        onPress={() => ExpoBrownfieldModule.popToNative(true)}
        title="Pop to native (animated)"
        subtitle="Return to native app with animation enabled (iOS UIKit only)"
      />
      <NavigationLink
        href="/explore"
        title="Explore"
        subtitle="Explore this app"
      />
      <NavigationLink
        href="/modal"
        title="Modal"
        subtitle="Show modal screen"
      />
      <NavigationLink
        href="/communication"
        title="Communication"
        subtitle="Bi-directional communication between host app and brownfield"
      />
    </RootLayout>
  );
}
