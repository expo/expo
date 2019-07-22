// Copyright 2018-present 650 Industries. All rights reserved.
#import <UMCore/UMUtilities.h>
#import <EXApplication/EXApplication.h>
#import <UIKit/UIKit.h>

@interface EXApplication ()


@end

@implementation EXApplication

UM_EXPORT_MODULE(ExpoApplication);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

UM_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  if(NSClassFromString(@"UIDevice") && [UIDevice instancesRespondToSelector:@selector(identifierForVendor)]) {
    resolve([[UIDevice currentDevice].identifierForVendor UUIDString]);
  }
  else{
    resolve([NSNull null]);
  }
}

UM_EXPORT_METHOD_AS(getFirstInstallTimeAsync, getFirstInstallTimeAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSURL* urlToDocumentsFolder = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
  NSError *error = nil;
  NSDate *firstInstallDate = [[[NSFileManager defaultManager] attributesOfItemAtPath:urlToDocumentsFolder.path error:&error] objectForKey:NSFileCreationDate];
  if(error){
    reject(@"ERR_APPLICATION", @"Unable to get first install time of this application.", error);
  }
  NSTimeInterval timeInMiliseconds = [firstInstallDate timeIntervalSince1970] * 1000;
  NSNumber* timeInterval = @(timeInMiliseconds);
  resolve(timeInterval);
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"applicationName": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: [NSNull null],
           @"bundleId": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"] ?: [NSNull null],
           @"nativeApplicationVersion": [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"] ?: [NSNull null],
           @"nativeBuildVersion": [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"]?: [NSNull null],
           };
}

@end
