// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUtilities.h>
#import <ABI48_0_0EXApplication/ABI48_0_0EXApplication.h>
#import <UIKit/UIKit.h>
#import <ABI48_0_0EXApplication/ABI48_0_0EXProvisioningProfile.h>

@implementation ABI48_0_0EXApplication

ABI48_0_0EX_EXPORT_MODULE(ExpoApplication);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI48_0_0EX_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(ABI48_0_0EXPromiseResolveBlock)resolve rejecter:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  resolve([[UIDevice currentDevice].identifierForVendor UUIDString]);
}

ABI48_0_0EX_EXPORT_METHOD_AS(getInstallationTimeAsync, getInstallationTimeAsyncWithResolver:(ABI48_0_0EXPromiseResolveBlock)resolve rejecter:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  NSURL *urlToDocumentsFolder = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
  NSError *error = nil;
  NSDate *installDate = [[[NSFileManager defaultManager] attributesOfItemAtPath:urlToDocumentsFolder.path error:&error] objectForKey:NSFileCreationDate];
  if (error) {
    reject(@"ERR_APPLICATION", @"Unable to get installation time of this application.", error);
  } else {
    NSTimeInterval timeInMilliseconds = [installDate timeIntervalSince1970] * 1000;
    NSNumber *timeNumber = @(timeInMilliseconds);
    resolve(timeNumber);
  }
}

ABI48_0_0EX_EXPORT_METHOD_AS(getApplicationReleaseTypeAsync, getApplicationReleaseTypeAsyncWithResolver:(ABI48_0_0EXPromiseResolveBlock)resolve rejecter:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  ABI48_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI48_0_0EXProvisioningProfile mainProvisioningProfile];
  resolve(@([mainProvisioningProfile appReleaseType]));
}

ABI48_0_0EX_EXPORT_METHOD_AS(getPushNotificationServiceEnvironmentAsync, getPushNotificationServiceEnvironmentAsyncWithResolver:(ABI48_0_0EXPromiseResolveBlock)resolve rejecter:(ABI48_0_0EXPromiseRejectBlock)reject)
{
  ABI48_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI48_0_0EXProvisioningProfile mainProvisioningProfile];
  resolve(ABI48_0_0EXNullIfNil([mainProvisioningProfile notificationServiceEnvironment]));
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"applicationName": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: [NSNull null],
           @"applicationId": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"] ?: [NSNull null],
           @"nativeApplicationVersion": [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"] ?: [NSNull null],
           @"nativeBuildVersion": [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"]?: [NSNull null],
           };
}

@end
