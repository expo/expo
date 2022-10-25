/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class ABI47_0_0RCTSource;

/**
 * This protocol should be adopted when a turbo module needs to tell ABI47_0_0React Native to load a script.
 * In bridge-less ABI47_0_0React Native, it is a replacement for [_bridge loadAndExecuteSplitBundleURL:].
 */
@protocol ABI47_0_0RCTJSScriptLoaderModule <NSObject>

@property (nonatomic, copy, nonnull) void (^loadScript)(ABI47_0_0RCTSource *source);

@end
