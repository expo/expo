import 'server-only';

import { Counter } from '../components/counter';
import { greet } from '../components/server-actions-in-file';
import { UIHost } from '../components/ui-host';
import { Text, View } from '../lib/react-native';

type ServerFunction<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

export default function ServerActionTest() {
  async function renderNativeViews(name: string) {
    'use server';

    return (
      <>
        <Text style={{ color: 'darkcyan' }} testID="server-action-props">
          {name}
        </Text>
        <Text testID="server-action-platform">{process.env.EXPO_OS}</Text>
      </>
    );
  }

  return (
    <View>
      <Text testID="index-text" style={{ fontWeight: 'bold' }}>
        2) Server Action (Server Component)
      </Text>

      <Text testID="index-server-date-rendered">Date rendered: {new Date().toISOString()}</Text>

      <Counter greet={greet as unknown as ServerFunction<typeof greet>} />

      <UIHost
        renderNativeViews={renderNativeViews as unknown as ServerFunction<typeof renderNativeViews>}
      />
    </View>
  );
}
