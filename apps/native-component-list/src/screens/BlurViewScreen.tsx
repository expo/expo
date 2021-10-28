import Slider from '@react-native-community/slider';
import { BlurView, BlurTint } from 'expo-blur';
import React from 'react';
import { Animated, Image, StyleSheet, View, Text, ScrollView } from 'react-native';

export default function BlurViewScreen() {
  const intensity = React.useMemo(() => new Animated.Value(1), []);

  React.useEffect(() => {
    _animate();
  }, []);

  const _animate = React.useCallback(() => {
    const animateInConfig = {
      duration: 2500,
      toValue: 100,
      useNativeDriver: false,
      isInteraction: false,
    };
    const animateOutconfig = {
      duration: 2500,
      toValue: 1,
      isInteraction: false,
      useNativeDriver: false,
    };

    Animated.timing(intensity, animateInConfig).start(() => {
      Animated.timing(intensity, animateOutconfig).start(_animate);
    });
  }, [intensity]);

  return (
    <ScrollView style={styles.screenContainer}>
      {(['default', 'light', 'dark'] as const).map((tint) => (
        <BlurViewWithControls key={tint} tint={tint as BlurTint} intensity={intensity} />
      ))}
    </ScrollView>
  );
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const BlurViewWithControls = (props: { tint: BlurTint; intensity: Animated.Value }) => {
  let timeoutId: NodeJS.Timeout | undefined;
  const [animatedIntensity, setAnimatedIntensity] = React.useState(0);
  const [manualIntensityIsActive, setManualIntensityIsActive] = React.useState(false);
  const [manualIntensity, setManualIntensity] = React.useState(0);

  React.useEffect(() => {
    props.intensity.addListener(({ value }) => {
      setAnimatedIntensity(value);
    });
  }, [props.intensity]);

  React.useEffect(() => {
    if (manualIntensityIsActive) {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setManualIntensityIsActive(false);
      }, 3000);
    }

    return () => timeoutId && clearTimeout(timeoutId);
  }, [manualIntensityIsActive, manualIntensity]);

  const onSliderChange = React.useCallback((value: number) => {
    setManualIntensityIsActive(true);
    setManualIntensity(value);
    console.log(value);
  }, []);

  return (
    <View style={styles.itemContainer}>
      <View style={styles.innerItemContainer}>
        <Image
          style={styles.image}
          source={{ uri: 'https://source.unsplash.com/300x300' }}
          defaultSource={{
            uri: 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png',
          }}
        />
        <Text style={styles.blurredText}>This text is blurred</Text>
        <AnimatedBlurView
          style={styles.blurView}
          intensity={manualIntensityIsActive ? manualIntensity : animatedIntensity}
          tint={props.tint}>
          <View style={styles.nonBlurredContainer}>
            <Text style={styles.nonBlurredText}>{props.tint}</Text>
          </View>
          <View
            style={[
              styles.sliderContainer,
              manualIntensityIsActive && styles.sliderContainerActive,
            ]}>
            <Text style={(styles.sliderLabel, manualIntensityIsActive && styles.sliderLabelActive)}>
              Manual intensity:
            </Text>
            <View style={styles.sliderWrapper}>
              <Text style={styles.sliderBoundText}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={100}
                step={1}
                onValueChange={onSliderChange}
                value={manualIntensity}
                minimumTrackTintColor={manualIntensityIsActive ? 'rgb(20,120,20)' : undefined}
                maximumTrackTintColor={
                  manualIntensityIsActive ? 'rgba(140,180,140, 0.8)' : undefined
                }
              />
              <Text>100</Text>
            </View>
          </View>
        </AnimatedBlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
  blurredText: {
    position: 'absolute',
    padding: 10,
    backgroundColor: 'rgb(120,20,20)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    borderRadius: 5,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 20,
  },
  nonBlurredContainer: {
    backgroundColor: 'rgba(100, 20, 20, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  nonBlurredText: {
    backgroundColor: 'transparent',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },

  sliderContainer: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'rgb(100,20,20)',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sliderContainerActive: {
    borderColor: 'rgb(20,100,20)',
  },
  sliderLabel: {
    color: 'rgb(240,240,240)',
  },
  sliderLabelActive: {
    color: 'rgb(20,120,20)',
    fontWeight: 'bold',
  },
  sliderWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  slider: {
    width: 150,
    height: 20,
    flexGrow: 0,
  },
  sliderActive: {
    color: 'rgb(20,120,20)',
  },
  sliderBoundText: {
    paddingHorizontal: 5,
  },
});
