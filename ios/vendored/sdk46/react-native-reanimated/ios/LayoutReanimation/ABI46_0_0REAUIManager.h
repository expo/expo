#import <ABI46_0_0RNReanimated/ABI46_0_0REAAnimationsManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>
#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0REAUIManager : ABI46_0_0RCTUIManager
@property BOOL ABI46_0_0blockSetter;
- (void)setBridge:(ABI46_0_0RCTBridge *)bridge;
- (void)setUp:(ABI46_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI46_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
