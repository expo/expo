import { MaterialIcons } from '@expo/vector-icons';
//import Slider from '@react-native-community/slider';
import * as React from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text, Slider } from 'react-native';

import Colors from '../../constants/Colors';

const AnimatedSlider = Animated.createAnimatedComponent(Slider);

type PropsType = {
  onAnimationValue: (animValue?: Animated.Value) => void;
};

type StateType = {
  playing: boolean;
  useNativeDriver: boolean;
  animValue?: Animated.Value;
};

export default class AnimationBar extends React.Component<PropsType, StateType> {
  state: StateType = {
    playing: false,
    useNativeDriver: true,
    animValue: undefined,
  };

  render() {
    const { playing, useNativeDriver, animValue } = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Animate</Text>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.5}
          onPress={playing ? this.onPressStop : this.onPressStart}>
          <MaterialIcons
            style={styles.icon}
            name={playing ? 'pause' : 'play-arrow'}
            size={25}
            color={Colors.headerTitle}
          />
        </TouchableOpacity>
        <AnimatedSlider
          style={styles.slider}
          value={animValue || 0.5}
          minimumValue={0}
          maximumValue={1}
          onValueChange={this.onSliderChange}
        />
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.5}
          onPress={this.onChangeNativeDriver}>
          <Text style={styles.text}>{useNativeDriver ? 'ND' : 'JS'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  animate(animValue: Animated.Value, reverse: boolean) {
    const { useNativeDriver } = this.state;
    Animated.timing(animValue, {
      toValue: reverse ? 0 : 1,
      duration: 4000,
      useNativeDriver,
    }).start(({ finished }) => {
      if (!finished) return;
      this.animate(animValue, !reverse);
    });
  }

  onPressStart = () => {
    const { onAnimationValue } = this.props;
    const animValue = new Animated.Value(0);
    this.setState({
      playing: true,
      animValue,
    });
    this.animate(animValue, false);
    if (onAnimationValue) onAnimationValue(animValue);
  };

  onPressStop = () => {
    const { onAnimationValue } = this.props;
    let { animValue } = this.state;
    if (animValue) {
      animValue.stopAnimation();
      animValue = undefined;
    }
    this.setState({
      playing: false,
      animValue,
    });
    if (onAnimationValue) onAnimationValue(animValue);
  };

  onSliderChange = (value: number) => {
    //console.log("onSliderChange: ", value);
    const { onAnimationValue } = this.props;
    let { animValue, playing } = this.state;

    if (animValue && playing) {
      animValue.stopAnimation();
      this.setState({
        playing: false,
      });
    }

    if (!animValue) {
      animValue = new Animated.Value(value);
      this.setState({
        animValue,
      });
      if (onAnimationValue) onAnimationValue(animValue);
    } else {
      animValue.setValue(value);
      if (onAnimationValue) onAnimationValue(animValue);
    }
  };

  onChangeNativeDriver = () => {
    const { useNativeDriver, playing } = this.state;
    if (playing) {
      this.onPressStop();
      this.setState(
        {
          useNativeDriver: !useNativeDriver,
        },
        () => {
          this.onPressStart();
        }
      );
    } else {
      this.setState({
        useNativeDriver: !useNativeDriver,
      });
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 16,
  },
  slider: {
    flex: 1,
    marginRight: 16,
  },
  switch: {
    marginLeft: 16,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  text: {
    width: 30,
    textAlign: 'center',
    fontSize: 15,
  },
});
