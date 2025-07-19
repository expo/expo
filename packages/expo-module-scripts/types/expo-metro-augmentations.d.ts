/* eslint-disable */

/// <reference types="@expo/metro/metro" />
/// <reference types="@expo/metro/metro-babel-transformer" />
/// <reference types="@expo/metro/metro-source-map" />

import * as __metroDeltaBundlerTypes from '@expo/metro/metro/DeltaBundler/types.flow';
declare module '@expo/metro/metro/DeltaBundler/types.flow' {
  const enum _AsyncDependencyType {
    /** @privateRemarks Augmentation adds `asyncType: 'worker'` to possible values for worker chunk splitting */
    worker = 'worker'
  }
}

import * as __metroBabelTransformer from '@expo/metro/metro-babel-transformer';
declare module '@expo/metro/metro-babel-transformer' {
  interface BabelTransformerOptions {
    /** @privateRemarks Augmentation passed to the Expo Babel caller and used in `babel-preset-expo` to force `enableBabelRuntime` to `false` */
    type?: 'script' | 'module' | 'asset';
  }

  interface MetroBabelFileMetadata {
    /** @privateRemarks Augmentation used in babel-preset-expo/src/{client-module-proxy-plugin.ts,server-actions-plugin.ts} */
    reactServerReference?: string;
    /** @privateRemarks Augmentation used in babel-preset-expo/src/client-module-proxy-plugin.ts */
    reactClientReference?: string;
    /** @privateRemarks Augmentation used in babel-preset-expo/src/use-dom-directive-plugin.ts */
    expoDomComponentReference?: string;
    /** @privateRemarks Augmentation used in babel-preset-expo/src/detect-dynamic-exports.ts */
    hasCjsExports?: boolean;
  }
}

import * as __metroSourceMap from '@expo/metro/metro-source-map/source-map';
declare module '@expo/metro/metro-source-map/source-map' {
  /** @privateRemarks Addition as per: https://github.com/facebook/metro/blob/3eeba3d459592aa5128995c8224933f6a23a43f1/flow-typed/npm/babel_v7.x.x.js#L23 */
  export interface BabelSourceMapSegment extends Record<string, any> {
    name?: null | string;
    source?: null | string;
    generated: { line: number; column: number };
    original?: { line: number; column: number };
  }

  /** @privateRemarks Augmented to switch return type to `BabelSourceMapSegment[]` */
  export function toBabelSegments(sourceMap: BasicSourceMap): BabelSourceMapSegment[];
  /** @privateRemarks Augmented to switch argument type to `BabelSourceMapSegment` */
  export function toSegmentTuple(mapping: BabelSourceMapSegment): MetroSourceMapSegmentTuple;
}

