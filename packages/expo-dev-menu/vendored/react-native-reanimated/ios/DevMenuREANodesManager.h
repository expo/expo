#import <Foundation/Foundation.h>
#import "DevMenuREANode.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

@class DevMenuREAModule;

typedef void (^DevMenuREAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^DevMenuREANativeAnimationOp)(RCTUIManager *uiManager);
typedef void (^DevMenuREAEventHandler)(NSString *eventName, id<RCTEvent> event);

@interface DevMenuREANodesManager : NSObject

@property (nonatomic, weak, nullable) RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) DevMenuREAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(DevMenuREAModule *)reanimatedModule uiManager:(nonnull RCTUIManager *)uiManager;

- (DevMenuREANode *_Nullable)findNodeByID:(nonnull DevMenuREANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(DevMenuREAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)registerEventHandler:(DevMenuREAEventHandler)eventHandler;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)reactTag
                               viewName:(NSString *)viewName
                            nativeProps:(NSMutableDictionary *)nativeProps
                       trySynchronously:(BOOL)trySync;
- (void)getValue:(DevMenuREANodeID)nodeID callback:(RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull DevMenuREANodeID)tag config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull DevMenuREANodeID)tag;

- (void)connectNodes:(nonnull DevMenuREANodeID)parentID childID:(nonnull DevMenuREANodeID)childID;

- (void)disconnectNodes:(nonnull DevMenuREANodeID)parentID childID:(nonnull DevMenuREANodeID)childID;

- (void)connectNodeToView:(nonnull DevMenuREANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull DevMenuREANodeID)nodeID viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull DevMenuREANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull DevMenuREANodeID)eventNodeID;

// configuration

- (void)configureUiProps:(nonnull NSSet<NSString *> *)uiPropsSet
          andNativeProps:(nonnull NSSet<NSString *> *)nativePropsSet;

- (void)updateProps:(nonnull NSDictionary *)props
      ofViewWithTag:(nonnull NSNumber *)viewTag
           withName:(nonnull NSString *)viewName;

- (NSString *)obtainProp:(nonnull NSNumber *)viewTag propName:(nonnull NSString *)propName;

// events

- (void)dispatchEvent:(id<RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

- (void)maybeFlushUpdateBuffer;

@end
