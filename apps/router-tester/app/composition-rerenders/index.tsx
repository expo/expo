import { Link, Stack, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';

const SUITES = ['Default', 'Browse', 'Search'] as const;

const HomeIndex = () => {
  const [configSuite, setConfigSuite] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <>
      {configSuite === 0 && (
        <>
          <Stack.Screen.Title>Home</Stack.Screen.Title>
          <Stack.Screen.BackButton hidden />
          <Stack.Header blurEffect="regular" />
        </>
      )}
      {configSuite === 1 && (
        <>
          <Stack.Screen.Title large>Home - Browse</Stack.Screen.Title>
          <Stack.Header style={{ backgroundColor: '#99f' }} />
        </>
      )}
      {configSuite === 2 && (
        <>
          <Stack.Screen.Title>Home - Search</Stack.Screen.Title>
          <Stack.Screen.BackButton hidden />
          <Stack.SearchBar placeholder="Test" />
        </>
      )}
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ alignItems: 'center', gap: 16 }}
        contentInsetAdjustmentBehavior="automatic">
        <View>
          <Text>Composition Rerenders - Index</Text>
          <Text testID="index-render-count" style={{ fontSize: 32 }}>
            Renders: {renderCount.current}
          </Text>
        </View>
        <Pressable
          testID="index-cycle-config"
          onPress={() => setConfigSuite((s) => (s + 1) % SUITES.length)}
          style={{ backgroundColor: 'rgb(175, 103, 11)', padding: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Config: {SUITES[configSuite]} (tap to cycle)</Text>
        </Pressable>
        {Array.from({ length: 2 }).map((_, i) => (
          <CaseLink key={i} href={`/composition-rerenders/${i}`} text={`Go to ${i}`} />
        ))}
      </ScrollView>
    </>
  );
};

function CaseLink({ href, text }: { href: Href; text: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>{text}</Text>
      </Pressable>
    </Link>
  );
}

export default HomeIndex;
