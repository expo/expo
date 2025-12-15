import * as ExpoNotifications from 'expo-notifications';
import HeadingText from 'native-component-list/src/components/HeadingText';
import React, { useCallback } from 'react';
import { Text } from 'react-native';

import { ScrollView } from '../misc/Themed';

export default function PlaygroundPage() {
  const foo = useCallback(() => {
    const categories = {
      cat1: [
        {
          identifier: 'id1.1',
          buttonTitle: 'id 1',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'id1.2',
          buttonTitle: 'id 2',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      cat2: [
        {
          identifier: 'id2.1',
          buttonTitle: 'id 1',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'id2.2',
          buttonTitle: 'id 2',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      cat3: [
        {
          identifier: 'id3.1',
          buttonTitle: 'id 1',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'id3.2',
          buttonTitle: 'id 2',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
      cat4: [
        {
          identifier: 'id4.1',
          buttonTitle: 'id 1',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'id4.2',
          buttonTitle: 'id 2',
          options: {
            isDestructive: false,
            opensAppToForeground: true,
          },
        },
      ],
    };
    Promise.all(
      Object.entries(categories).map(([id, acts]) => {
        console.log(`Registering category ${id}`);
        return ExpoNotifications.setNotificationCategoryAsync(id, acts);
      })
    )
      .then((v) => {
        console.log('"Successful" register: ' + JSON.stringify(v.map((x) => !!x)));
        return ExpoNotifications.getNotificationCategoriesAsync();
      })
      .then((categories) => {
        console.log(
          'Registered categories: ' +
            JSON.stringify(
              categories.map((it) => it.identifier),
              null,
              2
            )
        );
        // NOT all categories are always returned, but at least one is.
      });
  }, []);

  return (
    <ScrollView contentContainerStyle={{ rowGap: 10, padding: 10 }}>
      <HeadingText>
        Playground for bug repros. Keep in mind this is not completely isolated (other notifications
        code runs at startup)
      </HeadingText>
      <Text onPress={foo}>Press me</Text>
      <Text
        onPress={async () => {
          for (const cat of ['cat1', 'cat2', 'cat3', 'cat4']) {
            await ExpoNotifications.deleteNotificationCategoryAsync(cat);
          }
          const cats = await ExpoNotifications.getNotificationCategoriesAsync();
          console.log(`left: ${cats.map((c) => c.identifier).join(', ') || '<none>'}`);
        }}>
        delete all four
      </Text>
    </ScrollView>
  );
}
