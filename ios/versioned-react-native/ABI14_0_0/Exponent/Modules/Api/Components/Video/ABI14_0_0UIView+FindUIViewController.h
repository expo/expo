//  Source: http://stackoverflow.com/a/3732812/1123156

#import <UIKit/UIKit.h>

@interface UIView (FindUIViewController)

- (UIViewController *) firstAvailableUIViewController;
- (id) traverseResponderChainForUIViewController;

@end
