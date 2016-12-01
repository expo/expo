/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface ABI12_0_0RCTAnimatedNode : NSObject

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSNumber *nodeTag;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *config;

@property (nonatomic, copy, readonly) NSDictionary<NSNumber *, ABI12_0_0RCTAnimatedNode *> *childNodes;
@property (nonatomic, copy, readonly) NSDictionary<NSNumber *, ABI12_0_0RCTAnimatedNode *> *parentNodes;

@property (nonatomic, readonly) BOOL needsUpdate;
@property (nonatomic, readonly) BOOL hasUpdated;

/**
 * Marks a node and its children as needing update.
 */
- (void)setNeedsUpdate NS_REQUIRES_SUPER;

/**
 * The node will update its value if necesarry and only after its parents have updated.
 */
- (void)updateNodeIfNecessary NS_REQUIRES_SUPER;

/**
 * Where the actual update code lives. Called internally from updateNodeIfNecessary
 */
- (void)performUpdate NS_REQUIRES_SUPER;

/**
 * Cleans up after a round of updates.
 */
- (void)cleanupAnimationUpdate NS_REQUIRES_SUPER;

- (void)addChild:(ABI12_0_0RCTAnimatedNode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(ABI12_0_0RCTAnimatedNode *)child NS_REQUIRES_SUPER;

- (void)onAttachedToNode:(ABI12_0_0RCTAnimatedNode *)parent NS_REQUIRES_SUPER;
- (void)onDetachedFromNode:(ABI12_0_0RCTAnimatedNode *)parent NS_REQUIRES_SUPER;

- (void)detachNode NS_REQUIRES_SUPER;

@end
