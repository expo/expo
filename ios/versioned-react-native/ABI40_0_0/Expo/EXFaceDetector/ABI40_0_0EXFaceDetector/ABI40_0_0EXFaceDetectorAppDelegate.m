// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXFaceDetector/ABI40_0_0EXFaceDetectorAppDelegate.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppDelegateWrapper.h>
#import <Firebase/Firebase.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMDefines.h>

@implementation ABI40_0_0EXFaceDetectorAppDelegate

ABI40_0_0UM_REGISTER_SINGLETON_MODULE(ABI40_0_0EXFaceDetectorAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  NSString *googleServicesPlist = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (![FIRApp defaultApp] && [[NSFileManager defaultManager] fileExistsAtPath:googleServicesPlist]) {
    [FIRApp configure];
  }
  return NO;
}

@end
