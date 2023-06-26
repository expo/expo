/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>
#import <ABI49_0_0React/ABI49_0_0RCTInitializing.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTNativeAnimatedModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTNativeAnimatedNodesManager.h>

#import <ABI49_0_0RCTTypeSafety/ABI49_0_0RCTConvertHelpers.h>

#import "ABI49_0_0RCTAnimationPlugins.h"

typedef void (^AnimatedOperation)(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager);

@interface ABI49_0_0RCTNativeAnimatedModule () <ABI49_0_0RCTInitializing>
@end

@implementation ABI49_0_0RCTNativeAnimatedModule {
  ABI49_0_0RCTNativeAnimatedNodesManager *_nodesManager;

  // Operations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;
  NSMutableDictionary<NSNumber *, NSNumber *> *_animIdIsManagedByFabric;
}

ABI49_0_0RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _operations = [NSMutableArray new];
    _preOperations = [NSMutableArray new];
    _animIdIsManagedByFabric = [NSMutableDictionary new];
  }
  return self;
}

- (void)invalidate
{
  [super invalidate];
  [_nodesManager stopAnimationLoop];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] removeDispatchObserver:self];
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
  [self.bridge.surfacePresenter removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return ABI49_0_0RCTGetUIManagerQueue();
}

- (void)setBridge:(ABI49_0_0RCTBridge *)bridge
{
  [super setBridge:bridge];
  _nodesManager = [[ABI49_0_0RCTNativeAnimatedNodesManager alloc] initWithBridge:self.bridge
                                                       surfacePresenter:bridge.surfacePresenter];
  [bridge.uiManager.observerCoordinator addObserver:self];
  [bridge.surfacePresenter addObserver:self];
}

- (void)initialize
{
  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
}

/*
 * This selector should only be invoked in bridgeless mode, which is not compatible with this non turbo module.
 */
- (void)setSurfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  ABI49_0_0RCTLogWarn(@"setSurfacePresenter should only be invoked in ABI49_0_0RCTNativeAnimatedTurboModule");
}

#pragma mark-- API

ABI49_0_0RCT_EXPORT_METHOD(createAnimatedNode : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:[NSNumber numberWithDouble:tag] config:config];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(updateAnimatedNodeConfig : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager updateAnimatedNodeConfig:[NSNumber numberWithDouble:tag] config:config];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(connectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                              childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                                 childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(startAnimatingNode
                  : (double)animationId nodeTag
                  : (double)nodeTag config
                  : (NSDictionary<NSString *, id> *)config endCallback
                  : (ABI49_0_0RCTResponseSenderBlock)callBack)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:[NSNumber numberWithDouble:animationId]
                             nodeTag:[NSNumber numberWithDouble:nodeTag]
                              config:config
                         endCallback:callBack];
  }];

  ABI49_0_0RCTExecuteOnMainQueue(^{
    if (![self->_nodesManager isNodeManagedByFabric:[NSNumber numberWithDouble:nodeTag]]) {
      return;
    }

    ABI49_0_0RCTExecuteOnUIManagerQueue(^{
      self->_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] = @YES;
      [self flushOperationQueues];
    });
  });
}

ABI49_0_0RCT_EXPORT_METHOD(stopAnimation : (double)animationId)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:[NSNumber numberWithDouble:animationId]];
  }];
  if ([_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] boolValue]) {
    [self flushOperationQueues];
  }
}

