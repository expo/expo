#import <UIKit/UIKit.h>

#import "AppDelegate.h"

@import EXDevMenu;

@interface DevMenuDetoxTestInterceptor : NSObject<DevMenuTestInterceptor>

@end

@implementation DevMenuDetoxTestInterceptor

- (BOOL)isOnboardingFinishedKey
{
  return YES;
}

- (BOOL)shouldShowAtLaunch
{
  return NO;
}

@end

int main(int argc, char * argv[]) {
  @autoreleasepool {
    [DevMenuTestInterceptorManager setTestInterceptor:[DevMenuDetoxTestInterceptor new]];
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}

