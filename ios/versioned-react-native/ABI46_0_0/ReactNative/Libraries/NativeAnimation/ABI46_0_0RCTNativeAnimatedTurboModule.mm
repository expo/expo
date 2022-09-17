/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0FBReactNativeSpec/ABI46_0_0FBReactNativeSpec.h>
#import <ABI46_0_0RCTTypeSafety/ABI46_0_0RCTConvertHelpers.h>
#import <ABI46_0_0React/ABI46_0_0RCTNativeAnimatedTurboModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTNativeAnimatedNodesManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTInitializing.h>

#import "ABI46_0_0RCTAnimationPlugins.h"

typedef void (^AnimatedOperation)(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager);

@interface ABI46_0_0RCTNativeAnimatedTurboModule() <ABI46_0_0NativeAnimatedModuleSpec, ABI46_0_0RCTInitializing>
@end

@implementation ABI46_0_0RCTNativeAnimatedTurboModule
{
  ABI46_0_0RCTNativeAnimatedNodesManager *_nodesManager;
  __weak id<ABI46_0_0RCTSurfacePresenterStub> _surfacePresenter;
  // Operations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;
  NSMutableDictionary<NSNumber *, NSNumber *> *_animIdIsManagedByFabric;
  // A set of nodeIDs managed by Fabric.
  NSMutableSet<NSNumber *> *_nodeIDsManagedByFabric;
}

ABI46_0_0RCT_EXPORT_MODULE();

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
    _nodeIDsManagedByFabric = [NSMutableSet new];
  }
  return self;
}

- (void)initialize
{
  // _surfacePresenter set in setSurfacePresenter:
  _nodesManager = [[ABI46_0_0RCTNativeAnimatedNodesManager alloc] initWithBridge:nil surfacePresenter:_surfacePresenter];
  [_surfacePresenter addObserver:self];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
}

- (void)invalidate
{
  [super invalidate];
  [_nodesManager stopAnimationLoop];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] removeDispatchObserver:self];
  [_surfacePresenter removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return ABI46_0_0RCTGetUIManagerQueue();
}

/*
 * In bridgeless mode, `setBridge` is never called during initializtion. Instead this selector is invoked via
 * BridgelessTurboModuleSetup.
 */
- (void)setSurfacePresenter:(id<ABI46_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

#pragma mark -- API

ABI46_0_0RCT_EXPORT_METHOD(startOperationBatch)
{
  // TODO T71377585
}

ABI46_0_0RCT_EXPORT_METHOD(finishOperationBatch)
{
  // TODO T71377585
}

ABI46_0_0RCT_EXPORT_METHOD(createAnimatedNode:(double)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:[NSNumber numberWithDouble:tag] config:config];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(updateAnimatedNodeConfig:(double)tag
                  config:(NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager updateAnimatedNodeConfig:[NSNumber numberWithDouble:tag] config:config];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(connectAnimatedNodes:(double)parentTag
                  childTag:(double)childTag)
{
  if ([_nodeIDsManagedByFabric containsObject:@(childTag)]) {
    [_nodeIDsManagedByFabric addObject:@(parentTag)];
  }
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:[NSNumber numberWithDouble:parentTag] childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodes:(double)parentTag
                  childTag:(double)childTag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:[NSNumber numberWithDouble:parentTag] childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(startAnimatingNode:(double)animationId
                  nodeTag:(double)nodeTag
                  config:(NSDictionary<NSString *, id> *)config
                  endCallback:(ABI46_0_0RCTResponseSenderBlock)callBack)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:[NSNumber numberWithDouble:animationId] nodeTag:[NSNumber numberWithDouble:nodeTag] config:config endCallback:callBack];
  }];

  BOOL isNodeManagedByFabric = [_nodeIDsManagedByFabric containsObject:@(nodeTag)];
  if (isNodeManagedByFabric) {
    self->_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] = @YES;
    [self flushOperationQueues];
  }
}

ABI46_0_0RCT_EXPORT_METHOD(stopAnimation:(double)animationId)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:[NSNumber numberWithDouble:animationId]];
  }];
  if ([_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] boolValue]) {
    [self flushOperationQueues];
  }
}

ABI46_0_0RCT_EXPORT_METHOD(setAnimatedNodeValue:(double)nodeTag
                  value:(double)value)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:[NSNumber numberWithDouble:nodeTag] value:[NSNumber numberWithDouble:value]];
  }];
  // In Bridge, flushing of native animations is done from ABI46_0_0RCTCxxBridge batchDidComplete().
  // Since ABI46_0_0RCTCxxBridge doesn't exist in Bridgeless, and components are not remounted in Fabric for native animations,
  // flush here for changes in Animated.Value for Animated.event.
  [self flushOperationQueues];
}

