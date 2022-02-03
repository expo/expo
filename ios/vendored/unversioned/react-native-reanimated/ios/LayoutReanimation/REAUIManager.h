#import <React/RCTBridge+Private.h>
#import <React/RCTDefines.h>
#import <React/RCTUIManager.h>
#import "REAAnimationsManager.h"

NS_ASSUME_NONNULL_BEGIN

@interface REAUIManager : RCTUIManager
@property BOOL blockSetter;
- (void)setBridge:(RCTBridge *)bridge;
- (void)setUp:(REAAnimationsManager *)animationsManager;
- (void)unregisterView:(id<RCTComponent>)view;
@property (nonatomic, copy) void (^flushUiOperations)();
@end

NS_ASSUME_NONNULL_END
