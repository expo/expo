//
//  EXDevMenuModule.m
//  Pods
//
//  Created by andrew on 2022-01-20.
//

#import "EXDevMenuModule.h"
#import "EXDevMenuRegistry.h"

@implementation EXDevMenuModule

+ (NSString *)moduleName
{
  return @"ExDevMenuModule";
}

RCT_EXPORT_METHOD(getBuildInfoAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  EXDevMenuInstance *instance = [EXDevMenuRegistry getInstanceForBridge:self.bridge];
  NSDictionary *buildInfo = [instance getBuildInfo];
  resolve(buildInfo);
})



@end
