import { LinearGradient } from 'expo';
import React from 'react';
import { View } from 'react-native';

import UIExplorer, { AppText, Description, DocItem, Section, storiesOf } from '../ui-explorer';

const Screen = () => (
  <View>
    <UIExplorer title="Linear Gradient">
      <Description>
        <AppText>A React component that renders a gradient view.</AppText>
      </Description>
      <DocItem
        name="Importing the module"
        example={{
          code: `import { LinearGradient } from 'expo-linear-gradient';`,
        }}
      />
      <Section title="Props">
        <DocItem name="...View props" />

        <DocItem
          name="colors"
          typeInfo="string[]"
          description="An array of colors that represent stops in the gradient. At least two colors are required (otherwise it's not a gradient, it's just a fill!)."
          example={{
            render: () => (
              <LinearGradient style={{ flex: 1, height: 200 }} colors={['red', 'purple', 'blue']} />
            ),
          }}
        />
        <DocItem
          name="start"
          typeInfo="number[]"
          description="An array of [x, y] where x and y are floats. They represent the position that the gradient starts at, as a fraction of the overall size of the gradient. For example, [0.1, 0.2] means that the gradient will start 10% from the left and 20% from the top."
          example={{
            render: () => (
              <LinearGradient
                style={{ flex: 1, height: 200 }}
                start={[0.1, 0.2]}
                colors={['green', 'orange']}
              />
            ),
          }}
        />
        <DocItem
          name="end"
          typeInfo="number[]"
          description="Same as start but for the end of the gradient."
          example={{
            render: () => (
              <LinearGradient
                style={{ flex: 1, height: 200 }}
                end={[0.1, 0.2]}
                colors={['green', 'orange']}
              />
            ),
          }}
        />
        <DocItem
          name="locations"
          typeInfo="number[]"
          description="An array of the same length as colors, where each element is a float with the same meaning as the start and  end values, but instead they indicate where the color at that index should be."
          example={{
            render: () => (
              <LinearGradient
                style={{ flex: 1, height: 200 }}
                colors={['red', 'blue']}
                locations={[0.5, 0.6]}
              />
            ),
          }}
        />
      </Section>
    </UIExplorer>
  </View>
);

storiesOf('Components', module).add('Linear Gradient', Screen);
