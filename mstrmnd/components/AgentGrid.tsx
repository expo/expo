import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DEPARTMENT_AGENTS } from '@/constants/agents';
import { colors, spacing } from '@/constants/theme';
import { AgentPad } from '@/components/AgentPad';
import { GlassCard } from '@/components/GlassCard';
import { useController } from '@/context/ControllerContext';

const COLS = 3;

export function AgentGrid() {
  const { selectedId, selectAgent, runtimes } = useController();

  const rows: (typeof DEPARTMENT_AGENTS)[] = [];
  for (let i = 0; i < DEPARTMENT_AGENTS.length; i += COLS) {
    rows.push(DEPARTMENT_AGENTS.slice(i, i + COLS));
  }

  return (
    <GlassCard style={styles.chassis} padded={false}>
      <View style={styles.screwRow}>
        <View style={styles.screw} />
        <View style={styles.screw} />
      </View>
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((agent) => {
              const runtime = runtimes[agent.id] ?? {
                status: 'idle' as const,
                activity: 0.1,
              };
              return (
                <AgentPad
                  key={agent.id}
                  agent={agent}
                  selected={selectedId === agent.id}
                  status={runtime.status}
                  activity={runtime.activity}
                  onPress={() => selectAgent(agent.id)}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.screwRow}>
        <View style={styles.screw} />
        <View style={styles.screw} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  chassis: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 0,
  },
  screwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  screw: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bezel,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  grid: {
    flex: 1,
    gap: 6,
    minHeight: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 0,
  },
});
