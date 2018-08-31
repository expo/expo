/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI30_0_0/ABI30_0_0RCTValueAnimatedNode.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>

@interface ABI30_0_0RCTNativeAnimatedNodesManager : NSObject

- (nonnull instancetype)initWithUIManager:(nonnull ABI30_0_0RCTUIManager *)uiManager;

- (void)updateAnimations;

- (void)stepAnimations:(nonnull CADisplayLink *)displaylink;

// graph

- (void)createAnimatedNode:(nonnull NSNumber *)tag
                    config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag;

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag;

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag
                         viewName:(nonnull NSString *)viewName;

- (void)restoreDefaultValues:(nonnull NSNumber *)nodeTag;

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag;

- (void)dropAnimatedNode:(nonnull NSNumber *)tag;

// mutations

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value;

- (void)setAnimatedNodeOffset:(nonnull NSNumber *)nodeTag
                       offset:(nonnull NSNumber *)offset;

- (void)flattenAnimatedNodeOffset:(nonnull NSNumber *)nodeTag;

- (void)extractAnimatedNodeOffset:(nonnull NSNumber *)nodeTag;

// drivers

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *__nonnull)config
               endCallback:(nullable ABI30_0_0RCTResponseSenderBlock)callBack;

- (void)stopAnimation:(nonnull NSNumber *)animationId;

- (void)stopAnimationLoop;

// events

- (void)addAnimatedEventToView:(nonnull NSNumber *)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *__nonnull)eventMapping;

- (void)removeAnimatedEventFromView:(nonnull NSNumber *)viewTag
                          eventName:(nonnull NSString *)eventName
                    animatedNodeTag:(nonnull NSNumber *)animatedNodeTag;

- (void)handleAnimatedEvent:(nonnull id<ABI30_0_0RCTEvent>)event;

// listeners

- (void)startListeningToAnimatedNodeValue:(nonnull NSNumber *)tag
                            valueObserver:(nonnull id<ABI30_0_0RCTValueAnimatedNodeObserver>)valueObserver;

- (void)stopListeningToAnimatedNodeValue:(nonnull NSNumber *)tag;

@end
