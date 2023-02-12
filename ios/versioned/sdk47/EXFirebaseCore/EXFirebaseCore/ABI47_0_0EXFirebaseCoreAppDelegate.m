// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXFirebaseCore/ABI47_0_0EXFirebaseCoreAppDelegate.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>
#import <Firebase/Firebase.h>

@implementation ABI47_0_0EXFirebaseCoreAppDelegate

ABI47_0_0EX_REGISTER_SINGLETON_MODULE(ABI47_0_0EXFirebaseCoreAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Only auto configure Firebase if the main AppDelegate hasn't already configured it.
  // We provide no interface for customizing this app's Firebase configuration.
  // Instead, the user should expect the default app to use a `GoogleService-Info.plist` file,
  // alternatively they can also setup the default app first.
  if ([FIRApp defaultApp] == nil) {
    NSString *plistFile = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
    if (plistFile) {
      [FIRApp configure];
    }
  }
  return YES;
}

@end
