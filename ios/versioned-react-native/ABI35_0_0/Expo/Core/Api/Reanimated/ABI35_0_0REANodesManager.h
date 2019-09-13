#import <Foundation/Foundation.h>

#import "ABI35_0_0REANode.h"
#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>

@class ABI35_0_0REAModule;

typedef void (^ABI35_0_0REAOnAnimationCallback)(CADisplayLink *displayLink);
typedef void (^ABI35_0_0REANativeAnimationOp)(ABI35_0_0RCTUIManager *uiManager);

@interface ABI35_0_0REANodesManager : NSObject

@property (nonatomic, weak, nullable) ABI35_0_0RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) ABI35_0_0REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *uiProps;
@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(ABI35_0_0REAModule *)reanimatedModule
                             uiManager:(nonnull ABI35_0_0RCTUIManager *)uiManager;

- (ABI35_0_0REANode* _Nullable)findNodeByID:(nonnull ABI35_0_0REANodeID)nodeID;

- (void)invalidate;

- (void)operationsBatchDidComplete;

//

- (void)postOnAnimation:(ABI35_0_0REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;
- (void)enqueueUpdateViewOnNativeThread:(nonnull NSNumber *)ReactABI35_0_0Tag
                               viewName:(NSString *) viewName
                            nativeProps:(NSMutableDictionary *)nativeProps;
- (void)getValue:(ABI35_0_0REANodeID)nodeID
        callback:(ABI35_0_0RCTResponseSenderBlock)callback;

// graph

- (void)createNode:(nonnull ABI35_0_0REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull ABI35_0_0REANodeID)tag;

- (void)connectNodes:(nonnull ABI35_0_0REANodeID)parentID
             childID:(nonnull ABI35_0_0REANodeID)childID;

- (void)disconnectNodes:(nonnull ABI35_0_0REANodeID)parentID
                childID:(nonnull ABI35_0_0REANodeID)childID;

- (void)connectNodeToView:(nonnull ABI35_0_0REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull ABI35_0_0REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI35_0_0REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull ABI35_0_0REANodeID)eventNodeID;

// configuration

- (void)configureProps:(nonnull NSSet<NSString *> *)nativeProps
               uiProps:(nonnull NSSet<NSString *> *)uiProps;

// events

- (void)dispatchEvent:(id<ABI35_0_0RCTEvent>)event;

@end
