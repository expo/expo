/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTFabricSurface;

typedef void (^ABI49_0_0RCTSurfaceEnumeratorBlock)(NSEnumerator<ABI49_0_0RCTFabricSurface *> *enumerator);

/**
 * Registry of Surfaces.
 * Encapsulates storing Surface objects and querying them by root tag.
 * All methods of the registry are thread-safe.
 * The registry stores Surface objects as weak references.
 */
@interface ABI49_0_0RCTSurfaceRegistry : NSObject

- (void)enumerateWithBlock:(ABI49_0_0RCTSurfaceEnumeratorBlock)block;

/**
 * Adds Surface object into the registry.
 * The registry does not retain Surface references.
 */
- (void)registerSurface:(ABI49_0_0RCTFabricSurface *)surface;

/**
 * Removes Surface object from the registry.
 */
- (void)unregisterSurface:(ABI49_0_0RCTFabricSurface *)surface;

/**
 * Returns stored Surface object by given root tag.
 * If the registry does not have such Surface registered, returns `nil`.
 */
- (nullable ABI49_0_0RCTFabricSurface *)surfaceForRootTag:(ABI49_0_0ReactTag)rootTag;

@end

NS_ASSUME_NONNULL_END
