/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI49_0_0RCTNativeAnimatedNodesManager;

@interface ABI49_0_0RCTAnimatedNode : NSObject

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSNumber *nodeTag;
@property (nonatomic, weak) ABI49_0_0RCTNativeAnimatedNodesManager *manager;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *config;

@property (nonatomic, copy, readonly) NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *childNodes;
@property (nonatomic, copy, readonly) NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *parentNodes;

@property (nonatomic, readonly) BOOL needsUpdate;

- (BOOL)isManagedByFabric;

/**
 * Marks a node and its children as needing update.
 */
- (void)setNeedsUpdate NS_REQUIRES_SUPER;

/**
 * The node will update its value if necessary and only after its parents have updated.
 */
- (void)updateNodeIfNecessary NS_REQUIRES_SUPER;

/**
 * Where the actual update code lives. Called internally from updateNodeIfNecessary
 */
- (void)performUpdate NS_REQUIRES_SUPER;

- (void)addChild:(ABI49_0_0RCTAnimatedNode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(ABI49_0_0RCTAnimatedNode *)child NS_REQUIRES_SUPER;

- (void)onAttachedToNode:(ABI49_0_0RCTAnimatedNode *)parent NS_REQUIRES_SUPER;
- (void)onDetachedFromNode:(ABI49_0_0RCTAnimatedNode *)parent NS_REQUIRES_SUPER;

- (void)detachNode NS_REQUIRES_SUPER;

@end
