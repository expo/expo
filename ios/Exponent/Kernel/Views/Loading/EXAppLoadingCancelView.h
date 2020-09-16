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

@end
