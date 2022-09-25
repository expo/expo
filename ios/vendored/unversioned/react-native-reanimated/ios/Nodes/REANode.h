#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class REANodesManager;

typedef NSNumber *REANodeID;

@protocol REAFinalNode

- (void)update;

@end

@interface REAUpdateContext : NSObject
@property (nonatomic) NSString *callID;
@end

@interface REANode : NSObject

+ (void)runPropUpdates:(nonnull REAUpdateContext *)context;

- (instancetype)initWithID:(REANodeID)nodeID config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, nullable) REANodesManager *nodesManager;
@property (nonatomic, nullable) REAUpdateContext *updateContext;
@property (nonatomic, readonly, nonnull) REANodeID nodeID;

- (_Nullable id)evaluate;
- (_Nullable id)value;
- (void)markUpdated;

- (void)addChild:(REANode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(REANode *)child NS_REQUIRES_SUPER;

- (void)dangerouslyRescheduleEvaluate;
- (void)forceUpdateMemoizedValue:(id)value;

- (void)onDrop;

@end
