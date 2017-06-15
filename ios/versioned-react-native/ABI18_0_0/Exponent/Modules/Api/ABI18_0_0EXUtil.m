#import "ABI18_0_0EXUtil.h"
#import "ABI18_0_0EXUnversioned.h"
#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>
#import <ReactABI18_0_0/ABI18_0_0RCTBridge.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>

@implementation ABI18_0_0EXUtil

ABI18_0_0RCT_EXPORT_MODULE(ExponentUtil);

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI18_0_0RCT_EXPORT_METHOD(reload)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelRefreshForegroundTaskNotification"
                                                      object:nil
                                                    userInfo:@{
                                                               @"bridge": self.bridge
                                                               }];
}

ABI18_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI18_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI18_0_0RCT_REMAP_METHOD(getCurrentDeviceCountryAsync,
                 getCurrentDeviceCountryWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  NSString *countryCode = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  if (countryCode) {
    resolve(countryCode);
  } else {
    NSString *errMsg = @"This device does not indicate its country";
    reject(@"E_NO_DEVICE_COUNTRY", errMsg, ABI18_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI18_0_0RCT_REMAP_METHOD(getCurrentTimeZoneAsync,
                 getCurrentTimeZoneWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  if (currentTimeZone) {
    resolve(currentTimeZone.name);
  } else {
    NSString *errMsg = @"Unable to determine the device's time zone";
    reject(@"E_NO_DEVICE_TIMEZONE", errMsg, ABI18_0_0RCTErrorWithMessage(errMsg));
  }
}

@end
