// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelBridgeRecord.h"

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelBridgeRecord

+ (instancetype)recordWithExperienceId:(NSString *)experienceId initialUri:(NSURL *)initialUri
{
  return [[EXKernelBridgeRecord alloc] initWithExperienceId:experienceId initialUri:initialUri];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId initialUri:(NSURL *)initialUri
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _initialUri = initialUri;
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
  return ([other.experienceId isEqualToString:_experienceId] && [other.initialUri isEqual:_initialUri]);
}

- (NSUInteger)hash
{
  NSUInteger experienceIdHash = (_experienceId) ? _experienceId.hash : NSNotFound;
  NSUInteger initialUriHash = (_initialUri) ? _initialUri.hash : NSNotFound;
  return experienceIdHash ^ initialUriHash;
}

@end
