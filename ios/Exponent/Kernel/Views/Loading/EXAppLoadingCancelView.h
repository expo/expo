#import <UIKit/UIKit.h>

@class EXAppLoadingCancelView;

@protocol EXAppLoadingCancelViewDelegate <NSObject>

- (void)appLoadingCancelViewDidCancel:(EXAppLoadingCancelView *)view;

@end

@interface EXAppLoadingCancelView : UIView

@property (nonatomic, assign) id<EXAppLoadingCancelViewDelegate> delegate;

@end
