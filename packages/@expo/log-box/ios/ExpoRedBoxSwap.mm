#import <objc/runtime.h>
#import <React/RCTRedBox.h>
#import <React/RCTUtils.h>
#import "ExpoLogBox-Swift.h"

@implementation RCTRedBox (WithExpoLogBox)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class classs = [self class];

    SEL originalSelector = @selector(showErrorMessage:);
    SEL swizzledSelector = @selector(showErrorMessageWithExpoLogBox:);

    Method originalMethod = class_getInstanceMethod(classs, originalSelector);
    Method swizzledMethod = class_getInstanceMethod(classs, swizzledSelector);

    BOOL didAddMethod =
      class_addMethod(classs,
                      originalSelector,
                      method_getImplementation(swizzledMethod),
                      method_getTypeEncoding(swizzledMethod));

    if (didAddMethod) {
      class_replaceMethod(classs,
                          swizzledSelector,
                          method_getImplementation(originalMethod),
                          method_getTypeEncoding(originalMethod));
    } else {
      method_exchangeImplementations(originalMethod, swizzledMethod);
    }
  });
}

- (void)showErrorMessageWithExpoLogBox:(NSString *)message {
  UIViewController *expoRedBox = [ExpoLogBoxScreenProvider makeHostingControllerWithMessage:message];
  [RCTKeyWindow().rootViewController presentViewController:expoRedBox animated:YES completion:nil];
}

@end
