import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { DepartmentAgent } from '@/constants/agents';
import type { AgentStatus } from '@/constants/agents';
import { colors, radii } from '@/constants/theme';
import { LifeOrb, LivingPulse } from '@/components/LivingPulse';

type Props = {
  agent: DepartmentAgent;
  selected: boolean;
  status: AgentStatus;
  activity: number;
  onPress: () => void;
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'IDLE',
  listening: 'LIVE',
  thinking: 'PROC',
  streaming: 'STREAM',
  alert: 'ALERT',
};

export function AgentPad({
  agent,
  selected,
  status,
  activity,
  onPress,
}: Props) {
  const scale = useSharedValue(1);
  const lit = status !== 'idle' || selected;

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94, { damping: 16, stiffness: 320 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  };

  const handlePress = async () => {
    scale.value = withTiming(0.9, { duration: 60 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 280 });
    });
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // web / unsupported
    }
    onPress();
  };

  return (
    <Animated.View style={[styles.wrap, anim]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.pad,
          selected && { borderColor: agent.accent, borderWidth: 1.5 },
          lit && { shadowColor: agent.accent, shadowOpacity: 0.35, shadowRadius: 12 },
        ]}
      >
        <LinearGradient
          colors={
            lit
              ? ['#1A222C', '#10151C', `${agent.accent}22`]
              : ['#171C24', '#0E1218']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          <View style={styles.topRow}>
            <Text style={[styles.code, { color: agent.accent }]}>{agent.code}</Text>
            <View
              style={[
                styles.led,
                {
                  backgroundColor: lit ? agent.accent : colors.muted,
                  opacity: lit ? 1 : 0.35,
                },
              ]}
            />
          </View>

          <View style={styles.mid}>
            <LifeOrb color={agent.accent} active={lit} />
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {agent.name}
          </Text>
          <Text style={styles.dept} numberOfLines={1}>
            {agent.department}
          </Text>

          <View style={styles.footer}>
            <LivingPulse
              color={agent.accent}
              active={status === 'streaming' || status === 'thinking'}
              intensity={activity}
              bars={4}
            />
            <Text style={[styles.status, { color: lit ? agent.accent : colors.muted }]}>
              {STATUS_LABEL[status]} · L{agent.level}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
  },
  pad: {
    flex: 1,
    borderRadius: radii.pad,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    backgroundColor: colors.pad,
  },
  fill: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 9,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  led: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  mid: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    fontFamily: 'Syne_700Bold',
    color: colors.ink,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  dept: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.muted,
    fontSize: 9,
    marginTop: 1,
  },
  footer: {
    marginTop: 4,
    gap: 3,
  },
  status: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 8,
    letterSpacing: 0.8,
  },
});
