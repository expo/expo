import {
  type NavigationProp,
  NavigationProvider,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';
import * as React from 'react';
import {
  Animated,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from './Background';
import { getDefaultHeaderHeight } from './Header/getDefaultHeaderHeight';
import { HeaderHeightContext } from './Header/HeaderHeightContext';
import { HeaderShownContext } from './Header/HeaderShownContext';
import { useFrameSize } from './useFrameSize';

type Props = {
  focused: boolean;
  modal?: boolean;
  navigation: NavigationProp<ParamListBase>;
  route: RouteProp<ParamListBase>;
  header: React.ReactNode;
  headerShown?: boolean;
  headerStatusBarHeight?: number;
  headerTransparent?: boolean;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  children: React.ReactNode;
};

export function Screen(props: Props) {
  const insets = useSafeAreaInsets();

  const isParentHeaderShown = React.useContext(HeaderShownContext);
  const parentHeaderHeight = React.useContext(HeaderHeightContext);

  const {
    focused,
    modal = false,
    header,
    headerShown = true,
    headerTransparent,
    headerStatusBarHeight = isParentHeaderShown ? 0 : insets.top,
    navigation,
    route,
    children,
    style,
  } = props;

  const defaultHeaderHeight = useFrameSize((size) =>
    getDefaultHeaderHeight(size, modal, headerStatusBarHeight)
  );

  const headerRef = React.useRef<View>(null);

  const [headerHeight, setHeaderHeight] = React.useState(defaultHeaderHeight);

  React.useLayoutEffect(() => {
    headerRef.current?.measure((_x, _y, _width, height) => {
      setHeaderHeight(height);
    });
  }, [route.name]);

  return (
    <Background
      aria-hidden={!focused}
      style={[styles.container, style]}
      // On Fabric we need to disable collapsing for the background to ensure
      // that we won't render unnecessary views due to the view flattening.
      collapsable={false}
    >
      {headerShown ? (
        <NavigationProvider route={route} navigation={navigation}>
          <View
            ref={headerRef}
            pointerEvents="box-none"
            onLayout={(e) => {
              const { height } = e.nativeEvent.layout;

              setHeaderHeight(height);
            }}
            style={[styles.header, headerTransparent ? styles.absolute : null]}
          >
            {header}
          </View>
        </NavigationProvider>
      ) : null}
      <View style={styles.content}>
        <HeaderShownContext.Provider
          value={isParentHeaderShown || headerShown !== false}
        >
          <HeaderHeightContext.Provider
            value={headerShown ? headerHeight : (parentHeaderHeight ?? 0)}
          >
            {children}
          </HeaderHeightContext.Provider>
        </HeaderShownContext.Provider>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    zIndex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
  },
});
