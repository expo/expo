import { MaterialIcons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, View, Animated, Image as ExpoImage } from 'react-native';
import { NavigationScreenProps, NavigationScreenConfig } from 'react-navigation';
import HeaderButtons from 'react-navigation-header-buttons';
//import ExpoImage from 'expo-image';

import AnimationBar from './AnimationBar';
import CompareBar from './CompareBar';
import ImageEventsView from './ImageEventsView';
import ImageStylesView from './ImageStylesView';
import ImageTestView from './ImageTestView';
import { resolveProps } from './resolveProps';
import { ImageTest } from './types';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

type StateType = {
  animValue?: Animated.Value;
  viewKey: string;
  events: string[];
};

let compareEnabled: boolean = false;

export default class ImageTestScreen extends React.Component<NavigationScreenProps, StateType> {
  static navigationOptions: NavigationScreenConfig<object> = ({ navigation }) => {
    const test: ImageTest = navigation.getParam('test');
    const onRefresh = navigation.getParam('onRefresh');
    return {
      title: test.name,
      headerRight: (
        <HeaderButtons IconComponent={MaterialIcons} iconSize={25} color="blue">
          <HeaderButtons.Item title="refresh" iconName="refresh" onPress={onRefresh} />
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
    });
  }

  onRefresh = () => {
    this.setState({
      viewKey: '' + Date.now(),
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
          <ImageTestView imageProps={imageProps} ImageComponent={AnimatedExpoImage} />
          {!compareEnabled ? (
            <View style={styles.stylesContainer}>
              <ImageStylesView test={test} animValue={animValue} />
            </View>
          ) : (
            undefined
          )}
        </View>
        <CompareBar collapsed={!compareEnabled} onPress={this.onPressCompare} />
        {compareEnabled ? (
          <View style={styles.content}>
            <ImageTestView imageProps={imageProps} ImageComponent={Animated.Image} />
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
  headerButton: {
    marginRight: 16,
  },
});
