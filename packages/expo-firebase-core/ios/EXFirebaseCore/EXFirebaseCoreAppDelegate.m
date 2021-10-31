// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXFirebaseCore/EXFirebaseCoreAppDelegate.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <Firebase/Firebase.h>

@implementation EXFirebaseCoreAppDelegate

EX_REGISTER_SINGLETON_MODULE(EXFirebaseCoreAppDelegate)

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
