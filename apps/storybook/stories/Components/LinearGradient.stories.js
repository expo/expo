import { color, number } from '@storybook/addon-knobs/react';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DocItem, Section } from '../ui-explorer';

export const label = 'LinearGradient';

export const title = 'Linear Gradient';
export const packageJson = require('expo-linear-gradient/package.json');
export const component = () => {
  const options = {
    range: true,
    min: 0.0,
    max: 1.0,
    step: 0.05,
  };

  const colors = [color('colors 0', 'red'), color('colors 1', 'blue')];

  const props = {
    colors,
    start: {
      x: number('start x', 0.5, options),
      y: number('start y', 0.0, options),
    },
    end: {
      x: number('end x', 0.5, options),
      y: number('end y', 1.0, options),
    },
    locations: [number('locations 0', 0, options), number('locations 1', 1, options)],
  };
  return (
    <>
      <DocItem
        name="Playground"
        example={{
          render: () => (
            <LinearGradient style={{ flex: 1, minHeight: 200, maxHeight: 200 }} {...props} />
          ),
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
              <LinearGradient style={styles.gradient} colors={['red', 'purple', 'blue']} />
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
                style={styles.gradient}
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
                style={styles.gradient}
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
                style={styles.gradient}
                colors={['red', 'blue']}
                locations={[0.5, 0.6]}
              />
            ),
          }}
        />
      </Section>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    minHeight: 200,
    maxHeight: 200,
  },
});
