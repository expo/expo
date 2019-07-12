#import <Foundation/Foundation.h>

#import "ABI31_0_0REANode.h"
#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>

@class ABI31_0_0REAModule;

typedef void (^ABI31_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI31_0_0REANativeAnimationOp)(ABI31_0_0RCTUIManager *uiManager);

@interface ABI31_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI31_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI31_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI31_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI31_0_0RCTUIManager *)uiManager;

- (ABI31_0_0REANode* _Nullable)findNodeByID:(nonnull ABI31_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI31_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ReactABI31_0_0Tag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;
- (void)getValue:(ABI31_0_0REANodeID)nodeID
        callback:(ABI31_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI31_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI31_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI31_0_0REANodeID)parentID
             childID:(nonnull ABI31_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI31_0_0REANodeID)parentID
                childID:(nonnull ABI31_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI31_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI31_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI31_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI31_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI31_0_0RCTEvent>)event;

@end
