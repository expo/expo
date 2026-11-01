import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type BenchmarkViewProps = ViewProps & {
  /** A UIColor-decoded color prop. */
  color?: string;
  /** A record-typed prop (exercises the `@Record` decode path on the JS thread).
   *  Named `decoration`, not `style`, to avoid colliding with RN's reserved layout `style`. */
  decoration?: {
    opacity?: number;
    cornerRadius?: number;
    label?: string;
    weight?: number;
  };
  /** An array prop. */
  values?: number[];
  count?: number;
  ratio?: number;
  title?: string;
  subtitle?: string;
};

const NativeBenchmarkView = requireNativeViewManager<BenchmarkViewProps>(
  'BenchmarkingExpoModule',
  'BenchmarkView'
);
const NativeLegacyBenchmarkView = requireNativeViewManager<BenchmarkViewProps>(
  'BenchmarkingExpoModule',
  'LegacyBenchmarkView'
);

/** Props decoded from their JavaScript values on the JS thread. */
export default function BenchmarkView(props: BenchmarkViewProps) {
  return <NativeBenchmarkView {...props} />;
}

/**
 * Same props as `BenchmarkView`, lowered to a dictionary and decoded on the main thread instead
 * (the path every existing view uses).
 */
export function LegacyBenchmarkView(props: BenchmarkViewProps) {
  return <NativeLegacyBenchmarkView {...props} />;
}
