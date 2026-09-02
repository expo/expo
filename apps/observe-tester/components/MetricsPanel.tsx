import type { Metric } from 'expo-app-metrics';
import { StyleSheet, Text, View } from 'react-native';

import { JSONView } from '@/components/JSONView';
import { capitalize, categoryRank } from '@/utils/metricCategories';
import { useTheme } from '@/utils/theme';

type MetricsPanelProps = {
  metrics: Metric[];
  /**
   * When provided, only metrics whose `name` is in the set are rendered. An empty set hides everything
   * and falls through to the standard "No metrics recorded" empty state.
   */
  filter?: ReadonlySet<string>;
};

export function MetricsPanel({ metrics, filter }: MetricsPanelProps) {
  const theme = useTheme();
  const visibleMetrics = filter ? metrics.filter((metric) => filter.has(metric.name)) : metrics;
  if (visibleMetrics.length === 0) {
    return <Text style={[styles.empty, { color: theme.text.secondary }]}>No metrics recorded</Text>;
  }

  const groups = groupByCategory(visibleMetrics);

  return (
    <View style={styles.container}>
      {groups.map(({ category, items }) => (
        <View
          key={category}
          style={[
            styles.group,
            { backgroundColor: theme.background.element, borderColor: theme.border.default },
          ]}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: theme.text.default }]}>
              {capitalize(category)}
            </Text>
            <Text style={[styles.groupCount, { color: theme.text.tertiary }]}>{items.length}</Text>
          </View>
          {items.map((metric, index) => {
            const hasParams = metric.params != null && Object.keys(metric.params).length > 0;
            return (
              <View
                key={`${metric.timestamp}-${metric.name}`}
                style={[
                  styles.metricItem,
                  index > 0 && { borderTopColor: theme.border.default, borderTopWidth: 1 },
                ]}>
                <View style={styles.metricRow}>
                  <Text
                    style={[styles.metricName, { color: theme.text.default }]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {metric.name}
                  </Text>
                  <Text style={[styles.metricValue, { color: theme.text.secondary }]}>
                    {formatValue(metric.value)}
                  </Text>
                </View>
                {metric.routeName ? (
                  <View style={styles.metricRoute}>
                    <Text style={[styles.metricMetaLabel, { color: theme.text.default }]}>
                      Route
                    </Text>
                    <Text
                      style={[styles.metricRouteName, { color: theme.text.secondary }]}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {metric.routeName}
                    </Text>
                  </View>
                ) : null}
                {hasParams ? (
                  <View style={styles.metricParams}>
                    <Text style={[styles.metricMetaLabel, { color: theme.text.default }]}>
                      Params
                    </Text>
                    <JSONView
                      value={metric.params}
                      bordered={false}
                      textColor={theme.text.secondary}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function groupByCategory(metrics: Metric[]) {
  const map = new Map<string, Metric[]>();
  for (const metric of metrics) {
    const list = map.get(metric.category);
    if (list) {
      list.push(metric);
    } else {
      map.set(metric.category, [metric]);
    }
  }
  return Array.from(map.entries())
    .map(([category, items]) => ({ category, items }))
    .sort(
      (a, b) =>
        categoryRank(a.category) - categoryRank(b.category) || a.category.localeCompare(b.category)
    );
}

function formatValue(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(3);
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  group: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricItem: {
    paddingVertical: 6,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricParams: {
    marginTop: 6,
    marginLeft: 12,
  },
  metricMetaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  metricRoute: {
    marginTop: 6,
    marginLeft: 12,
  },
  metricRouteName: {
    fontFamily: 'Menlo',
    fontSize: 11,
    lineHeight: 15,
  },
  metricValue: {
    fontFamily: 'Menlo',
    fontSize: 12,
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
});
