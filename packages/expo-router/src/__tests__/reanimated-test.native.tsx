import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { renderRouter, screen } from '../testing-library';

const { getAnimatedStyle, setUpTests } = require('react-native-reanimated');

setUpTests();

it('supports Reanimated animated style assertions in routes', async () => {
  await renderRouter({
    index: function AnimatedRoute() {
      const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.5 }));
      return <Animated.View testID="animated-view" style={animatedStyle} />;
    },
  });

  const view = screen.getByTestId('animated-view');
  expect(getAnimatedStyle(view)).toEqual({ opacity: 0.5 });
});
