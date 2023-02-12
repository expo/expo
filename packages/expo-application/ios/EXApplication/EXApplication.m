// Copyright 2018-present 650 Industries. All rights reserved.
#import <ExpoModulesCore/EXUtilities.h>
#import <EXApplication/EXApplication.h>
#import <UIKit/UIKit.h>
#import <EXApplication/EXProvisioningProfile.h>

@implementation EXApplication

EX_EXPORT_MODULE(ExpoApplication);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

EX_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  resolve([[UIDevice currentDevice].identifierForVendor UUIDString]);
}

EX_EXPORT_METHOD_AS(getInstallationTimeAsync, getInstallationTimeAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(getApplicationReleaseTypeAsync, getApplicationReleaseTypeAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  EXProvisioningProfile *mainProvisioningProfile = [EXProvisioningProfile mainProvisioningProfile];
  resolve(@([mainProvisioningProfile appReleaseType]));
}

EX_EXPORT_METHOD_AS(getPushNotificationServiceEnvironmentAsync, getPushNotificationServiceEnvironmentAsyncWithResolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject)
{
  EXProvisioningProfile *mainProvisioningProfile = [EXProvisioningProfile mainProvisioningProfile];
  resolve(EXNullIfNil([mainProvisioningProfile notificationServiceEnvironment]));
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
