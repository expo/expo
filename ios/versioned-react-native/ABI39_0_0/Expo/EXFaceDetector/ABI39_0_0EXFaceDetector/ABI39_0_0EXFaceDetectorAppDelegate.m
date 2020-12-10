// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXFaceDetector/ABI39_0_0EXFaceDetectorAppDelegate.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMAppDelegateWrapper.h>
#import <Firebase/Firebase.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMDefines.h>

@implementation ABI39_0_0EXFaceDetectorAppDelegate

ABI39_0_0UM_REGISTER_SINGLETON_MODULE(ABI39_0_0EXFaceDetectorAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  NSString *googleServicesPlist = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  if (![FIRApp defaultApp] && [[NSFileManager defaultManager] fileExistsAtPath:googleServicesPlist]) {
    [FIRApp configure];
  }
  return NO;
}

@end
