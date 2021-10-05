// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

#import <objc/runtime.h>
#import <EXDevLauncher/EXDevLauncher.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXManifests/EXManifestsManifest.h>
#import <EXManifests/EXManifestsManifestFactory.h>

@interface EXDevLauncherController (EXDevLauncherModuleTests)

- (EXManifestsManifest * _Nullable)mockAppManifest;
- (NSURL *)mockAppManifestURL;

@end

@implementation EXDevLauncherController (EXDevLauncherModuleTests)

- (EXManifestsManifest * _Nullable)mockAppManifest
{
  return [EXManifestsManifestFactory manifestForManifestJSON:@{
    @"name": @"testproject",
    @"slug": @"testproject",
    @"version": @"1.0.0",
    @"sdkVersion": @"42.0.0",
    @"bundleUrl": @"http://test.io/bundle.js"
  }];
}

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

- (void)testConstantsToExportManifest
{
  [self swizzleMethodForClass:[EXDevLauncherController class]
             originalSelector:@selector(appManifest)
             swizzledSelector:@selector(mockAppManifest)];

  EXDevLauncher *module = [EXDevLauncher new];
  NSDictionary *constants = [module constantsToExport];

  NSDictionary *expected = @{
    @"name": @"testproject",
    @"slug": @"testproject",
    @"version": @"1.0.0",
    @"sdkVersion": @"42.0.0",
    @"bundleUrl": @"http://test.io/bundle.js"
  };
  NSDictionary *actual = [NSJSONSerialization JSONObjectWithData:[constants[@"manifestString"] dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:NULL];
  XCTAssertEqualObjects(expected, actual);

  // clean up
  [self swizzleMethodForClass:[EXDevLauncherController class]
             originalSelector:@selector(appManifest)
             swizzledSelector:@selector(mockAppManifest)];
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
