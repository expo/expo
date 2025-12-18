import { useTheme } from '@react-navigation/native';
import { Link, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Faces, StaticFaces } from '../../components/faces';

export default function Index() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [numberOfTabPresses, setNumberOfTabPresses] = useState(0);
  const [lastMenuAction, setLastMenuAction] = useState<string | null>(null);
  useEffect(() => {
    // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
    return navigation.addListener('tabPress', () => {
      setNumberOfTabPresses((prev) => prev + 1);
    });
  }, [navigation]);
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        justifyContent: 'center',
        padding: 32,
        gap: 16,
      }}>
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}>
        Index screen
      </Text>
      <Text style={{ color: colors.text, fontSize: 18, textAlign: 'center' }}>
        Tab pressed {numberOfTabPresses} time{numberOfTabPresses === 1 ? '' : 's'}
      </Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        Link previews with zoom transition
      </Text>
      <Faces numberOfFaces={3} />
      <Link href="/tabs/faces" style={{ color: colors.text, fontSize: 18 }}>
        <Link.Trigger>See all faces (without zoom)</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/tabs/faces" style={{ color: colors.text, fontSize: 18 }} asChild>
        <Link.Trigger>
          <Pressable>
            <Link.AppleZoom>
              <View style={{ width: 170 }}>
                <StaticFaces numberOfFaces={9} size={50} />
              </View>
            </Link.AppleZoom>
            <Text>See all faces (with zoom)</Text>
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
      </Link>

      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>Additional links</Text>
      <Link href="/tabs/dynamic" style={{ color: colors.text, fontSize: 18 }}>
        <Link.Trigger>Dynamic</Link.Trigger>
        <Link.Preview />
      </Link>
      {/* Wrapping the link with View to be able to query it in maestro */}
      <View testID="index-link-menu">
        <Link href="/tabs/faces" style={{ color: colors.text, fontSize: 18 }}>
          <Link.Trigger>Link menu</Link.Trigger>
          <Link.Menu>
            <Link.MenuAction
              title="Action 1"
              onPress={() => {
                setLastMenuAction('Action 1');
              }}
              icon="0.circle"
            />
            <Link.Menu inline>
              <Link.MenuAction
                title="Action 2"
                onPress={() => {
                  setLastMenuAction('Action 2');
                }}
                icon="1.circle"
              />
              <Link.MenuAction
                title="Action 3"
                onPress={() => {
                  setLastMenuAction('Action 3');
                }}
                icon="2.circle"
              />
            </Link.Menu>
            <Link.Menu title="Submenu">
              <Link.MenuAction
                title="Action 4"
                onPress={() => {
                  setLastMenuAction('Action 4');
                }}
                icon="3.circle"
              />
            </Link.Menu>
          </Link.Menu>
        </Link>
      </View>
      <Text style={{ color: colors.text, fontSize: 18 }}>
        Last menu action pressed: {lastMenuAction ?? 'none'}
      </Text>
      <Link href="/404" style={{ color: colors.text, fontSize: 18 }}>
        Go to 404
      </Link>
      <Link href="/tabs/faces" style={{ color: colors.text, fontSize: 18 }}>
        Go to /faces
      </Link>
      <Link href="/_sitemap" style={{ color: colors.text, fontSize: 18 }}>
        Go to /_sitemap
      </Link>

      <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
        A long list to test minimize behavior
      </Text>
      {Array.from({ length: 50 }, (_, i) => (
        <Text key={i} style={{ color: colors.text, fontSize: 18 }}>
          Item {i + 1}
        </Text>
      ))}
    </ScrollView>
  );
}
