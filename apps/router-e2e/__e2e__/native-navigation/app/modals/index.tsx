import { Link, usePathname, type Href } from 'expo-router';
import React from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';
import { featureFlags } from 'react-native-screens';

const HomeIndex = () => {
  const pathname = usePathname();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ alignItems: 'center', gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Modals</Text>
        <Text>Current Path: {pathname}</Text>
        <Text>
          Synchronous updates:{' '}
          {featureFlags.experiment.synchronousScreenUpdatesEnabled ? 'Enabled' : 'Disabled'}
        </Text>
      </View>
      <CaseLink href="/modals/form-sheet" text="Form Sheet Modal" />
      <CaseLink href="/modals/form-sheet-content" text="Form Sheet Modal - fitToContent" />
      <CaseLink href="/modals/page-sheet" text="Page Sheet Modal" />
    </ScrollView>
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
