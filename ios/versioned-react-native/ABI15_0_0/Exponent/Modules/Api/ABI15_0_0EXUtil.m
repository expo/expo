#import "ABI15_0_0EXUtil.h"
#import "ABI15_0_0EXUnversioned.h"
#import <ReactABI15_0_0/ABI15_0_0RCTUIManager.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUtils.h>

@implementation ABI15_0_0EXUtil

ABI15_0_0RCT_EXPORT_MODULE(ExponentUtil);

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI15_0_0RCT_EXPORT_METHOD(reload)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelRefreshForegroundTaskNotification"
                                                      object:nil
                                                    userInfo:@{
                                                               @"bridge": self.bridge
                                                               }];
}

ABI15_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI15_0_0RCTErrorWithMessage(errMsg));
  }
}

@end
