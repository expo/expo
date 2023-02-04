#import <ABI48_0_0RNReanimated/ABI48_0_0REAAnimationsManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0REAUIManager : ABI48_0_0RCTUIManager
@property BOOL ABI48_0_0blockSetter;
- (void)setBridge:(ABI48_0_0RCTBridge *)bridge;
- (void)setUp:(ABI48_0_0REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<ABI48_0_0RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