ABI49_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue : (double)nodeTag value : (double)value)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:[NSNumber numberWithDouble:nodeTag] value:[NSNumber numberWithDouble:value]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(setAnimatedNodeOffset : (double)nodeTag offset : (double)offset)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag] offset:[NSNumber numberWithDouble:offset]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(flattenAnimatedNodeOffset : (double)nodeTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(extractAnimatedNodeOffset : (double)nodeTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView : (double)nodeTag viewTag : (double)viewTag)
{
  NSString *viewName = [self.bridge.uiManager viewNameForABI49_0_0ReactTag:[NSNumber numberWithDouble:viewTag]];
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodeToView:[NSNumber numberWithDouble:nodeTag]
                                    viewTag:[NSNumber numberWithDouble:viewTag]
                                   viewName:viewName];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView : (double)nodeTag viewTag : (double)viewTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:[NSNumber numberWithDouble:nodeTag]
                                         viewTag:[NSNumber numberWithDouble:viewTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(restoreDefaultValues : (double)nodeTag)
{
  [self addPreOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(dropAnimatedNode : (double)tag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:[NSNumber numberWithDouble:tag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue : (double)tag)
{
  __weak id<ABI49_0_0RCTValueAnimatedNodeObserver> valueObserver = self;
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag] valueObserver:valueObserver];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue : (double)tag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(addAnimatedEventToView
                  : (double)viewTag eventName
                  : (nonnull NSString *)eventName eventMapping
                  : (ABI49_0_0JS::NativeAnimatedModule::EventMapping &)eventMapping)
{
  NSMutableDictionary *eventMappingDict = [NSMutableDictionary new];
  eventMappingDict[@"nativeEventPath"] = ABI49_0_0RCTConvertVecToArray(eventMapping.nativeEventPath());

  if (eventMapping.animatedValueTag()) {
    eventMappingDict[@"animatedValueTag"] = @(*eventMapping.animatedValueTag());
  }

  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:[NSNumber numberWithDouble:viewTag]
                               eventName:eventName
                            eventMapping:eventMappingDict];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView
                  : (double)viewTag eventName
                  : (nonnull NSString *)eventName animatedNodeTag
                  : (double)animatedNodeTag)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:[NSNumber numberWithDouble:viewTag]
                                    eventName:eventName
                              animatedNodeTag:[NSNumber numberWithDouble:animatedNodeTag]];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(getValue : (double)nodeTag saveValueCallback : (ABI49_0_0RCTResponseSenderBlock)saveValueCallback)
{
  [self addOperationBlock:^(ABI49_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager getValue:[NSNumber numberWithDouble:nodeTag] saveCallback:saveValueCallback];
  }];
}

ABI49_0_0RCT_EXPORT_METHOD(queueAndExecuteBatchedOperations : (NSArray *)operationsAndArgs)
{
  // TODO: implement in the future if we want the same optimization here as on Android
}

#pragma mark-- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

- (void)addPreOperationBlock:(AnimatedOperation)operation
{
  [_preOperations addObject:operation];
}

- (void)flushOperationQueues
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }
  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  ABI49_0_0RCTExecuteOnMainQueue(^{
    for (AnimatedOperation operation in preOperations) {
      operation(self->_nodesManager);
    }
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }
    [self->_nodesManager updateAnimations];
  });
}

#pragma mark - ABI49_0_0RCTSurfacePresenterObserver

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *preOperations = self->_preOperations;
    self->_preOperations = [NSMutableArray new];

    ABI49_0_0RCTExecuteOnMainQueue(^{
      for (AnimatedOperation preOperation in preOperations) {
        preOperation(self->_nodesManager);
      }
    });
  });
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *operations = self->_operations;
    self->_operations = [NSMutableArray new];

    ABI49_0_0RCTExecuteOnMainQueue(^{
      for (AnimatedOperation operation in operations) {
        operation(self->_nodesManager);
      }
    });
  });
}

#pragma mark - ABI49_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(ABI49_0_0RCTUIManager *)uiManager
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  [uiManager
      prependUIBlock:^(__unused ABI49_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        for (AnimatedOperation operation in preOperations) {
          operation(self->_nodesManager);
        }
      }];
  [uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }

    [self->_nodesManager updateAnimations];
  }];
}

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onAnimatedValueUpdate" ];
}

- (void)animatedNode:(ABI49_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate" body:@{@"tag" : node.nodeTag, @"value" : @(value)}];
}

- (void)eventDispatcherWillDispatchEvent:(id<ABI49_0_0RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  ABI49_0_0RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];
  });
}

@end

Class ABI49_0_0RCTNativeAnimatedModuleCls(void)
{
  return ABI49_0_0RCTNativeAnimatedModule.class;
}
