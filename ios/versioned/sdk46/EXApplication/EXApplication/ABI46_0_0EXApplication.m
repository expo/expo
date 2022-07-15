// Copyright 2018-present 650 Industries. All rights reserved.
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilities.h>
#import <ABI46_0_0EXApplication/ABI46_0_0EXApplication.h>
#import <UIKit/UIKit.h>
#import <ABI46_0_0EXApplication/ABI46_0_0EXProvisioningProfile.h>

@implementation ABI46_0_0EXApplication

ABI46_0_0EX_EXPORT_MODULE(ExpoApplication);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI46_0_0EX_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  resolve([[UIDevice currentDevice].identifierForVendor UUIDString]);
}

ABI46_0_0EX_EXPORT_METHOD_AS(getInstallationTimeAsync, getInstallationTimeAsyncWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
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

ABI46_0_0EX_EXPORT_METHOD_AS(getApplicationReleaseTypeAsync, getApplicationReleaseTypeAsyncWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  ABI46_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI46_0_0EXProvisioningProfile mainProvisioningProfile];
  resolve(@([mainProvisioningProfile appReleaseType]));
}

ABI46_0_0EX_EXPORT_METHOD_AS(getPushNotificationServiceEnvironmentAsync, getPushNotificationServiceEnvironmentAsyncWithResolver:(ABI46_0_0EXPromiseResolveBlock)resolve rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  ABI46_0_0EXProvisioningProfile *mainProvisioningProfile = [ABI46_0_0EXProvisioningProfile mainProvisioningProfile];
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
