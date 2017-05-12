#import "ABI17_0_0EXUtil.h"
#import "ABI17_0_0EXUnversioned.h"
#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

@implementation ABI17_0_0EXUtil

ABI17_0_0RCT_EXPORT_MODULE(ExponentUtil);

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI17_0_0RCT_EXPORT_METHOD(reload)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelRefreshForegroundTaskNotification"
                                                      object:nil
                                                    userInfo:@{
                                                               @"bridge": self.bridge
                                                               }];
}

ABI17_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI17_0_0RCTErrorWithMessage(errMsg));
  }
}

@end
