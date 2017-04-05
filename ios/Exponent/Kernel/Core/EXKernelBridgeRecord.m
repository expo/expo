// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelBridgeRecord.h"

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelBridgeRecord

+ (instancetype)recordWithExperienceId:(NSString *)experienceId appManager:(nonnull EXFrameReactAppManager *)appMgr
{
  return [[EXKernelBridgeRecord alloc] initWithExperienceId:experienceId appManager:appMgr];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId appManager:(nonnull EXFrameReactAppManager *)appMgr
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _appManager = appMgr;
  }
  return self;
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[self class]]) {
    return NO;
  }
  EXKernelBridgeRecord *other = (EXKernelBridgeRecord *)object;
  return ([other.experienceId isEqualToString:_experienceId] && [other.appManager.frame.initialUri isEqual:_appManager.frame.initialUri]);
}

- (NSUInteger)hash
{
  NSUInteger experienceIdHash = (_experienceId) ? _experienceId.hash : NSNotFound;
  NSUInteger initialUriHash = (_appManager && _appManager.frame && _appManager.frame.initialUri) ? _appManager.frame.initialUri.hash : NSNotFound;
  return experienceIdHash ^ initialUriHash;
}

@end
