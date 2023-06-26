/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

@protocol ABI49_0_0RCTValueAnimatedNodeObserver;

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RCTNativeAnimatedNodesManager : NSObject

- (nonnull instancetype)initWithBridge:(nullable ABI49_0_0RCTBridge *)bridge
                      surfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter;

- (void)updateAnimations;

- (void)stepAnimations:(CADisplayLink *)displaylink;

- (BOOL)isNodeManagedByFabric:(NSNumber *)tag;

- (void)getValue:(NSNumber *)nodeTag saveCallback:(ABI49_0_0RCTResponseSenderBlock)saveCallback;

// graph

- (void)createAnimatedNode:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config;

- (void)connectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag;

- (void)disconnectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag;

- (void)connectAnimatedNodeToView:(NSNumber *)nodeTag
                          viewTag:(NSNumber *)viewTag
                         viewName:(nullable NSString *)viewName;

- (void)restoreDefaultValues:(NSNumber *)nodeTag;

- (void)disconnectAnimatedNodeFromView:(NSNumber *)nodeTag viewTag:(NSNumber *)viewTag;

- (void)dropAnimatedNode:(NSNumber *)tag;

// mutations

- (void)setAnimatedNodeValue:(NSNumber *)nodeTag value:(NSNumber *)value;

- (void)setAnimatedNodeOffset:(NSNumber *)nodeTag offset:(NSNumber *)offset;

- (void)flattenAnimatedNodeOffset:(NSNumber *)nodeTag;

- (void)extractAnimatedNodeOffset:(NSNumber *)nodeTag;

- (void)updateAnimatedNodeConfig:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config;

// drivers

- (void)startAnimatingNode:(NSNumber *)animationId
                   nodeTag:(NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(nullable ABI49_0_0RCTResponseSenderBlock)callBack;

- (void)stopAnimation:(NSNumber *)animationId;

- (void)stopAnimationLoop;

// events

- (void)addAnimatedEventToView:(NSNumber *)viewTag
                     eventName:(NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping;

- (void)removeAnimatedEventFromView:(NSNumber *)viewTag
                          eventName:(NSString *)eventName
                    animatedNodeTag:(NSNumber *)animatedNodeTag;

- (void)handleAnimatedEvent:(id<ABI49_0_0RCTEvent>)event;

// listeners

- (void)startListeningToAnimatedNodeValue:(NSNumber *)tag valueObserver:(id<ABI49_0_0RCTValueAnimatedNodeObserver>)valueObserver;

- (void)stopListeningToAnimatedNodeValue:(NSNumber *)tag;

@end

NS_ASSUME_NONNULL_END
