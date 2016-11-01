#import "ABI11_0_0EXUtil.h"
#import "ABI11_0_0RCTUIManager.h"
#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTUtils.h"

@implementation ABI11_0_0EXUtil

+ (NSString *)moduleName { return @"ExponentUtil"; }

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI11_0_0RCT_EXPORT_METHOD(reload)
{
  [_bridge reload];
}

ABI11_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI11_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI11_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI11_0_0RCTErrorWithMessage(errMsg));
  }
}

@end
