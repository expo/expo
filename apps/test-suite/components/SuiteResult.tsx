import { StyleSheet, Text, View } from 'react-native';

import SpecResult from './SpecResult';
import { useTheme } from '../../common/ThemeProvider';
import { type Status } from '../constants/Statuses';
import { type Suite } from '../types';

function childHasFailures(suite: Suite): boolean {
  if (suite.specs.some((s) => s.status === 'failed')) {
    return true;
  }
  return suite.children.some(childHasFailures);
}

type SuiteResultProps = {
  suite: Suite;
  depth: number;
  failuresOnly: boolean;
};

export default function SuiteResult({ suite, depth, failuresOnly }: SuiteResultProps) {
  const { theme } = useTheme();
  const { result, specs, children } = suite;
  const isRoot = depth === 0;

  const visibleSpecs = failuresOnly ? specs.filter((s) => s.status === 'failed') : specs;
  const visibleChildren = failuresOnly ? children.filter(childHasFailures) : children;

  return (
    <View
      testID="test_suite_view_suite_container"
      style={[
        isRoot ? styles.containerRoot : styles.containerNested,
        isRoot && { borderBottomColor: theme.border.secondary },
      ]}>
      <Text
        testID="test_suite_text_suite_description"
        style={[
          isRoot ? styles.titleRoot : styles.titleNested,
          { color: isRoot ? theme.text.default : theme.text.secondary },
        ]}>
        {result.description}
      </Text>
      {visibleSpecs.map((spec) => (
        <SpecResult
          key={`spec-result-${spec.id}`}
          status={spec.status as Status}
          description={spec.description}
          failedExpectations={spec.failedExpectations}
        />
      ))}
      {visibleChildren.map((child) => (
        <SuiteResult
          key={child.result.id}
          suite={child}
          depth={depth + 1}
          failuresOnly={failuresOnly}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  containerRoot: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  containerNested: {
    paddingLeft: 12,
    paddingTop: 4,
  },
  titleRoot: {
    marginBottom: 6,
    fontSize: 17,
    fontWeight: '700',
  },
  titleNested: {
    marginVertical: 4,
    fontSize: 16,
    fontWeight: '600',
  },
});
