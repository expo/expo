import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Link,
  NavigationAction,
  StackActions,
  useLinkBuilder,
  useLinkProps,
} from '@react-navigation/native';
import * as SS from '@react-navigation/stack';
import React from 'react';
import {
  FlatList,
  ListRenderItem,
  PixelRatio,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ListElement {
  name: string;
  route?: string;
  isAvailable?: boolean;
}

interface Props {
  apis: ListElement[];
  renderItemRight?: (props: ListElement) => React.ReactNode;
  sort?: boolean;
}

function LinkButton({
  href,
  children,
  screenName,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, 'action'> & {
  href: string;
  disabled?: boolean;
  children?: React.ReactNode;
  screenName?: string;
}) {
  const { buildAction } = useLinkBuilder();
  let action: NavigationAction = buildAction(href);
  if (screenName) {
    action = StackActions.push(screenName);
  }

  const { onPress, ...props } = useLinkProps({ href, action });

  const [isPressed, setIsPressed] = React.useState(false);

  if (Platform.OS === 'web') {
    // It's important to use a `View` or `Text` on web instead of `TouchableX`
    // Otherwise React Native for Web omits the `onClick` prop that's passed
    // You'll also need to pass `onPress` as `onClick` to the `View`
    // You can add hover effects using `onMouseEnter` and `onMouseLeave`
    return (
      <Pressable
        pointerEvents={rest.disabled === true ? 'none' : 'auto'}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        {...props}
        {...rest}
        style={[
          {
            backgroundColor: isPressed ? '#dddddd' : undefined,
          },
          rest.style,
        ]}>
        {children}
      </Pressable>
    );
  }

  return (
    <TouchableHighlight underlayColor="#dddddd" onPress={onPress} {...props} {...rest}>
      {children}
    </TouchableHighlight>
  );
}

export default function ComponentListScreen(props: Props) {
  React.useEffect(() => {
    StatusBar.setHidden(false);
  }, []);

  const { width } = useWindowDimensions();
  const isMobile = width <= 640;

  // adjust the right padding for safe area -- we don't need the left because that's where the drawer is.
  const { bottom, right } = useSafeAreaInsets();

  const renderExampleSection: ListRenderItem<ListElement> = ({ item }) => {
    const { route, name: exampleName, isAvailable } = item;
    console.log(route, exampleName);
    return (
      <LinkButton
        disabled={!isAvailable}
        href={route ?? exampleName}
        screenName={exampleName}
        style={[styles.rowTouchable]}>
        <View
          pointerEvents="none"
          style={[styles.row, !isAvailable && styles.disabledRow, { paddingRight: 10 + right }]}>
          {props.renderItemRight && props.renderItemRight(item)}
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
            <Ionicons name="chevron-forward" size={18} color="#595959" />
          </Text>
        </View>
      </LinkButton>
    );
  };

  const keyExtractor = React.useCallback((item: ListElement) => item.name, []);

  const sortedApis = React.useMemo(() => {
    if (props.sort === false) {
      return props.apis;
    }
    return props.apis.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        if (a.isAvailable) {
          return -1;
        }
        return 1;
      }
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });
  }, [props.apis]);

  return (
    <FlatList<ListElement>
      initialNumToRender={25}
      removeClippedSubviews={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ backgroundColor: '#fff', paddingBottom: isMobile ? 0 : bottom }}
      data={sortedApis}
      keyExtractor={keyExtractor}
      renderItem={renderExampleSection}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  row: {
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDecorator: {
    alignSelf: 'flex-end',
    paddingRight: 4,
  },
  rowTouchable: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#dddddd',
  },
  disabledRow: {
    opacity: 0.3,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowIcon: {
    marginRight: 10,
    marginLeft: 6,
  },
});
