#import "ABI22_0_0EXBrightness.h"

#import <UIKit/UIKit.h>

@implementation ABI22_0_0EXBrightness

ABI22_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI22_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  [UIScreen mainScreen].brightness = brightnessValue;
  resolve(nil);
}

ABI22_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI22_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI22_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@([UIScreen mainScreen].brightness));
}

@end
