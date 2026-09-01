#if !TARGET_OS_MACCATALYST && EXPO_UNSTABLE_LOG_BOX

#import <objc/runtime.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBundleManager.h>
#import <React/RCTRedBox.h>
#import <React/RCTUtils.h>
#import "ExpoLogBox-Swift.h"

@implementation RCTRedBox (WithExpoLogBox)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class classs = [self class];

    SEL originalSelector = @selector(showErrorMessage:withParsedStack:isUpdate:errorCookie:);
    SEL swizzledSelector = @selector(showErrorMessageWithExpoLogBox:withParsedStack:isUpdate:errorCookie:);

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

- (void)showErrorMessageWithExpoLogBox:(NSString *)message
                       withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
                              isUpdate: (BOOL) isUpdate
                           errorCookie:(int)errorCookie {
  // Fatal JS errors are reported from the JS thread. The original RCTRedBox method dispatches
  // to the main queue internally, so this swizzled replacement must do the same before touching UIKit.
  // See: https://github.com/react/react-native/blob/11f9a7f4491eb1b01955298851d5a87a3bb311cc/packages/react-native/React/CoreModules/RCTRedBox.mm#L181-L185
  dispatch_async(dispatch_get_main_queue(), ^{
    NSURL *bundleURL = self.overrideBundleURL ?: self.bundleManager.bundleURL;
    UIViewController *expoRedBox = [ExpoLogBoxScreenProvider makeHostingControllerWithMessage:message
                                                                                       stack:stack
                                                                                   bundleURL:bundleURL];
    [RCTKeyWindow().rootViewController presentViewController:expoRedBox animated:YES completion:nil];
  });
}

@end

#endif
