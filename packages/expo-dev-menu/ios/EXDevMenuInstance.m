// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevMenuInstance.h"
#import "EXDevMenuBuildInfo.h"
#import "DevMenuRCTBridge.h"
#import <React/RCTDevSettings.h>

@implementation EXDevMenuInstance

- (instancetype)initWithBridge:(RCTBridge *)bridge andManifest:(NSDictionary *)manifest
{
  if (self = [super init]) {
    self = [self initWithBridge:bridge];
    self.manifest = manifest;
  }
  
  return self;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    self.appBridge = bridge;
    self.bridge = [[DevMenuRCTBridge alloc] initWithDelegate:self launchOptions:nil];
  }
  
  return self;
}


-(NSDictionary *)getBuildInfo
{
  NSDictionary *buildInfo = [EXDevMenuBuildInfo getBuildInfoForBridge:self.bridge andManifest:self.manifest];
  
  return buildInfo;
}

-(NSDictionary *)getDevSettings
{
  NSMutableDictionary *dictionary = [NSMutableDictionary new];
  
  RCTDevSettings *devSettings = [self.bridge moduleForName:@"DevSettings"];
  
  return dictionary;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [NSURL new];
}

@end
