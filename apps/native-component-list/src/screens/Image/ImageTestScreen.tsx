import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Animated, StyleSheet, View, Button, Text } from 'react-native';

import HeaderContainerRight from '../../components/HeaderContainerRight';
import HeaderIconButton from '../../components/HeaderIconButton';
import AnimationBar from './AnimationBar';
import CompareBar from './CompareBar';
import {
  getCompareComponents,
  getImageComponent,
  getSelectedCompareComponent,
  setSelectedCompareComponent,
} from './ImageComponents';
import ImageEventsView from './ImageEventsView';
import ImageStylesView from './ImageStylesView';
import ImageTestView from './ImageTestView';
import { resolveProps } from './resolveProps';
import { ImageTest, Links } from './types';

const AnimatedImage = Animated.Image;
AnimatedImage.displayName = 'Image';

let compareEnabled: boolean = false;

type Props = StackScreenProps<Links, 'ImageTest'>;

function useForceUpdate() {
  const [, updateState] = React.useState<any>();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  return forceUpdate;
}

export default function ImageTestScreen({ navigation, route }: Props) {
  const forceUpdate = useForceUpdate();
  const [animValue, setAnimValue] = React.useState<Animated.Value | undefined>();
  const [viewKey, setViewKey] = React.useState<string>('initial');
  const [events, setEvents] = React.useState<string[]>([]);
  const [loadDemanded, setLoadDemanded] = React.useState<boolean>(false);

  React.useLayoutEffect(() => {
    const { test } = route.params;
    const sepIdx = test.name.indexOf(':');
    const title =
      sepIdx >= 0 && test.name.length > 12 ? test.name.substring(sepIdx + 1) : test.name;

    navigation.setOptions({
      title,
      headerRight: () => (
        <HeaderContainerRight>
          <HeaderIconButton name="md-refresh" onPress={() => setViewKey('' + Date.now())} />
          <HeaderIconButton
            name="md-arrow-back"
            onPress={() => {
              const {
                params: { test, tests },
              } = route;

              const idx = tests ? tests.indexOf(test) : -1;
              const newIdx = idx <= 0 ? tests.length - 1 : idx - 1;
              navigation.setParams({
                test: tests[newIdx],
              });
            }}
          />
          <HeaderIconButton
            name="md-arrow-forward"
            onPress={() => {
              const {
                params: { test, tests },
              } = route;
              const idx = tests ? tests.indexOf(test) : -1;
              const newIdx = idx >= tests.length - 1 ? 0 : idx + 1;
              navigation.setParams({
                test: tests[newIdx],
              });
            }}
          />
        </HeaderContainerRight>
      ),
    });
  }, [navigation, route, setViewKey]);

  const onEventMessage = (message: string) => {
    setEvents([...events, message]);
  };

  const onAnimationValue = (animValue?: Animated.Value) => {
    setAnimValue(animValue);
  };

  const onPressCompare = (collapsed: boolean) => {
    compareEnabled = !collapsed;
    //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    forceUpdate();
  };

  const onPressCompareComponent = (Component: React.ComponentType<any>) => {
    const compareComponents = getCompareComponents();
    let idx = compareComponents.indexOf(Component) + 1;
    idx = idx >= compareComponents.length ? 0 : idx;
    setSelectedCompareComponent(compareComponents[idx]);
    forceUpdate();
  };

  const onPressLoad = () => {
    setLoadDemanded(true);
  };

  const onClearEvents = () => setEvents([]);

  const isComponentLoaded = () => !loadOnDemand || loadDemanded;

  const test = route.params.test as ImageTest;
  const isAnimatable = typeof test.props === 'function';
  const hasEvents = isAnimatable && test.name.startsWith('on');
  const loadOnDemand = test.loadOnDemand;

  const imageProps = resolveProps(test.props, animValue, false, onEventMessage);

  return (
    <View style={styles.container} key={viewKey}>
      {isAnimatable && <AnimationBar onAnimationValue={onAnimationValue} />}
      {test.testInformation && <Text>{test.testInformation}</Text>}
      {isComponentLoaded() && (
        <View style={styles.content}>
          <ImageTestView
            imageProps={imageProps}
            ImageComponent={getImageComponent()}
            loadOnDemand={false}
          />
          {!compareEnabled && (
            <View style={styles.stylesContainer}>
              <ImageStylesView test={test} animValue={animValue} />
            </View>
          )}
        </View>
      )}
      {!isComponentLoaded() && (
        <View>
          <Button title="Load" onPress={onPressLoad} />
        </View>
      )}
      <CompareBar
        collapsed={!compareEnabled}
        ImageComponent={getSelectedCompareComponent()}
        onPress={onPressCompare}
        onPressComponent={onPressCompareComponent}
      />
      {isComponentLoaded() && compareEnabled && (
        <View style={styles.content}>
          <ImageTestView
            imageProps={imageProps}
            ImageComponent={getSelectedCompareComponent()}
            loadOnDemand={false}
          />
        </View>
      )}
      {hasEvents && <ImageEventsView onClear={onClearEvents} events={events} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stylesContainer: {
    position: 'absolute',
    left: 0,
    bottom: 12,
  },
});
