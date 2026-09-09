import { Button, Host, List, Text as SwiftUIText, VStack } from '@expo/ui/swift-ui';
import { useEffect, useState } from 'react';
import { Button as RNButton, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const data = Array.from({ length: 200 }, (_, index) => ({ id: String(index) }));
const keyExtractor = (item: { id: string }) => item.id;
const renderItem = ({ item }: { item: { id: string } }) => <Row id={item.id} />;
let mountedCount = 0;

function Row({ id }: { id: string }) {
  const [taps, setTaps] = useState(0);
  useEffect(() => {
    mountedCount++;
    console.info(`[List window] mount ${id}; count=${mountedCount}`);
    return () => {
      mountedCount--;
      console.info(`[List window] unmount ${id}; count=${mountedCount}`);
    };
  }, [id]);
  return (
    <VStack alignment="leading" spacing={8}>
      <Button label={`Row ${id} · taps ${taps}`} onPress={() => setTaps((value) => value + 1)} />
      <SwiftUIText>{'Variable height content. '.repeat(((Number(id) % 5) + 1) * 3)}</SwiftUIText>
    </VStack>
  );
}

export default function Playground() {
  const [generation, setGeneration] = useState(0);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Text>Step 3: buffered window + measured heights</Text>
        <Text>
          200 rows. Far-away rows unmount; local taps reset on return. See mount counts in the
          console.
        </Text>
        <RNButton title="Reset rows" onPress={() => setGeneration((value) => value + 1)} />
      </View>
      <Host style={{ flex: 1 }}>
        <List
          key={generation}
          data={data}
          keyExtractor={keyExtractor}
          estimatedRowHeight={100}
          initialNumToRender={0}
          overscanCount={5}
          renderItem={renderItem}
        />
      </Host>
    </SafeAreaView>
  );
}
