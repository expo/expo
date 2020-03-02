#import <Foundation/Foundation.h>

#import "ABI37_0_0REANode.h"
#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>

@class ABI37_0_0REAModule;

typedef void (^ABI37_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI37_0_0REANativeAnimationOp)(ABI37_0_0RCTUIManager *uiManager);

@interface ABI37_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI37_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI37_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI37_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI37_0_0RCTUIManager *)uiManager;

- (ABI37_0_0REANode* _Nullable)findNodeByID:(nonnull ABI37_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI37_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ABI37_0_0ReactTag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;
- (void)getValue:(ABI37_0_0REANodeID)nodeID
        callback:(ABI37_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI37_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI37_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI37_0_0REANodeID)parentID
             childID:(nonnull ABI37_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI37_0_0REANodeID)parentID
                childID:(nonnull ABI37_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI37_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI37_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI37_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI37_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI37_0_0RCTEvent>)event;

- (void)setValueForNodeID:(nonnull NSNumber *)nodeID value:(nonnull NSNumber *)newValue;

@end
