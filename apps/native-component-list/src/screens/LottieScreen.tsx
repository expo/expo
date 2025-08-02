import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import LottieView from 'lottie-react-native';
import React from 'react';
import {
  Animated,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const makeExample = (name: string, getJson: () => any) => ({ name, getJson });
const EXAMPLES = [
  makeExample('Science', () => require('../../assets/animations/Science.json')),
  makeExample('Hamburger Arrow', () => require('../../assets/animations/HamburgerArrow.json')),
  makeExample('Line Animation', () => require('../../assets/animations/LineAnimation.json')),
  makeExample('Lottie Logo 1', () => require('../../assets/animations/LottieLogo1.json')),
  makeExample('Lottie Logo 2', () => require('../../assets/animations/LottieLogo2.json')),
  makeExample('Lottie Walkthrough', () =>
    require('../../assets/animations/LottieWalkthrough.json')
  ),
  makeExample('Pin Jump', () => require('../../assets/animations/PinJump.json')),
  makeExample('Twitter Heart', () => require('../../assets/animations/TwitterHeart.json')),
  makeExample('Watermelon', () => require('../../assets/animations/Watermelon.json')),
  makeExample('Motion Corpse', () => require('../../assets/animations/MotionCorpse-Jrcanest.json')),
].reduce<{ [key: string]: { name: string; getJson: () => any } }>(
  (acc, e) => ({
    ...acc,
    [e.name]: e,
  }),
  {}
);

const ExamplePicker: React.FunctionComponent<{
  value: string;
  onChange: (value: any, index?: number) => void;
}> = ({ value, onChange }) => (
  <Picker selectedValue={value} onValueChange={onChange} style={styles.examplePicker}>
    {Object.values(EXAMPLES).map(({ name }) => (
      <Picker.Item key={name} label={name} value={name} color="black" />
    ))}
  </Picker>
);

const PlayerControls: React.FunctionComponent<{
  onPlayPress: () => void;
  onResetPress: () => void;
  onProgressChange: (value: number) => void;
  onConfigChange: (config: Config) => void;
  config: Config;
  progress: Animated.Value;
}> = ({ onPlayPress, onResetPress, onProgressChange, onConfigChange, config, progress }) => (
  <View style={{ paddingBottom: 20, paddingHorizontal: 10 }}>
    <View style={{ paddingBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button title="Play" onPress={onPlayPress} />
        <Button title="Reset" onPress={onResetPress} />
      </View>
    </View>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 10,
      }}>
      <Text>Use Imperative API:</Text>
      <View />
      <Switch
        onValueChange={(imperative) => onConfigChange({ ...config, imperative })}
        value={config.imperative}
      />
    </View>
    {!config.imperative && (
      <View style={{ paddingBottom: 10 }}>
        <View>
          <Text>Progress:</Text>
        </View>
        <Slider
          minimumValue={0}
          maximumValue={1}
          // @ts-ignore
          value={progress.__getValue()}
          onValueChange={onProgressChange}
        />
      </View>
    )}
    <View>
      <View>
        <Text>Duration: ({Math.round(config.duration)}ms)</Text>
      </View>
      <Slider
        minimumValue={50}
        maximumValue={4000}
        value={config.duration}
        onValueChange={(duration) => onConfigChange({ ...config, duration })}
      />
    </View>
  </View>
);

interface Config {
  duration: number;
  imperative: boolean;
}

interface State {
  exampleName: string;
  progress: Animated.Value;
  config: Config;
}

export default class LottieScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: '<Lottie />',
  };

  readonly state: State = {
    exampleName: Object.keys(EXAMPLES)[0],
    progress: new Animated.Value(0),
    config: {
      duration: 3000,
      imperative: false,
    },
  };

  anim?: any;

  onPlayPress = () => {
    if (this.state.config.imperative && this.anim) {
      this.anim.play();
    } else {
      this.state.progress.setValue(0);
      Animated.timing(this.state.progress, {
        toValue: 1,
        useNativeDriver: false,
        duration: this.state.config.duration,
      }).start(({ finished }) => {
        if (finished) this.forceUpdate();
      });
    }
  };

  onResetPress = () => {
    if (this.state.config.imperative && this.anim) {
      this.anim.reset();
    } else {
      this.state.progress.setValue(1);
      Animated.timing(this.state.progress, {
        toValue: 0,
        useNativeDriver: false,
        duration: this.state.config.duration,
      }).start(({ finished }) => {
        if (finished) {
          this.forceUpdate();
        }
      });
    }
  };

  setAnim = (anim: any) => {
    this.anim = anim;
  };

  render() {
    return (
      <ScrollView style={StyleSheet.absoluteFill}>
        <ExamplePicker
          value={this.state.exampleName}
          onChange={(exampleName) => this.setState({ exampleName })}
        />
        <View style={styles.animationContainer}>
          <View key={this.state.exampleName}>
            <AnimatedLottieView
              ref={this.setAnim}
              style={styles.animation}
              source={EXAMPLES[this.state.exampleName].getJson()}
              progress={this.state.config.imperative ? undefined : this.state.progress}
            />
          </View>
        </View>
        <PlayerControls
          progress={this.state.progress}
          config={this.state.config}
          onProgressChange={(value) => this.state.progress.setValue(value)}
          onConfigChange={(config) => this.setState({ config })}
          onPlayPress={this.onPlayPress}
          onResetPress={this.onResetPress}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#dedede',
    marginVertical: 10,
  },
  animation: {
    width: 200,
    height: 200,
  },
  examplePicker: {
    marginBottom: Platform.select({
      ios: -30,
      android: 0,
    }),
  },
});
