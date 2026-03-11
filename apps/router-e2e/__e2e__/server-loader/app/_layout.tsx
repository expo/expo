import { Slot } from 'expo-router';

import { Container } from '../components/Container';

export default function RootLayout() {
  return (
    <Container>
      <Slot />
    </Container>
  );
}
