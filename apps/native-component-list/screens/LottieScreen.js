import React from 'react';
import {
  Animated,
  Button,
  Picker,
  Platform,
  ScrollView,
  Slider,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { DangerZone } from 'expo';
const { Lottie: Animation } = DangerZone;

class ExamplePicker extends React.Component {
  render() {
    return (
      <Picker
        selectedValue={this.props.example}
        onValueChange={this.props.onChange}
        style={{
          marginBottom: Platform.select({
            ios: -30,
            android: 0,
          }),
        }}>
        {Object.keys(this.props.examples)
          .map(name => this.props.examples[name])
          .map(ex => <Picker.Item key={ex.name} label={ex.name} value={ex.name} />)}
      </Picker>
    );
  }
}

class PlayerControls extends React.Component {
  onConfigChange(merge) {
    const newConfig = {
      ...this.props.config,
      ...merge,
    };
    this.props.onConfigChange(newConfig);
  }

  render() {
    const { config } = this.props;
    return (
      <View style={{ paddingBottom: 20, paddingHorizontal: 10 }}>
        <View style={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Button title="Play" onPress={this.props.onPlayPress} />
            <Button title="Reset" onPress={this.props.onResetPress} />
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
            onValueChange={imperative => this.onConfigChange({ imperative })}
            value={config.imperative}
          />
        </View>
        <View style={{ paddingBottom: 10 }}>
          <View>
            <Text>Progress:</Text>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={1}
            // eslint-disable-next-line no-underscore-dangle
            value={this.props.progress.__getValue()}
            onValueChange={this.props.onProgressChange}
          />
        </View>
        <View>
          <View>
            <Text>Duration: ({Math.round(config.duration)}ms)</Text>
          </View>
          <Slider
            minimumValue={50}
            maximumValue={4000}
            value={config.duration}
            onValueChange={duration => this.onConfigChange({ duration })}
          />
        </View>
      </View>
    );
  }
}

const makeExample = (name, getJson) => ({ name, getJson });
const EXAMPLES = [
  makeExample('Hamburger Arrow', () => require('../assets/animations/HamburgerArrow.json')),
  makeExample('Line Animation', () => require('../assets/animations/LineAnimation.json')),
  makeExample('Lottie Logo 1', () => require('../assets/animations/LottieLogo1.json')),
  makeExample('Lottie Logo 2', () => require('../assets/animations/LottieLogo2.json')),
  makeExample('Lottie Walkthrough', () => require('../assets/animations/LottieWalkthrough.json')),
  makeExample('Pin Jump', () => require('../assets/animations/PinJump.json')),
  makeExample('Twitter Heart', () => require('../assets/animations/TwitterHeart.json')),
  makeExample('Watermelon', () => require('../assets/animations/Watermelon.json')),
  makeExample('Motion Corpse', () => require('../assets/animations/MotionCorpse-Jrcanest.json')),
].reduce((acc, e) => {
  // eslint-disable-next-line no-param-reassign
  acc[e.name] = e;
  return acc;
}, {});

export default class LottieScreen extends React.Component {
  static navigationOptions = {
    title: '<Lottie />',
  };

  constructor(props) {
    super(props);
    this.state = {
      example: Object.keys(EXAMPLES)[0],
      progress: new Animated.Value(0),
      config: {
        duration: 3000,
        imperative: false,
      },
    };
    this.onValueChange = this.onValueChange.bind(this);
    this.onPlayPress = this.onPlayPress.bind(this);
    this.onResetPress = this.onResetPress.bind(this);
    this.setAnim = this.setAnim.bind(this);
  }

  onValueChange(value) {
    this.state.progress.setValue(value);
  }

  onPlayPress() {
    if (this.state.config.imperative) {
      this.anim.play();
    } else {
      this.state.progress.setValue(0);
      Animated.timing(this.state.progress, {
        toValue: 1,
        duration: this.state.config.duration,
      }).start(({ finished }) => {
        if (finished) this.forceUpdate();
      });
    }
  }

  onResetPress() {
    if (this.state.config.imperative) {
      this.anim.reset();
    } else {
      this.state.progress.setValue(1);
      Animated.timing(this.state.progress, {
        toValue: 0,
        duration: this.state.config.duration,
      }).start(({ finished }) => {
        if (finished) this.forceUpdate();
      });
    }
  }

  setAnim(anim) {
    this.anim = anim;
  }

  render() {
    const playerWindow = (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          borderColor: '#000',
          borderWidth: 1,
          backgroundColor: '#dedede',
          marginVertical: 10,
        }}>
        <View key={this.state.example.name}>
          <Animation
            ref={this.setAnim}
            style={{
              width: 200,
              height: 200,
            }}
            source={EXAMPLES[this.state.example].getJson()}
            progress={this.state.config.imperative ? undefined : this.state.progress}
          />
        </View>
      </View>
    );

    return (
      <ScrollView style={StyleSheet.absoluteFill}>
        <ExamplePicker
          example={this.state.example}
          examples={EXAMPLES}
          onChange={example => this.setState({ example })}
        />
        {playerWindow}
        <PlayerControls
          progress={this.state.progress}
          config={this.state.config}
          onProgressChange={this.onValueChange}
          onConfigChange={config => this.setState({ config })}
          onPlayPress={this.onPlayPress}
          onResetPress={this.onResetPress}
        />
      </ScrollView>
    );
  }
}
