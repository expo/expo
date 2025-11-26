import { useTheme } from '@react-navigation/native';
import { Link } from 'expo-router';
import { use } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Post } from '../components/Post';
import { Faces } from '../components/faces';
import { ActiveTabsContext } from '../utils/active-tabs-context';

const availableTabs = ['tab-1', 'tab-2', 'tab-3', 'tab-4', 'tab-5', 'tab-6'];

export default function Index() {
  const { colors } = useTheme();
  const { activeTabs, setActiveTabs } = use(ActiveTabsContext);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        justifyContent: 'center',
        // alignItems: 'center',
        padding: 32,
        gap: 16,
      }}>
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}>
        Good Afternoon
      </Text>
      <Text style={{ color: colors.text, fontSize: 24, marginBottom: 16, textAlign: 'center' }}>
        If you have a watch, this is an app for you!
      </Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Best faces</Text>
      <Faces numberOfFaces={3} />
      <Link href="/faces" style={{ color: colors.text, fontSize: 18 }} unstable_transition="zoom">
        <Link.Trigger>See all faces</Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Latest news</Text>
      <Post title="New watches in August" href="/explore/news/new-watches-august" />
      <Link href="/explore" style={{ color: colors.text, fontSize: 18 }}>
        <Link.Trigger>See all news</Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>History</Text>
      <Link href="/explore/news/new-watches-august" asChild>
        <Link.Trigger>
          <Pressable style={{ borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 48, fontWeight: 600 }}>08</Text>
              <Link href="/explore/news/new-watches-august" asChild>
                <Link.Trigger>
                  <Pressable style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
                    <View
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        backgroundColor: '#9ca3af',
                      }}
                    />
                  </Pressable>
                </Link.Trigger>
                <Link.Preview />
              </Link>
            </View>
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
      </Link>

      <Link href="/explore" style={{ color: colors.text, fontSize: 18 }}>
        <Link.Trigger>See all</Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Additional links</Text>
      <Link href="/dynamic" style={{ color: colors.text, fontSize: 18 }}>
        <Link.Trigger>Dynamic</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/404" style={{ color: colors.text, fontSize: 18 }}>
        Try and go to 404
      </Link>
      <Link href="/tab-1" style={{ color: colors.text, fontSize: 18 }}>
        Try and go to Tab 1
      </Link>
      <Link href="/tab-2" style={{ color: colors.text, fontSize: 18 }}>
        Try and go to Tab 2
      </Link>
      <Link href="/faces" style={{ color: colors.text, fontSize: 18 }}>
        Try and go to Faces
      </Link>
      <Link href="/_sitemap" style={{ color: colors.text, fontSize: 18 }}>
        Sitemap is here
      </Link>
      <View style={{ marginTop: 16 }}>
        <Text style={{ color: colors.text, fontSize: 18 }}>Additional Tabs:</Text>
        {availableTabs.map((tab) => (
          <View
            key={tab}
            style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 24 }}>
            <Switch
              value={activeTabs.includes(tab)}
              onValueChange={(value) => {
                setActiveTabs((prev) => (value ? [...prev, tab] : prev.filter((t) => t !== tab)));
              }}
            />
            <Text style={{ color: colors.text }}>{tab}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
