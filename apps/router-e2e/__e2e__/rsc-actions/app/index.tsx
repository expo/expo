import { Counter, MultiplierButton } from '../components/counter';
import { greet } from '../components/funcs';
import { UIHost } from '../components/ui-host';
import { Text, View } from '../lib/react-native';

type ServerFunction<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

export default function ServerActionTest() {
  async function renderNativeViews(name: string) {
    'use server';

    return (
      <Text style={{ color: 'darkcyan' }}>
        Hello {name} from expo/{process.env.EXPO_OS} server!
      </Text>
    );
  }

  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>10) Server Action (Server Component)</Text>

      <Counter greet={greet as unknown as ServerFunction<typeof greet>} />
      <Text>Date rendered: {new Date().toISOString()}</Text>

      <UIHost
        renderNativeViews={renderNativeViews as unknown as ServerFunction<typeof renderNativeViews>}
      />
      <InnerProps multiplier={2} />
    </View>
  );
}

// Tests the binding of this outer prop to the inner scope of the server action.
function InnerProps({ multiplier }: { multiplier: number }) {
  return (
    <View>
      <MultiplierButton
        onPress={async (value) => {
          'use server';

          return multiplier * value;
        }}
      />
    </View>
  );
}
