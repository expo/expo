import {
  router,
  Slot,
  unstable_useIsNavigating,
  useNavigationContainerRef,
  usePathname,
} from 'expo-router';
import { useState, useTransition } from 'react';
import { Button, Text } from 'react-native';

import { Container, LoaderActivityMode } from '../components/Container';

export default function RootLayout() {
  const [hidden, setHidden] = useState(false);
  const [isChangingPost, startPostTransition] = useTransition();
  const navigation = useNavigationContainerRef();
  const isNavigating = unstable_useIsNavigating();
  const pathname = usePathname();
  if (pathname === '/revalidate') {
    return (
      <Container>
        <Slot />
      </Container>
    );
  }
  return (
    <Container>
      <Button
        testID="toggle-route-activity"
        title={hidden ? 'Show route' : 'Hide route'}
        onPress={() => setHidden(!hidden)}
      />
      <Button
        testID="transition-to-slow"
        title="Transition to slow"
        onPress={() =>
          startPostTransition(() =>
            navigation.dispatchSync({ type: 'SET_PARAMS', payload: { params: { postId: 'slow' } } })
          )
        }
      />
      <Button
        testID="replace-with-second"
        title="Replace with second"
        onPress={() => router.replace('/second')}
      />
      <Button
        testID="revisit-slow-post"
        title="Revisit slow post"
        onPress={() => router.push('/posts/slow')}
      />
      <Text testID="navigation-pending">{String(isNavigating || isChangingPost)}</Text>
      <LoaderActivityMode value={hidden ? 'hidden' : 'visible'}>
        <Slot />
      </LoaderActivityMode>
    </Container>
  );
}
