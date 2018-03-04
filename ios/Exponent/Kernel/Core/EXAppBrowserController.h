#import "EXKernelAppRegistry.h"

NS_ASSUME_NONNULL_BEGIN

@protocol EXAppBrowserController <NSObject>

- (void)moveAppToVisible:(EXKernelAppRecord *)appRecord;
- (void)moveHomeToVisible;
- (void)refreshVisibleApp;
- (void)toggleMenu;
- (void)setIsMenuVisible:(BOOL)isMenuVisible;
- (void)showDiagnostics;
- (void)showQRReader;
- (void)addHistoryItemWithUrl:(NSURL *)manifestUrl manifest:(NSDictionary *)manifest;
- (void)getHistoryUrlForExperienceId:(NSString *)experienceId completion:(void (^)(NSString * _Nullable))completion;

@end

NS_ASSUME_NONNULL_END
