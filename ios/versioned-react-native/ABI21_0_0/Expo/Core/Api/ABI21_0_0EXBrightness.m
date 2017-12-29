#import "ABI21_0_0EXBrightness.h"

#import <UIKit/UIKit.h>

@implementation ABI21_0_0EXBrightness

ABI21_0_0RCT_EXPORT_MODULE(ExponentBrightness);


ABI21_0_0RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  [UIScreen mainScreen].brightness = brightnessValue;
  resolve(nil);
}

ABI21_0_0RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@([UIScreen mainScreen].brightness));
}

@end
