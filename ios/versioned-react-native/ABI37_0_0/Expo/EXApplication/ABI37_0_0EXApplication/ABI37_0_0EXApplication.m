// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>
#import <ABI37_0_0EXApplication/ABI37_0_0EXApplication.h>
#import <UIKit/UIKit.h>
#import <ABI37_0_0EXApplication/ABI37_0_0EXProvisioningProfile.h>

@implementation ABI37_0_0EXApplication

ABI37_0_0UM_EXPORT_MODULE(ExpoApplication);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI37_0_0UM_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve([[UIDevice currentDevice].identifierForVendor UUIDString]);
}

ABI37_0_0UM_EXPORT_METHOD_AS(getInstallationTimeAsync, getInstallationTimeAsyncWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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

ABI37_0_0UM_EXPORT_METHOD_AS(getApplicationReleaseTypeAsync, getApplicationReleaseTypeAsyncWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  ABI37_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI37_0_0EXProvisioningProfile mainProvisioningProfile];
  resolve(@([mainProvisioningProfile appReleaseType]));
}

ABI37_0_0UM_EXPORT_METHOD_AS(getPushNotificationServiceEnvironmentAsync, getPushNotificationServiceEnvironmentAsyncWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  ABI37_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI37_0_0EXProvisioningProfile mainProvisioningProfile];
  resolve([mainProvisioningProfile notificationServiceEnvironment]);
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
