
#import <UIKit/UIKit.h>

@class EXMenuViewController;

@protocol EXMenuDelegate <NSObject>

- (void)menuViewControllerDidSelectHome:(EXMenuViewController *)menuVC;
- (void)menuViewControllerDidSelectRefresh:(EXMenuViewController *)menuVC;

@end

@interface EXMenuViewController : UIViewController

@property (nonatomic, assign) id<EXMenuDelegate> delegate;

@end
