import { Column, Host, Icon, Row, ScrollView, Text } from '@expo/ui';
import * as React from 'react';

const TITLE_STYLE = { fontSize: 16, fontWeight: '600' as const };
const DESCRIPTION_STYLE = { fontSize: 13, color: '#666' };

// Prefer the `import()` form for the Android side — TypeScript validates the
// literal path through `@expo/material-symbols`'s exports map, so typos surface
// at compile time. The `@expo/ui/babel-plugin` (auto-loaded by
// `babel-preset-expo`) rewrites `import('...')` to `require('...')` so Metro
// still tree-shakes the unused branch per platform.
const STAR = Icon.select({
  ios: 'star.fill',
  android: import('@expo/material-symbols/star.xml'),
});

const HOME = Icon.select({
  ios: 'house.fill',
  android: import('@expo/material-symbols/home.xml'),
});

const HEART = Icon.select({
  ios: 'heart.fill',
  android: import('@expo/material-symbols/favorite.xml'),
});

export default function IconScreen() {
  const [favorited, setFavorited] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        <Column spacing={24}>
          <Column spacing={8}>
            <Text textStyle={TITLE_STYLE}>Icon.select (recommended)</Text>
            <Text textStyle={DESCRIPTION_STYLE}>
              Hoisted module-level definitions. The babel-preset-expo plugin rewrites the call into
              a Platform.OS ternary so the unused side is stripped per platform.
            </Text>
            <Row spacing={16}>
              <Icon name={STAR} size={28} color="#FFB400" />
              <Icon name={HOME} size={28} color="#3478F6" />
              <Icon name={HEART} size={28} color="#FF3B30" />
            </Row>
          </Column>

          <Column spacing={8}>
            <Text textStyle={TITLE_STYLE}>Inline Icon.select</Text>
            <Text textStyle={DESCRIPTION_STYLE}>
              Defined at the call site — also tree-shakes via the babel plugin.
            </Text>
            <Icon
              name={Icon.select({
                ios: 'gearshape.fill',
                android: import('@expo/material-symbols/settings.xml'),
              })}
              size={28}
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={TITLE_STYLE}>{'Inline { ios, android } object'}</Text>
            <Text textStyle={DESCRIPTION_STYLE}>
              Same runtime behavior as Icon.select but does NOT tree-shake — both sides ship to both
              platforms. Use Icon.select instead when bundle size matters.
            </Text>
            <Icon
              name={{
                ios: 'bell.fill',
                android: require('@expo/material-symbols/notifications.xml'),
              }}
              size={28}
              color="#34C759"
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={TITLE_STYLE}>State-driven icon</Text>
            <Text textStyle={DESCRIPTION_STYLE}>
              Tap to toggle. iOS swaps the SF Symbol between filled and outlined. Android pairs
              `@expo/material-symbols/favorite.xml` (outlined, from the package) with a local custom
              XML drawable for the filled variant — drop any vector XML from fonts.google.com or
              `npx add-icon --fill` into your project and `require()` it.
            </Text>
            <Icon
              name={
                favorited
                  ? Icon.select({
                      ios: 'heart.fill',
                      android: require('../../../assets/favorite_fill.xml'),
                    })
                  : Icon.select({
                      ios: 'heart',
                      android: import('@expo/material-symbols/favorite.xml'),
                    })
              }
              size={28}
              color={favorited ? '#FF3B30' : '#8E8E93'}
              onPress={() => setFavorited((v) => !v)}
              accessibilityLabel={favorited ? 'Unfavorite' : 'Favorite'}
            />
          </Column>

          <Column spacing={8}>
            <Text textStyle={TITLE_STYLE}>Sized + tinted variants</Text>
            <Row alignment="center" spacing={12}>
              <Icon name={STAR} size={16} color="#FFB400" />
              <Icon name={STAR} size={24} color="#FFB400" />
              <Icon name={STAR} size={32} color="#FFB400" />
              <Icon name={STAR} size={40} color="#FFB400" />
            </Row>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}

IconScreen.navigationOptions = {
  title: 'Universal Icon',
};
