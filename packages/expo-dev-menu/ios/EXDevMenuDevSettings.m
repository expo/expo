// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevMenuDevSettings.h"
#import <EXDevMenu-Swift.h>

#import <React/RCTDevSettings.h>

@implementation EXDevMenuDevSettings

+ (NSDictionary *)getDevSettings
{
  NSMutableDictionary *devSettings = [NSMutableDictionary new];
  
  devSettings[@"isDebuggingRemotely"] = false;
  devSettings[@"isElementInspectorShown"] = false;
  devSettings[@"isHotLoadingEnabled"] = false;
  devSettings[@"isPerfMonitorShown"] = false;
  
  DevMenuManager *manager = [DevMenuManager shared];
  
  if (manager.currentBridge != nil) {
    
    RCTDevSettings *bridgeSettings = [manager.currentBridge moduleForName:@"DevSettings"];
    
    if (bridgeSettings != nil) {
      devSettings[@"isDebuggingRemotely"] = [NSNumber numberWithBool:bridgeSettings.isDebuggingRemotely];
      devSettings[@"isElementInspectorShown"] = [NSNumber numberWithBool:bridgeSettings.isElementInspectorShown];
      devSettings[@"isHotLoadingEnabled"] = [NSNumber numberWithBool:bridgeSettings.isHotLoadingEnabled];
      devSettings[@"isPerfMonitorShown"] = [NSNumber numberWithBool:bridgeSettings.isPerfMonitorShown];
    }
  }
  
  return devSettings;
}

@end
