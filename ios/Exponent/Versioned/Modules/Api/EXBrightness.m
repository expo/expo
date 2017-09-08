#import "EXBrightness.h"

#import <UIKit/UIKit.h>

@implementation EXBrightness

RCT_EXPORT_MODULE(ExponentBrightness);


RCT_EXPORT_METHOD(setBrightnessAsync:
                  (float)brightnessValue
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [UIScreen mainScreen].brightness = brightnessValue;
  resolve(nil);
}

RCT_REMAP_METHOD(getBrightnessAsync,
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(@([UIScreen mainScreen].brightness));
}

@end
