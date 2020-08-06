import { EvilIcons } from '@expo/vector-icons';
import { Link, useLinkProps, useNavigation } from '@react-navigation/native';
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
} from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';

interface ListElement {
  name: string;
  route?: string;
  isAvailable?: boolean;
}

interface Props {
  apis: ListElement[];
  renderItemRight?: (props: ListElement) => React.ReactNode;
}

function LinkButton({
  to,
  action,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { disabled?: boolean; children?: React.ReactNode }) {
  const { onPress, ...props } = useLinkProps({ to, action });

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
        onClick={onPress}
        {...props}
        {...rest}
        style={[
          {
            transitionDuration: '150ms',
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

function ComponentListScreen(props: Props) {
  React.useEffect(() => {
    StatusBar.setHidden(false);
  }, []);

  // adjust the right padding for safe area -- we don't need the left because that's where the drawer is.
  const { bottom, right } = useSafeArea();

  const _renderExampleSection: ListRenderItem<ListElement> = ({ item }) => {
    const { route, name: exampleName, isAvailable } = item;
    return (
      <LinkButton disabled={!isAvailable} to={route ?? exampleName} style={[styles.rowTouchable]}>
        <View
          pointerEvents="none"
          style={[styles.row, !isAvailable && styles.disabledRow, { paddingRight: 10 + right }]}>
          {props.renderItemRight && props.renderItemRight(item)}
          <Text style={styles.rowLabel}>{exampleName}</Text>
          <Text style={styles.rowDecorator}>
            <EvilIcons name="chevron-right" size={24} color="#595959" />
          </Text>
        </View>
      </LinkButton>
    );
  };

  const _keyExtractor = React.useCallback((item: ListElement) => item.name, []);

  return (
    <FlatList<ListElement>
      initialNumToRender={25}
      removeClippedSubviews={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ backgroundColor: '#fff', paddingBottom: bottom }}
      data={props.apis}
      keyExtractor={_keyExtractor}
      renderItem={_renderExampleSection}
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

export default ComponentListScreen;
