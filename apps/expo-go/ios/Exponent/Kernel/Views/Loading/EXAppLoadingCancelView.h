#import <UIKit/UIKit.h>

@class EXAppLoadingCancelView;

@protocol EXAppLoadingCancelViewDelegate <NSObject>

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view;

@end

/**
 * This view should just be presented temporarily while manifest is being fetched.
 * Once manifest is fetched SplashScreen module should take care of the SplashScreen view.
 * This view shouldn't be visible in production mode.
 */
@interface EXAppLoadingCancelView : UIView

- (void)setDelegate:(id<EXAppLoadingCancelViewDelegate>)delegate;

/// The status text shown while loading (default: "Opening project...")
@property (nonatomic, copy) NSString *statusText;

/// Optional icon image to show instead of the spinner.
/// When set, the cancel button and internet advice are also hidden (for local loads).
@property (nonatomic, strong, nullable) UIImage *iconImage;

/// Minimum time (in seconds) the overlay should be visible before dismissing.
/// If hide is called before this elapses, it waits for the remainder. Default 0.
@property (nonatomic, assign) NSTimeInterval minimumDisplayDuration;

/// Fixed extra delay (in seconds) always added when dismissing, regardless of elapsed time. Default 0.
@property (nonatomic, assign) NSTimeInterval fixedDismissDelay;

/// Timestamp when the overlay was shown.
@property (nonatomic, assign) CFAbsoluteTime shownAt;

@end
