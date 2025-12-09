import { useTheme } from '@react-navigation/native';
import { Color, Link, useNavigation } from 'expo-router';
import { use, useEffect } from 'react';
import { Pressable, ScrollView, Switch, Text, useWindowDimensions, View } from 'react-native';

import { Post } from '../components/Post';
import { Faces } from '../components/faces';
import { ActiveTabsContext } from '../utils/active-tabs-context';

const availableTabs = ['tab-1', 'tab-2', 'tab-3', 'tab-4', 'tab-5', 'tab-6'];
import { Toolbar } from 'expo-router/unstable-toolbar';
export default function Index() {
  const { colors } = useTheme();
  const { activeTabs, setActiveTabs } = use(ActiveTabsContext);
  const navigation = useNavigation();
  useEffect(() => {
    // @ts-expect-error: tabPress is only available on tab navigators. This is react-navigation types issue.
    return navigation.addListener('tabPress', () => {
      console.log('Tab Pressed - index tab');
    });
  }, [navigation]);
  const { width } = useWindowDimensions();
  const padding = 12;
  const itemWidth = width * 0.5 - padding * 1.5;
  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1 }}
        contentContainerStyle={{
          // justifyContent: 'center',
          // alignItems: 'center',
          padding: padding,
          gap: padding,
          width: '100%',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
        {Array(20)
          .fill()
          .map((_, i) => (
            <View
              key={i}
              style={{
                width: itemWidth,
                height: (itemWidth * 3) / 2,

                borderRadius: 24,
                borderCurve: 'continuous',
                backgroundColor: Color.ios.systemGray2,
              }}
            />
          ))}
      </ScrollView>
    </>
  );
}
