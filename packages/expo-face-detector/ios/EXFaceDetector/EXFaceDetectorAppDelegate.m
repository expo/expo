// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXFaceDetector/EXFaceDetectorAppDelegate.h>
#import <UMCore/UMAppDelegateWrapper.h>
#import <Firebase/Firebase.h>
#import <UMCore/UMDefines.h>

@implementation EXFaceDetectorAppDelegate

UM_REGISTER_SINGLETON_MODULE(EXFaceDetectorAppDelegate)

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary *)launchOptions
{
  NSString* googleServicesPlist = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  NSLog(googleServicesPlist);
  NSLog(@"googgleServiceFile.plist");
  NSLog([FIRApp defaultApp] == nil  ? @"true": @"flase");
  NSLog([[NSFileManager defaultManager] fileExistsAtPath:googleServicesPlist] ? @"true": @"flase");
  if ([FIRApp defaultApp] == nil && [[NSFileManager defaultManager] fileExistsAtPath:googleServicesPlist]) {
    NSLog(@"FIRApp configure");
    [FIRApp configure];
  }
  return NO;
}

@end
