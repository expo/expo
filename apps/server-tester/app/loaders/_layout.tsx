import {
  router,
  Slot,
  Stack,
  unstable_useIsNavigating,
  useNavigationContainerRef,
} from 'expo-router';
import { useState, useTransition } from 'react';
import { Button, Text } from 'react-native';

import { LoaderActivityMode } from '@/components/LoaderActivity';
import { Panel } from '@/components/Panel';
import { Section } from '@/components/Section';

// Loader pages replace each other instead of stacking. The loader E2E suites count a loader request
// on every fresh mount, and a stack keeps the previous page mounted when it pops back to it.
export default function LoadersLayout() {
  const [hidden, setHidden] = useState(false);
  const [isChangingPost, startPostTransition] = useTransition();
  const navigation = useNavigationContainerRef();
  const isNavigating = unstable_useIsNavigating();
  return (
    <>
      <Stack.Screen options={{ title: 'Loaders' }} />
      <Section title="Loader lifecycle">
        <Panel>
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
                navigation.dispatchSync({
                  type: 'SET_PARAMS',
                  payload: { params: { postId: 'slow' } },
                })
              )
            }
          />
          <Button
            testID="replace-with-second"
            title="Replace with second"
            onPress={() => router.replace('/loaders/second')}
          />
          <Button
            testID="revisit-slow-post"
            title="Revisit slow post"
            onPress={() => router.push('/loaders/posts/slow')}
          />
          <Text testID="navigation-pending">{String(isNavigating || isChangingPost)}</Text>
        </Panel>
      </Section>
      <LoaderActivityMode value={hidden ? 'hidden' : 'visible'}>
        <Slot />
      </LoaderActivityMode>
    </>
  );
}
