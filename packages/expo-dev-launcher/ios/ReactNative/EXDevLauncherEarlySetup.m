// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBundleURLProvider.h>
#import <objc/runtime.h>

// It swizzles RCTBundleURLProvider.guessPackagerHost to prevent early network requests
// that would trigger the local network permission dialog before we're ready.

@interface RCTBundleURLProvider (EXDevLauncherEarlySetup)
@end

@implementation RCTBundleURLProvider (EXDevLauncherEarlySetup)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [RCTBundleURLProvider class];
    
    SEL original = @selector(guessPackagerHost);
    SEL swizzled = @selector(EXDevLauncher_early_guessPackagerHost);
    
    Method originalMethod = class_getInstanceMethod(class, original);
    Method swizzledMethod = class_getInstanceMethod(class, swizzled);
    
    if (originalMethod && swizzledMethod) {
      method_exchangeImplementations(originalMethod, swizzledMethod);
    }
  });
}

- (NSString *)EXDevLauncher_early_guessPackagerHost {
  return nil;
}

@end
