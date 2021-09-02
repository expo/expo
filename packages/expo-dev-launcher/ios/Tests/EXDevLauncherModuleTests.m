// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

#import <objc/runtime.h>
#import <EXDevLauncher/EXDevLauncher.h>
#import <EXDevLauncher/EXDevLauncherController.h>

@interface EXDevLauncherController (EXDevLauncherModuleTests)

- (NSURL *)mockAppManifestURL;

@end

@implementation EXDevLauncherController (EXDevLauncherModuleTests)

- (NSURL *)mockAppManifestURL
{
  return [NSURL URLWithString:@"https://exp.host/@test/test?query=param"];
}

@end

@interface EXDevLauncherModuleTests : XCTestCase

@end

@implementation EXDevLauncherModuleTests

// https://nshipster.com/method-swizzling/
- (void)swizzleMethodForClass:(Class)class
             originalSelector:(SEL)originalSelector
             swizzledSelector:(SEL)swizzledSelector
{
  Method originalMethod = class_getInstanceMethod(class, originalSelector);
  Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

  BOOL didAddMethod =
  class_addMethod(class,
                  originalSelector,
                  method_getImplementation(swizzledMethod),
                  method_getTypeEncoding(swizzledMethod));

  if (didAddMethod) {
    class_replaceMethod(class,
                        swizzledSelector,
                        method_getImplementation(originalMethod),
                        method_getTypeEncoding(originalMethod));
  } else {
    method_exchangeImplementations(originalMethod, swizzledMethod);
  }
}

- (void)testConstantsToExportManifestURL
{
  // used by snack

  [self swizzleMethodForClass:[EXDevLauncherController class]
             originalSelector:@selector(appManifestURL)
             swizzledSelector:@selector(mockAppManifestURL)];

  EXDevLauncher *module = [EXDevLauncher new];
  NSDictionary *constants = [module constantsToExport];
  XCTAssertEqualObjects(@"https://exp.host/@test/test?query=param", constants[@"manifestURL"]);

  // clean up
  [self swizzleMethodForClass:[EXDevLauncherController class]
             originalSelector:@selector(appManifestURL)
             swizzledSelector:@selector(mockAppManifestURL)];
}

@end
