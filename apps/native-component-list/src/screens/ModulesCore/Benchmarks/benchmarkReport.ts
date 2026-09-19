import { Platform } from 'react-native';

import {
  BenchmarkStatus,
  GROUPS,
  Group,
  State,
  benchmarkIdOf,
  formatIterations,
  formatPerOpIn,
  nsPerOp,
  perOpUnitFor,
  relativeUncertaintyOf,
} from './benchmarks';

/**
 * Builds a markdown report of every completed benchmark, ready to paste into a pull request.
 * Returns `null` when nothing has run yet. Each group prints in a single unit, named in the
 * column headers, and the report header records the platform and bundle mode, because numbers
 * from a dev bundle are not comparable with release ones.
 */
export function buildMarkdownReport(state: State): string | null {
  const sections = GROUPS.map((group) => {
    return sectionFor(group, state);
  }).filter((section): section is string => {
    return section != null;
  });

  if (sections.length === 0) {
    return null;
  }

  const bundle = __DEV__ ? 'dev bundle' : 'release bundle';
  const header = `**Expo modules benchmarks** — ${Platform.OS} ${Platform.Version}, ${bundle}, median with 95% bootstrap CI`;
  return [header, ...sections].join('\n\n');
}

function sectionFor(group: Group, state: State): string | null {
  const completed = group.benchmarks.flatMap((benchmark) => {
    const cell = state[benchmarkIdOf(group, benchmark)];
    if (cell.status !== BenchmarkStatus.Done || cell.current == null) {
      return [];
    }
    return [{ label: benchmark.label, run: cell.current }];
  });

  if (completed.length === 0) {
    return null;
  }

  const fastestNs = Math.min(
    ...completed.map(({ run }) => {
      return nsPerOp(run.medianMs, run.iterations);
    })
  );
  const unit = perOpUnitFor(fastestNs);

  const rows = completed.map(({ label, run }) => {
    const perOp = (ms: number) => {
      return formatPerOpIn(nsPerOp(ms, run.iterations), unit);
    };
    return (
      `| ${label} | ${perOp(run.medianMs)} | ${perOp(run.ciLowMs)}–${perOp(run.ciHighMs)} | ` +
      `±${(relativeUncertaintyOf(run) * 100).toFixed(1)}% | ${perOp(run.meanMs)} | ` +
      `${perOp(run.minMs)} | ${perOp(run.maxMs)} | ${formatIterations(run.iterations)} × ${run.samples.length} |`
    );
  });

  const columns = `| benchmark | median (${unit.suffix}) | 95% CI | ± | avg | min | max | iterations |`;
  const alignment = '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |';
  return `### \`${group.title}\`\n\n${columns}\n${alignment}\n${rows.join('\n')}`;
}
