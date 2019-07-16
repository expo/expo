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

- (NSString *)appleIFV {
  if(NSClassFromString(@"UIDevice") && [UIDevice instancesRespondToSelector:@selector(identifierForVendor)]) {
    return [[UIDevice currentDevice].identifierForVendor UUIDString];
  }
  return nil;
}

- (NSString *) applicationName
{
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: [NSNull null];
}

- (NSString *) bundleId
{
  return [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"] ?: [NSNull null];
}

- (NSString *) appVersion
{
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"] ?: [NSNull null];
}

- (NSString *) buildVersion
{
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"]?: [NSNull null];
}


UM_EXPORT_METHOD_AS(getIosIdForVendorAsync, getIosIdForVendorAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSString* identifierForVendor = [self appleIFV];
  resolve(identifierForVendor);
}

UM_EXPORT_METHOD_AS(getFirstInstallTimeAsync, getFirstInstallTimeAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSURL* urlToDocumentsFolder = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
  __autoreleasing NSError *error;
  NSDate *installDate = [[[NSFileManager defaultManager] attributesOfItemAtPath:urlToDocumentsFolder.path error:&error] objectForKey:NSFileCreationDate];
  NSTimeInterval timeInMiliseconds = [installDate timeIntervalSince1970]*1000;
  NSNumber* timeInterval = @(timeInMiliseconds);
  resolve(timeInterval);
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"applicationName": [self applicationName],
           @"bundleId": [self bundleId],
           @"nativeAppVersion": [self appVersion],
           @"nativeBuildVersion": [self buildVersion],
           };
}

@end
