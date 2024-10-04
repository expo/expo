#import "ABI42_0_0REAPropsNode.h"

#import "ABI42_0_0REANodesManager.h"
#import "ABI42_0_0REAStyleNode.h"
#import "ABI42_0_0REAModule.h"

#import <ABI42_0_0React/ABI42_0_0RCTLog.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import "ABI42_0_0React/ABI42_0_0RCTComponentData.h"

@implementation ABI42_0_0REAPropsNode
{
  NSNumber *_connectedViewTag;
  NSString *_connectedViewName;
  NSMutableDictionary<NSString *, ABI42_0_0REANodeID> *_propsConfig;
}

- (instancetype)initWithID:(ABI42_0_0REANodeID)nodeID
                    config:(NSDictionary<NSString *,id> *)config
{
  if (self = [super initWithID:nodeID config:config]) {
    _propsConfig = config[@"props"];
  }
  return self;
}

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
{
  _connectedViewTag = viewTag;
  _connectedViewName = viewName;
  [self dangerouslyRescheduleEvaluate];
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _connectedViewTag = nil;
  _connectedViewName = nil;
}

- (id)evaluate
{
  NSMutableDictionary *uiProps = [NSMutableDictionary new];
  NSMutableDictionary *nativeProps = [NSMutableDictionary new];
  NSMutableDictionary *jsProps = [NSMutableDictionary new];
  
  void (^addBlock)(NSString *key, id obj, BOOL * stop) = ^(NSString *key, id obj, BOOL * stop){
    if ([self.nodesManager.uiProps containsObject:key]) {
      uiProps[key] = obj;
    } else if ([self.nodesManager.nativeProps containsObject:key]) {
      nativeProps[key] = obj;
    } else {
      jsProps[key] = obj;
    }
  };
  
  for (NSString *prop in _propsConfig) {
    ABI42_0_0REANode *propNode = [self.nodesManager findNodeByID:_propsConfig[prop]];
    
    if ([propNode isKindOfClass:[ABI42_0_0REAStyleNode class]]) {
      [[propNode value] enumerateKeysAndObjectsUsingBlock:addBlock];
    } else {
      addBlock(prop, [propNode value], nil);
    }
  }
  
  if (_connectedViewTag != nil) {
    if (uiProps.count > 0) {
      [self.nodesManager.uiManager
       synchronouslyUpdateViewOnUIThread:_connectedViewTag
       viewName:_connectedViewName
       props:uiProps];
    }
    if (nativeProps.count > 0) {
      [self.nodesManager enqueueUpdateViewOnNativeThread:_connectedViewTag viewName:_connectedViewName nativeProps:nativeProps trySynchronously:NO];
    }
    if (jsProps.count > 0) {
      [self.nodesManager.reanimatedModule
       sendEventWithName:@"onReanimatedPropsChange"
       body:@{@"viewTag": _connectedViewTag, @"props": jsProps }];
    }
  }
  
  return @(0);
}

- (void)update
{
  // Since we are updating nodes after detaching them from views there is a time where it's
  // possible that the view was disconnected and still receive an update, this is normal and we can
  // simply skip that update.
  if (!_connectedViewTag) {
    return;
  }

  // triger for side effect
  [self value];
}

@end

