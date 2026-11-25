import { Link, Stack, type Href } from 'expo-router';
import React from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';
import { featureFlags } from 'react-native-screens';

import { PresentationPanel } from '../../components/presentation-panel';

const HomeIndex = () => {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentInsetAdjustmentBehavior="automatic">
      <Stack.Header style={{ backgroundColor: 'transparent' }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          onPress={() => console.log('Index Checkmark pressed')}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => console.log('Index Xmark pressed')} />
      </Stack.Toolbar>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <Text>
          Synchronous updates:{' '}
          {featureFlags.experiment.synchronousScreenUpdatesEnabled ? 'Enabled' : 'Disabled'}
        </Text>
        <PresentationPanel title="card (index)" />
        <CaseLink href="/modals/form-sheet-nested" text="Form Sheet Modal - nested Stack" />
        <CaseLink href="/modals/form-sheet" text="Form Sheet Modal" />
        <CaseLink href="/modals/form-sheet-content" text="Form Sheet Modal - fitToContent" />
      </View>
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
