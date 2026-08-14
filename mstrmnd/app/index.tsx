import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgentGrid } from '@/components/AgentGrid';
import { BrandLockup } from '@/components/BrandLockup';
import { MainAgentWindow } from '@/components/MainAgentWindow';
import { colors, spacing } from '@/constants/theme';
import { useController } from '@/context/ControllerContext';

export default function ControllerScreen() {
  const { selectedAgent } = useController();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#101014', '#070708', '#000000']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <View>
            <BrandLockup markSize={26} compact />
            <Text style={styles.sub}>agent controller</Text>
          </View>
          <View style={styles.session}>
            <View style={[styles.dot, { backgroundColor: selectedAgent.accent }]} />
            <Text style={styles.sessionText}>SESSION LIVE</Text>
          </View>
        </View>

        <View style={styles.padDeck}>
          <AgentGrid />
        </View>

        <View style={styles.mainSlot}>
          <MainAgentWindow />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.void,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  sub: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 4,
    marginLeft: 36,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sessionText: {
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.metal,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  padDeck: {
    flex: 2,
    minHeight: 0,
  },
  mainSlot: {
    flex: 1,
    minHeight: 220,
    marginBottom: spacing.sm,
  },
});
