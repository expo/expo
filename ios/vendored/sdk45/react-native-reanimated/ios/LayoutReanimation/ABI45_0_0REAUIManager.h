#import <ABI45_0_0RNReanimated/ABI45_0_0REAAnimationsManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge+Private.h>
#import <ABI45_0_0React/ABI45_0_0RCTDefines.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0REAUIManager : ABI45_0_0RCTUIManager
@property BOOL ABI45_0_0blockSetter;
- (void)setBridge:(ABI45_0_0RCTBridge *)bridge;
- (void)setUp:(ABI45_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI45_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