ABI46_0_0RCT_EXPORT_METHOD(setAnimatedNodeOffset:(double)nodeTag
                  offset:(double)offset)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag] offset:[NSNumber numberWithDouble:offset]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(flattenAnimatedNodeOffset:(double)nodeTag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(extractAnimatedNodeOffset:(double)nodeTag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(connectAnimatedNodeToView:(double)nodeTag
                  viewTag:(double)viewTag)
{
  if (ABI46_0_0RCTUIManagerTypeForTagIsFabric(@(viewTag))) {
    [_nodeIDsManagedByFabric addObject:@(nodeTag)];
  }
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    // viewName is not used when node is managed by Fabric, and nodes are always managed by Fabric in Bridgeless.
    [nodesManager connectAnimatedNodeToView:[NSNumber numberWithDouble:nodeTag] viewTag:[NSNumber numberWithDouble:viewTag] viewName:nil];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView:(double)nodeTag
                  viewTag:(double)viewTag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:[NSNumber numberWithDouble:nodeTag] viewTag:[NSNumber numberWithDouble:viewTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(restoreDefaultValues:(double)nodeTag)
{
  [self addPreOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:[NSNumber numberWithDouble:nodeTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(dropAnimatedNode:(double)tag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:[NSNumber numberWithDouble:tag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue:(double)tag)
{
  __weak id<ABI46_0_0RCTValueAnimatedNodeObserver> valueObserver = self;
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag] valueObserver:valueObserver];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue:(double)tag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(addAnimatedEventToView:(double)viewTag
                  eventName:(nonnull NSString *)eventName
                  eventMapping:(ABI46_0_0JS::NativeAnimatedModule::EventMapping &)eventMapping)
{
  NSMutableDictionary *eventMappingDict = [NSMutableDictionary new];
  eventMappingDict[@"nativeEventPath"] = ABI46_0_0RCTConvertVecToArray(eventMapping.nativeEventPath());

  if (eventMapping.animatedValueTag()) {
    eventMappingDict[@"animatedValueTag"] = @(*eventMapping.animatedValueTag());
  }

  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:[NSNumber numberWithDouble:viewTag] eventName:eventName eventMapping:eventMappingDict];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(removeAnimatedEventFromView:(double)viewTag
                  eventName:(nonnull NSString *)eventName
            animatedNodeTag:(double)animatedNodeTag)
{
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:[NSNumber numberWithDouble:viewTag] eventName:eventName animatedNodeTag:[NSNumber numberWithDouble:animatedNodeTag]];
  }];
}

ABI46_0_0RCT_EXPORT_METHOD(getValue:(double)nodeTag saveValueCallback:(ABI46_0_0RCTResponseSenderBlock)saveValueCallback) {
  [self addOperationBlock:^(ABI46_0_0RCTNativeAnimatedNodesManager *nodesManager) {
      [nodesManager getValue:[NSNumber numberWithDouble:nodeTag] saveCallback:saveValueCallback];
  }];
}

#pragma mark -- Batch handling

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


  ABI46_0_0RCTExecuteOnMainQueue(^{
    for (AnimatedOperation operation in preOperations) {
      operation(self->_nodesManager);
    }
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }
    [self->_nodesManager updateAnimations];
  });
}

#pragma mark - ABI46_0_0RCTSurfacePresenterObserver

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag
{
  ABI46_0_0RCTAssertMainQueue();
  ABI46_0_0RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *preOperations = self->_preOperations;
    self->_preOperations = [NSMutableArray new];

    ABI46_0_0RCTExecuteOnMainQueue(^{
      for (AnimatedOperation preOperation in preOperations) {
        preOperation(self->_nodesManager);
      }
    });
  });
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  ABI46_0_0RCTAssertMainQueue();
  ABI46_0_0RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *operations = self->_operations;
    self->_operations = [NSMutableArray new];

    ABI46_0_0RCTExecuteOnMainQueue(^{
      for (AnimatedOperation operation in operations) {
        operation(self->_nodesManager);
      }
    });
  });
}

#pragma mark -- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onAnimatedValueUpdate"];
}

- (void)animatedNode:(ABI46_0_0RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate"
                     body:@{@"tag": node.nodeTag, @"value": @(value)}];
}

- (void)eventDispatcherWillDispatchEvent:(id<ABI46_0_0RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  ABI46_0_0RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];
  });
}

- (std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::TurboModule>)getTurboModule:(const ABI46_0_0facebook::ABI46_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI46_0_0facebook::ABI46_0_0React::NativeAnimatedModuleSpecJSI>(params);
}

@end

Class ABI46_0_0RCTNativeAnimatedTurboModuleCls(void) {
  return ABI46_0_0RCTNativeAnimatedTurboModule.class;
}
