#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class ABI32_0_0REANodesManager;

typedef NSNumber* ABI32_0_0REANodeID;

@protocol ABI32_0_0REAFinalNode

- (void)update;

@end

@interface ABI32_0_0REAUpdateContext : NSObject
@end

@interface ABI32_0_0REANode : NSObject

+ (void)runPropUpdates:(nonnull ABI32_0_0REAUpdateContext *)context;

- (instancetype)initWithID:(ABI32_0_0REANodeID)nodeID
                    config:(NSDictionary<NSString *, id> *)config NS_DESIGNATED_INITIALIZER;

@property (nonatomic, weak, nullable) ABI32_0_0REANodesManager *nodesManager;
@property (nonatomic, nullable) ABI32_0_0REAUpdateContext *updateContext;
@property (nonatomic, readonly, nonnull) ABI32_0_0REANodeID nodeID;

- (_Nullable id)evaluate;
- (_Nullable id)value;
- (void)markUpdated;

- (void)addChild:(ABI32_0_0REANode *)child NS_REQUIRES_SUPER;
- (void)removeChild:(ABI32_0_0REANode *)child NS_REQUIRES_SUPER;

- (void)dangerouslyRescheduleEvaluate;
- (void)forceUpdateMemoizedValue:(id)value;

@end
