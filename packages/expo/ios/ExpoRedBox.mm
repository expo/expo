#import <objc/runtime.h>
#import <React/RCTRedBox.h>
#import "Expo-Swift.h"

@implementation RCTRedBox (Swizzling)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class classs = [self class];

    SEL originalSelector = @selector(showErrorMessage:);
    SEL swizzledSelector = @selector(my_showErrorMessage:);

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

- (void)my_showErrorMessage:(NSString *)message {
  // Call original (because of swizzling)
  // [self my_showErrorMessage:message];

  // Custom behavior
  NSLog(@"[Swizzled RCTRedBox] Intercepted error: %@", message);
    
  UIViewController *vc = [SwiftUIScreenProvider makeHostingController];
  [RCTKeyWindow().rootViewController presentViewController:vc animated:YES completion:nil];
}

@end
