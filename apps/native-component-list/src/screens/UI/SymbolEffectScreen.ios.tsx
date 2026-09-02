import {
  Host,
  Section,
  Text,
  Form,
  VStack,
  HStack,
  Image,
  Spacer,
  useNativeState,
  SyncToggle,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  onTapGesture,
  padding,
  symbolEffect,
} from '@expo/ui/swift-ui/modifiers';
import { scheduleOnUI } from 'react-native-worklets';

type SFSymbol = NonNullable<React.ComponentProps<typeof Image>['systemName']>;

const SYMBOL_SIZE = 44;

type CounterState = ReturnType<typeof useNativeState<number>>;
type BoolState = ReturnType<typeof useNativeState<boolean>>;
type EffectArg = Parameters<typeof symbolEffect>[0];
type OptionsArg = NonNullable<Parameters<typeof symbolEffect>[1]>['options'];

function incrementOnUI(state: CounterState) {
  scheduleOnUI(() => {
    'worklet';
    state.value = state.value + 1;
  });
}

function toggleOnUI(state: BoolState) {
  scheduleOnUI(() => {
    'worklet';
    state.value = !state.value;
  });
}

export default function SymbolEffectScreen() {
  // Discrete — fires once per change.
  const bounceTrigger = useNativeState(0);
  const pulseTrigger = useNativeState(0);
  const wiggleTrigger = useNativeState(0);

  // Indefinite — animates while true.
  const breatheActive = useNativeState(true);
  const variableColorActive = useNativeState(true);
  const rotateActive = useNativeState(true);

  // Transitions — toggle to fire the transition.
  // Start `false` so the symbol is in its natural drawn state. Flipping `true`
  // applies the effect (e.g. drawOn animates the symbol drawing out), flipping
  // back to `false` reverses it.
  const scaleActive = useNativeState(false);
  const drawOnActive = useNativeState(false);

  return (
    <Host style={{ flex: 1 }}>
      <Form>
        <Section title="Discrete">
          <Caption text="Tap a row to play the effect once." />
          <DiscreteRow
            systemName="bell.fill"
            color="#FF9F0A"
            title="Bounce"
            subtitle="direction: up"
            effect={{ effect: 'bounce', direction: 'up' }}
            trigger={bounceTrigger}
          />
          <DiscreteRow
            systemName="heart.fill"
            color="#FF375F"
            title="Pulse"
            subtitle="speed: 1.2×"
            effect={{ effect: 'pulse' }}
            trigger={pulseTrigger}
            options={{ speed: 1.2 }}
          />
          <DiscreteRow
            systemName="star.fill"
            color="#FFD60A"
            title="Wiggle"
            subtitle="direction: clockwise"
            effect={{ effect: 'wiggle', direction: 'clockwise' }}
            trigger={wiggleTrigger}
          />
        </Section>

        <Section title="Indefinite — looping">
          <Caption text="Toggle to start and stop a continuous animation." />
          <IndefiniteRow
            systemName="cloud.fill"
            color="#64D2FF"
            title="Breathe"
            subtitle="style: pulse"
            effect={{ effect: 'breathe', style: 'pulse' }}
            isActive={breatheActive}
          />
          <IndefiniteRow
            systemName="dot.radiowaves.left.and.right"
            color="#0A84FF"
            title="Variable color"
            subtitle="iterative, reversing"
            effect={{
              effect: 'variableColor',
              fillStyle: 'iterative',
              playbackStyle: 'reversing',
            }}
            isActive={variableColorActive}
            options={{ repeat: 'continuous' }}
          />
          <IndefiniteRow
            systemName="gearshape.fill"
            color="#8E8E93"
            title="Rotate"
            subtitle="clockwise, speed 0.5×"
            effect={{ effect: 'rotate', direction: 'clockwise' }}
            isActive={rotateActive}
            options={{ speed: 0.5 }}
          />
        </Section>

        <Section title="Transitions">
          <Caption text="Tap a row to play the transition." />
          <TransitionRow
            systemName="circle.fill"
            color="#30D158"
            title="Scale"
            subtitle="scale: up"
            effect={{ effect: 'scale', scale: 'up' }}
            isActive={scaleActive}
          />
          <TransitionRow
            systemName="signature"
            color="#BF5AF2"
            title="Draw on"
            subtitle="individually"
            effect={{ effect: 'drawOn', scope: 'individually' }}
            isActive={drawOnActive}
          />
        </Section>
      </Form>
    </Host>
  );
}

// MARK: - Row components

function Caption({ text }: { text: string }) {
  return (
    <Text
      modifiers={[
        font({ size: 13 }),
        foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
        padding({ vertical: 6 }),
      ]}>
      {text}
    </Text>
  );
}

function DiscreteRow({
  systemName,
  color,
  title,
  subtitle,
  effect,
  trigger,
  options,
}: {
  systemName: SFSymbol;
  color: string;
  title: string;
  subtitle: string;
  effect: EffectArg;
  trigger: CounterState;
  options?: OptionsArg;
}) {
  return (
    <HStack
      spacing={16}
      modifiers={[padding({ vertical: 10 }), onTapGesture(() => incrementOnUI(trigger))]}>
      <Image
        systemName={systemName}
        size={SYMBOL_SIZE}
        color={color}
        modifiers={[symbolEffect(effect, { value: trigger, options })]}
      />
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 16, weight: 'semibold' })]}>{title}</Text>
        <Text
          modifiers={[
            font({ size: 13 }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}>
          {subtitle}
        </Text>
      </VStack>
      <Spacer />
      <Image systemName="play.circle" size={22} color="#8E8E93" />
    </HStack>
  );
}

function TransitionRow({
  systemName,
  color,
  title,
  subtitle,
  effect,
  isActive,
}: {
  systemName: SFSymbol;
  color: string;
  title: string;
  subtitle: string;
  effect: EffectArg;
  isActive: BoolState;
}) {
  return (
    <HStack
      spacing={16}
      modifiers={[padding({ vertical: 10 }), onTapGesture(() => toggleOnUI(isActive))]}>
      <Image
        systemName={systemName}
        size={SYMBOL_SIZE}
        color={color}
        modifiers={[symbolEffect(effect, { isActive })]}
      />
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 16, weight: 'semibold' })]}>{title}</Text>
        <Text
          modifiers={[
            font({ size: 13 }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}>
          {subtitle}
        </Text>
      </VStack>
      <Spacer />
      <Image systemName="play.circle" size={22} color="#8E8E93" />
    </HStack>
  );
}

function IndefiniteRow({
  systemName,
  color,
  title,
  subtitle,
  effect,
  isActive,
  options,
}: {
  systemName: SFSymbol;
  color: string;
  title: string;
  subtitle: string;
  effect: EffectArg;
  isActive: BoolState;
  options?: OptionsArg;
}) {
  return (
    <HStack spacing={16} modifiers={[padding({ vertical: 10 })]}>
      <Image
        systemName={systemName}
        size={SYMBOL_SIZE}
        color={color}
        modifiers={[symbolEffect(effect, { isActive, options })]}
      />
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 16, weight: 'semibold' })]}>{title}</Text>
        <Text
          modifiers={[
            font({ size: 13 }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}>
          {subtitle}
        </Text>
      </VStack>
      <Spacer />
      <SyncToggle isOn={isActive} />
    </HStack>
  );
}
