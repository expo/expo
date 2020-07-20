#import <UIKit/UIKit.h>

@class EXAppLoadingCancelView;

@protocol EXAppLoadingCancelViewDelegate <NSObject>

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view;

@end

/**
 * This view is used to inform about loading manifest for managed workflow application.
 * Once manifest is loaded, SplashScreen module & EXAppLoadingWindowController take care of the rest.
 */
@interface EXAppLoadingCancelView : UIView

@property (nonatomic, assign) id<EXAppLoadingCancelViewDelegate> delegate;

@end
