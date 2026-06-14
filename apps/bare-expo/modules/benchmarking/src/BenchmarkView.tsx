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

const NativeBenchmarkView = requireNativeViewManager<BenchmarkViewProps>('BenchmarkingExpoModule');

export default function BenchmarkView(props: BenchmarkViewProps) {
  return <NativeBenchmarkView {...props} />;
}
