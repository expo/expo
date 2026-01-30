import { Box, Host, LinearProgress } from '@expo/ui/jetpack-compose';
import { align, fillMaxSize, fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { ComposeWebView } from '@/modules/compose-webview';

export default function Page() {
  const colorScheme = useColorScheme();
  const { title, url } = useLocalSearchParams<{ title: string; url: string }>();
  const [progress, setProgress] = useState(0);

  return (
    <>
      <Stack.Screen options={{ title: title ?? '' }} />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <Box modifiers={[fillMaxSize()]}>
          <ComposeWebView url={url ?? ''} onLoadingProgressChanged={(p) => setProgress(p)} />
          {progress > 0 && progress < 100 ? (
            <LinearProgress
              progress={progress / 100}
              modifiers={[fillMaxWidth(), align('topCenter')]}
            />
          ) : null}
        </Box>
      </Host>
    </>
  );
}
