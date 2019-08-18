#import "EXKernelAppRegistry.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppBrowserController <NSObject>

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)moveHomeToVisible;
- (void)refreshVisibleApp;
- (void)toggleMenuWithCompletion:(void (^ _Nullable)(void))completion;
- (void)setIsMenuVisible:(BOOL)isMenuVisible completion:(void (^ _Nullable)(void))completion;
- (void)showDiagnostics;
- (void)showQRReader;
- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(NSDictionary *)manifest;
- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString * _Nullable))completion;
- (BOOL)isNuxFinished;
- (void)setIsNuxFinished:(BOOL)isFinished;
- (void)appDidFinishLoadingSuccessfully:(EXKernelAppRecord *)appRecord;

@end

NS_ASSUME_NONNULL_END
