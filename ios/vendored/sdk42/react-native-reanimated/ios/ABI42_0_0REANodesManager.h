#import <Foundation/Foundation.h>

#import "ABI42_0_0REANode.h"
#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>

@class ABI42_0_0REAModule;

typedef void (^ABI42_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI42_0_0REANativeAnimationOp)(ABI42_0_0RCTUIManager *uiManager);
typedef void (^ABI42_0_0REAEventHandler)(NSString *eventName, id<ABI42_0_0RCTEvent> event);

@interface ABI42_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI42_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI42_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI42_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI42_0_0RCTUIManager *)uiManager;

- (ABI42_0_0REANode* _Nullable)findNodeByID:(nonnull ABI42_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI42_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)registerEventHandler:(ABI42_0_0REAEventHandler)eventHandler;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI42_0_0ReactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (void)getValue:(ABI42_0_0REANodeID)nodeID
        callback:(ABI42_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI42_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI42_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI42_0_0REANodeID)parentID
             childID:(nonnull ABI42_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI42_0_0REANodeID)parentID
                childID:(nonnull ABI42_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI42_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI42_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI42_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI42_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;

- (NSString*)obtainProp:(nonnull NSNumber *)viewTag
          propName:(nonnull NSString *)propName;

// events

- (void)dispatchEvent:(id<ABI42_0_0RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

@end
