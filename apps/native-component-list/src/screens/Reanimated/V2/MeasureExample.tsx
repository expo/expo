import React, { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  // @ts-ignore
  measure,
  withTiming,
  // @ts-ignore
  Easing,
  useDerivedValue,
  // @ts-ignore
  useAnimatedRef,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const labels = ['apple', 'banana', 'kiwi', 'milk', 'water'];
const sectionHeaderHeight = 40;

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', ''];
const indices = [0, 1, 2, 3, 4, 5];

function createSharedVariables() {
  const contentHeights = indices.map(i => useSharedValue(0));

  const contentHeightsCopy = contentHeights;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = [useSharedValue(0)];
  for (let i = 1; i < indices.length; i++) {
    const previousHeight = result[i - 1];
    const previousContentHeight = contentHeightsCopy[i - 1];
    result.push(
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useDerivedValue(() => {
        return previousHeight.value + previousContentHeight.value + sectionHeaderHeight + 1;
      })
    );
  }
  const heights = result;

  return {
    contentHeights,
    heights,
  };
}

export default function MeasureExample() {
  const { heights, contentHeights } = createSharedVariables();

  return (
    <View>
      <SafeAreaView>
        <View>
          {indices.map(i => {
            return (
              <Section
                title={days[i]}
                key={i}
                height={heights[i]}
                contentHeight={contentHeights[i]}
                z={i}
                show>
                <View collapsable={false}>
                  <RandomContent />
                </View>
              </Section>
            );
          })}
          <Section
            title=""
            key={5}
            height={heights[5]}
            contentHeight={contentHeights[5]}
            z={5}
            show={false}>
            <View collapsable={false} style={{ height: 500, backgroundColor: 'white' }} />
          </Section>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Section({
  title,
  children,
  height,
  contentHeight,
  z,
  show,
}: {
  title: string;
  children: React.ReactElement;
  height: Animated.SharedValue<number>;
  contentHeight: Animated.SharedValue<number>;
  z: number;
  show: boolean;
}) {
  const aref = useAnimatedRef();

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: height.value }],
    };
  });

  return (
    <Animated.View style={[styles.section, stylez, { zIndex: z }]}>
      <SectionHeader title={title} animatedRef={aref} contentHeight={contentHeight} show={show} />
      <View>
        {React.Children.map(children, (element, idx) => {
          return React.cloneElement(element, { ref: aref });
        })}
      </View>
    </Animated.View>
  );
}

function SectionHeader({
  title,
  animatedRef,
  contentHeight,
  show,
}: {
  title: string;
  animatedRef: any;
  contentHeight: Animated.SharedValue<number>;
  show: boolean;
}) {
  const handler = useAnimatedGestureHandler({
    onActive: (_, ctx) => {
      const height = measure(animatedRef).height;
      if (contentHeight.value === 0) {
        contentHeight.value = withTiming(height, {
          duration: 500,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      } else {
        contentHeight.value = withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    },
  });

  return (
    <View style={styles.sectionHeader}>
      <View
        style={{
          height: sectionHeaderHeight,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text>{title}</Text>
        {show && (
          // @ts-ignore
          <TapGestureHandler onHandlerStateChange={handler}>
            <Animated.View style={{ backgroundColor: 'gray', borderRadius: 10, padding: 5 }}>
              <Text style={{ color: 'white' }}>trigger</Text>
            </Animated.View>
          </TapGestureHandler>
        )}
      </View>
    </View>
  );
}

function RandomContent() {
  const randomElements = useRef<null | React.ReactNode[]>(null);
  if (randomElements.current == null) {
    randomElements.current = [];
    const numberOfRandomElements = Math.round(Math.random() * 9 + 1);
    for (let i = 0; i < numberOfRandomElements; i++) {
      randomElements.current.push(<RandomElement key={i} />);
    }
  }

  return <View style={styles.randomContent}>{randomElements.current}</View>;
}

function RandomElement() {
  const randomHeight = useRef(Math.round(Math.random() * 40 + 30));
  const label = useRef(labels[Math.round(Math.random() * 4)]);

  return (
    <View style={[styles.randomElement, { height: randomHeight.current }]}>
      <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row' }}>
        <Text>{label.current}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  randomElement: {
    backgroundColor: '#EFEFF4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'green',
  },
  randomContent: {
    borderColor: 'red',
    borderWidth: 1,
  },
  section: {
    position: 'absolute',
    width: '100%',
  },
  sectionHeader: {
    backgroundColor: 'azure',
    paddingLeft: 20,
    paddingRight: 20,
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
});
