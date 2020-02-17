
#import <UIKit/UIKit.h>

@class EXLoadingProgress;

/**
 * This class is responsible for showing laoding progress on ManagedApp or HomeApp.
 * It is attached above the current UIViewController directly on UIWindow.
 */
@interface EXAppLoadingProgress : NSObject

/**
 * Instruct LoadingProgress to be visible on the screen.
 */
@property (nonatomic, assign) BOOL hidden;

- (void)updateStatusWithProgress:(EXLoadingProgress *)progress;

@end
