//  Source: http://stackoverflow.com/a/3732812/1123156

#import "ABI15_0_0UIView+FindUIViewController.h"

@implementation UIView (FindUIViewController)

- (UIViewController *) firstAvailableUIViewController
{
  return (UIViewController *)[self traverseResponderChainForUIViewController];
}

- (id) traverseResponderChainForUIViewController
{
  id nextResponder = [self nextResponder];
  if ([nextResponder isKindOfClass:[UIViewController class]]) {
    return nextResponder;
  } else if ([nextResponder isKindOfClass:[UIView class]]) {
    return [nextResponder traverseResponderChainForUIViewController];
  } else {
    return nil;
  }
}

@end
