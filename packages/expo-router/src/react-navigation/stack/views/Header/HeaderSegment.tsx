import {
  getDefaultHeaderHeight,
  Header,
  HeaderBackButton,
  type HeaderBackButtonProps,
  HeaderTitle,
} from '@react-navigation/elements';
import { useLocale } from '@react-navigation/native';
import * as React from 'react';
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import type {
  Layout,
  SceneProgress,
  StackHeaderOptions,
  StackHeaderStyleInterpolator,
} from '../../types';

type Props = Omit<StackHeaderOptions, 'headerStatusBarHeight'> & {
  headerStatusBarHeight: number;
  layout: Layout;
  title: string;
  modal: boolean;
  onGoBack?: () => void;
  backHref?: string;
  progress: SceneProgress;
  styleInterpolator: StackHeaderStyleInterpolator;
};

export function HeaderSegment(props: Props) {
  const { direction } = useLocale();

  const [leftLabelLayout, setLeftLabelLayout] = React.useState<
    Layout | undefined
  >(undefined);

  const [titleLayout, setTitleLayout] = React.useState<Layout | undefined>(
    undefined
  );

  const handleTitleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    setTitleLayout((titleLayout) => {
      if (
        titleLayout &&
        height === titleLayout.height &&
        width === titleLayout.width
      ) {
        return titleLayout;
      }

      return { height, width };
    });
  };

  const handleLeftLabelLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (
      leftLabelLayout &&
      height === leftLabelLayout.height &&
      width === leftLabelLayout.width
    ) {
      return;
    }

    setLeftLabelLayout({ height, width });
  };

  const {
    progress,
    layout,
    modal,
    onGoBack,
    backHref,
    headerTitle: title,
    headerLeft: left = onGoBack
      ? (props: HeaderBackButtonProps) => <HeaderBackButton {...props} />
      : undefined,
    headerRight: right,
    headerBackImage,
    headerBackTitle,
    headerBackButtonDisplayMode = Platform.OS === 'ios' ? 'default' : 'minimal',
    headerBackTruncatedTitle,
    headerBackAccessibilityLabel,
    headerBackTestID,
    headerBackAllowFontScaling,
    headerBackTitleStyle,
    headerTitleContainerStyle,
    headerLeftContainerStyle,
    headerRightContainerStyle,
    headerBackgroundContainerStyle,
    headerStyle: customHeaderStyle,
    headerStatusBarHeight,
    styleInterpolator,
    ...rest
  } = props;

  const defaultHeight = getDefaultHeaderHeight(
    layout,
    modal,
    headerStatusBarHeight
  );

  const { height = defaultHeight } = StyleSheet.flatten(
    customHeaderStyle || {}
  ) as ViewStyle;

  const headerHeight = typeof height === 'number' ? height : defaultHeight;

  const {
    titleStyle,
    leftButtonStyle,
    leftLabelStyle,
    rightButtonStyle,
    backgroundStyle,
  } = React.useMemo(
    () =>
      styleInterpolator({
        current: { progress: progress.current },
        next: progress.next && { progress: progress.next },
        direction,
        layouts: {
          header: {
            height: headerHeight,
            width: layout.width,
          },
          screen: layout,
          title: titleLayout,
          leftLabel: leftLabelLayout,
        },
      }),
    [
      styleInterpolator,
      progress,
      direction,
      headerHeight,
      layout,
      titleLayout,
      leftLabelLayout,
    ]
  );

  const headerLeft: StackHeaderOptions['headerLeft'] = left
    ? (props) =>
        left({
          ...props,
          href: backHref,
          backImage: headerBackImage,
          accessibilityLabel: headerBackAccessibilityLabel,
          testID: headerBackTestID,
          allowFontScaling: headerBackAllowFontScaling,
          onPress: onGoBack,
          label: headerBackTitle,
          truncatedLabel: headerBackTruncatedTitle,
          labelStyle: [leftLabelStyle, headerBackTitleStyle],
          onLabelLayout: handleLeftLabelLayout,
          screenLayout: layout,
          titleLayout,
          canGoBack: Boolean(onGoBack),
        })
    : undefined;

  const headerRight: StackHeaderOptions['headerRight'] = right
    ? (props) =>
        right({
          ...props,
          canGoBack: Boolean(onGoBack),
        })
    : undefined;

  const headerTitle: StackHeaderOptions['headerTitle'] =
    typeof title !== 'function'
      ? (props) => <HeaderTitle {...props} onLayout={handleTitleLayout} />
      : (props) => title({ ...props, onLayout: handleTitleLayout });

  return (
    <Header
      modal={modal}
      layout={layout}
      headerTitle={headerTitle}
      headerLeft={headerLeft}
      headerRight={headerRight}
      headerTitleContainerStyle={[titleStyle, headerTitleContainerStyle]}
      headerLeftContainerStyle={[leftButtonStyle, headerLeftContainerStyle]}
      headerRightContainerStyle={[rightButtonStyle, headerRightContainerStyle]}
      headerBackButtonDisplayMode={headerBackButtonDisplayMode}
      headerBackgroundContainerStyle={[
        backgroundStyle,
        headerBackgroundContainerStyle,
      ]}
      headerStyle={customHeaderStyle}
      headerStatusBarHeight={headerStatusBarHeight}
      {...rest}
    />
  );
}
