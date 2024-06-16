#import <UIKit/UIKit.h>
#import "EXAbstractLoader.h"
#import "EXResourceLoader.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This class is responsible for presenting loading progress of an application.
 * It mounts separate UIWindow above whole app and presents loading progress in it.
 */
@interface EXAppLoadingProgressWindowController : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithEnabled:(BOOL)enabled;

- (void)show;
- (void)hide;
- (void)updateStatusWithProgress:(EXLoadingProgress *)progress;
- (void)updateStatus:(EXAppLoaderRemoteUpdateStatus)status;

@end


NS_ASSUME_NONNULL_END
