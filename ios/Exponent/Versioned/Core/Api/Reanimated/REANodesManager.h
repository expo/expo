#import <Foundation/Foundation.h>

#import "REANode.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTUIManager.h>

@class REAModule;

typedef void (^REAOnAnimationCallback)(CADisplayLink *displayLink);

@interface REANodesManager : NSObject

@property (nonatomic, weak, nullable) RCTUIManager *uiManager;
@property (nonatomic, weak, nullable) REAModule *reanimatedModule;
@property (nonatomic, readonly) CFTimeInterval currentAnimationTimestamp;

@property (nonatomic, nullable) NSSet<NSString *> *nativeProps;

- (nonnull instancetype)initWithModule:(REAModule *)reanimatedModule
                             uiManager:(nonnull RCTUIManager *)uiManager;

- (REANode* _Nullable)findNodeByID:(nonnull REANodeID)nodeID;

- (void)invalidate;

//

- (void)postOnAnimation:(REAOnAnimationCallback)clb;
- (void)postRunUpdatesAfterAnimation;

// graph

- (void)createNode:(nonnull REANodeID)tag
            config:(NSDictionary<NSString *, id> *__nonnull)config;

- (void)dropNode:(nonnull REANodeID)tag;

- (void)connectNodes:(nonnull REANodeID)parentID
             childID:(nonnull REANodeID)childID;

- (void)disconnectNodes:(nonnull REANodeID)parentID
                childID:(nonnull REANodeID)childID;

- (void)connectNodeToView:(nonnull REANodeID)nodeID
                  viewTag:(nonnull NSNumber *)viewTag
                 viewName:(nonnull NSString *)viewName;

- (void)disconnectNodeFromView:(nonnull REANodeID)nodeID
                       viewTag:(nonnull NSNumber *)viewTag;

- (void)attachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

- (void)detachEvent:(nonnull NSNumber *)viewTag
          eventName:(nonnull NSString *)eventName
        eventNodeID:(nonnull REANodeID)eventNodeID;

// configuration

- (void)configureNativeProps:(nonnull NSSet<NSString *> *)nativeProps;

// events

- (void)dispatchEvent:(id<RCTEvent>)event;

@end
