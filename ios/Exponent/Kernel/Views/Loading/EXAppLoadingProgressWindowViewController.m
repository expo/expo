#import "EXAppLoadingProgressWindowViewController.h"
#import "EXKernel.h"
#import "EXAppViewController.h"

@implementation EXAppLoadingProgressWindowViewController

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  const UIInterfaceOrientationMask visibleAppSupportedInterfaceOrientations =
    [EXKernel sharedInstance]
      .visibleApp
      .viewController
      .supportedInterfaceOrientations;
  return visibleAppSupportedInterfaceOrientations;
}

@end
