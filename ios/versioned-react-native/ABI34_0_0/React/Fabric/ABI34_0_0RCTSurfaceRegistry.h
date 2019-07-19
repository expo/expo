/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTFabricSurface;

/**
 * Registry of Surfaces.
 * Incapsulates storing Surface objects and quering them by root tag.
 * All methods of the registry are thread-safe.
 * The registry stores Surface objects as weak refereces.
 */
@interface ABI34_0_0RCTSurfaceRegistry : NSObject

- (NSEnumerator<ABI34_0_0RCTFabricSurface *> *)enumerator;

/**
 * Adds Surface object into the registry.
 * The registry does not retain Surface references.
 */
- (void)registerSurface:(ABI34_0_0RCTFabricSurface *)surface;

/**
 * Removes Surface object from the registry.
 */
- (void)unregisterSurface:(ABI34_0_0RCTFabricSurface *)surface;

/**
 * Returns stored Surface object by given root tag.
 * If the registry does not have such Surface registred, returns `nil`.
 */
- (nullable ABI34_0_0RCTFabricSurface *)surfaceForRootTag:(ReactABI34_0_0Tag)rootTag;

@end

NS_ASSUME_NONNULL_END
