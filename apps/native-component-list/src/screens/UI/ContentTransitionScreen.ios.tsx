import { Button, Host, List, Section, Text } from '@expo/ui/swift-ui';
import { contentTransition, animation, Animation, font } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';

export default function ContentTransitionScreen() {
  const [count, setCount] = useState(1);
  const [countdown, setCountdown] = useState(99);
  const [opacityText, setOpacityText] = useState('Hello');
  const [triggerOpacityTransition, setTriggerOpacityTransition] = useState(false);
  const [interpolateValue, setInterpolateValue] = useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <List>

        <Section title="Numeric Text (default)">
          <Text
            modifiers={[
              contentTransition('numericText'),
              animation(Animation.default, count),
              font({ size: 48, weight: 'bold', design: 'rounded' }),
            ]}>
            {`${count}`}
          </Text>
          <Button label="Increment" onPress={() => setCount((c) => c + 1)} />
          <Button label="Decrement" onPress={() => setCount((c) => c - 1)} />
        </Section>

        <Section title="Identity (no transition)">
          <Text
            modifiers={[
              contentTransition('identity'),
              animation(Animation.default, count),
              font({ size: 48, weight: 'bold', design: 'rounded' }),
            ]}>
            {`${count}`}
          </Text>
          <Text>Uses the same count as first section — no animation on change.</Text>
        </Section>

        <Section title="Numeric Text (countsDown)">
          <Text
            modifiers={[
              contentTransition({ type: 'numericText', countsDown: true }),
              animation(Animation.easeInOut({ duration: 0.3 }), countdown),
              font({ size: 48, weight: 'bold', design: 'monospaced' }),
            ]}>
            {`${countdown}`}
          </Text>
          <Button label="Decrease" onPress={() => setCountdown((c) => c - 1)} />
          <Button label="Reset to 99" onPress={() => setCountdown(99)} />
        </Section>

        <Section title="Opacity">
          <Text
            modifiers={[
              contentTransition('opacity'),
              animation(Animation.easeInOut({ duration: 1 }), triggerOpacityTransition),
              font({ size: 48, weight: 'bold', design: 'rounded' })
            ]}>
            {`${opacityText}`}
          </Text>
          <Button
            label="Toggle Text"
            onPress={() => {
              setOpacityText((prev) => prev === 'Hello' ? 'World' : 'Hello')
              setTriggerOpacityTransition((prev) => !prev)
            }}
          />
        </Section>

        <Section title="Interpolate">
          <Text
            modifiers={[
              contentTransition('interpolate'),
              animation(Animation.spring(), interpolateValue),
              font({ size: 48, weight: 'bold', design: 'rounded' }),
            ]}>
            {`${interpolateValue}`}
          </Text>
          <Button
            label="Randomize"
            onPress={() => setInterpolateValue(Math.floor(Math.random() * 1000))}
          />
        </Section>


      </List>
    </Host>
  );
}

ContentTransitionScreen.navigationOptions = {
  title: 'Content Transition',
};
