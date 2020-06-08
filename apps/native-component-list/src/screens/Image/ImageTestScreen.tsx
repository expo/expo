import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { NavigationScreenProps, NavigationScreenConfig } from 'react-navigation';
import HeaderButtons from 'react-navigation-header-buttons';

import AnimationBar from './AnimationBar';
import CompareBar from './CompareBar';
import {
  getImageComponent,
  getSelectedCompareComponent,
  getCompareComponents,
  setSelectedCompareComponent,
} from './ImageComponents';
import ImageEventsView from './ImageEventsView';
import ImageStylesView from './ImageStylesView';
import ImageTestView from './ImageTestView';
import { resolveProps } from './resolveProps';
import { ImageTest } from './types';

const AnimatedImage = Animated.Image;
AnimatedImage.displayName = 'Image';

type StateType = {
  animValue?: Animated.Value;
  viewKey: string;
  events: string[];
};

let compareEnabled: boolean = false;

export default class ImageTestScreen extends React.Component<NavigationScreenProps, StateType> {
  static navigationOptions: NavigationScreenConfig<object> = ({ navigation }) => {
    const test: ImageTest = navigation.getParam('test');
    const sepIdx = test.name.indexOf(':');
    const title =
      sepIdx >= 0 && test.name.length > 12 ? test.name.substring(sepIdx + 1) : test.name;
    return {
      title,
      headerRight: (
        <HeaderButtons IconComponent={MaterialIcons} iconSize={25}>
          <HeaderButtons.Item
            title="refresh"
            iconName="refresh"
            onPress={navigation.getParam('onRefresh')}
          />
          <HeaderButtons.Item
            title="previous"
            iconName="arrow-back"
            onPress={navigation.getParam('onPrevious')}
          />
          <HeaderButtons.Item
            title="next"
            iconName="arrow-forward"
            onPress={navigation.getParam('onNext')}
          />
        </HeaderButtons>
      ),
    };
  };

  state = {
    animValue: undefined,
    viewKey: 'initial',
    events: [],
  };

  componentDidMount() {
    const { navigation } = this.props;
    navigation.setParams({
      onRefresh: this.onRefresh,
      onPrevious: this.onPrevious,
      onNext: this.onNext,
    });
  }

  onRefresh = () => {
    this.setState({
      viewKey: '' + Date.now(),
    });
  };

  onPrevious = () => {
    const { navigation } = this.props;
    const test: ImageTest = navigation.getParam('test');
    const tests: ImageTest[] = navigation.getParam('tests');
    const idx = tests ? tests.indexOf(test) : -1;
    const newIdx = idx <= 0 ? tests.length - 1 : idx - 1;
    navigation.setParams({
      test: tests[newIdx],
    });
  };

  onNext = () => {
    const { navigation } = this.props;
    const test: ImageTest = navigation.getParam('test');
    const tests: ImageTest[] = navigation.getParam('tests');
    const idx = tests ? tests.indexOf(test) : -1;
    const newIdx = idx >= tests.length - 1 ? 0 : idx + 1;
    navigation.setParams({
      test: tests[newIdx],
    });
  };

  onEventMessage = (message: string) => {
    const { events } = this.state;
    this.setState({
      events: [...events, message],
    });
  };

  render() {
    const { navigation } = this.props;
    const { animValue, viewKey, events } = this.state;
    const test: ImageTest = navigation.getParam('test');
    const isAnimatable = typeof test.props === 'function';
    const hasEvents = isAnimatable && test.name.startsWith('on');

    const imageProps = resolveProps(test.props, animValue, false, this.onEventMessage);

    return (
      <View style={styles.container} key={viewKey}>
        {isAnimatable ? <AnimationBar onAnimationValue={this.onAnimationValue} /> : undefined}
        <View style={styles.content}>
          <ImageTestView imageProps={imageProps} ImageComponent={getImageComponent()} />
          {!compareEnabled ? (
            <View style={styles.stylesContainer}>
              <ImageStylesView test={test} animValue={animValue} />
            </View>
          ) : (
            undefined
          )}
        </View>
        <CompareBar
          collapsed={!compareEnabled}
          ImageComponent={getSelectedCompareComponent()}
          onPress={this.onPressCompare}
          onPressComponent={this.onPressCompareComponent}
        />
        {compareEnabled ? (
          <View style={styles.content}>
            <ImageTestView imageProps={imageProps} ImageComponent={getSelectedCompareComponent()} />
          </View>
        ) : (
          undefined
        )}
        {hasEvents ? <ImageEventsView onClear={this.onClearEvents} events={events} /> : undefined}
      </View>
    );
  }

  onAnimationValue = (animValue?: Animated.Value) => {
    this.setState({
      animValue,
    });
  };

  onPressCompare = (collapsed: boolean) => {
    compareEnabled = !collapsed;
    //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.forceUpdate();
  };

  onPressCompareComponent = (Component: React.ComponentType<any>) => {
    const compareComponents = getCompareComponents();
    let idx = compareComponents.indexOf(Component) + 1;
    idx = idx >= compareComponents.length ? 0 : idx;
    setSelectedCompareComponent(compareComponents[idx]);
    this.forceUpdate();
  };

  onClearEvents = () => {
    this.setState({
      events: [],
    });
  };
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
