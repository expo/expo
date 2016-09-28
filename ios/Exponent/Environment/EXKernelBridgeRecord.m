// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrame.h"
#import "EXKernelBridgeRecord.h"

NSString *kEXKernelBridgeDidForegroundNotification = @"EXKernelBridgeDidForegroundNotification";
NSString *kEXKernelBridgeDidBackgroundNotification = @"EXKernelBridgeDidBackgroundNotification";

@implementation EXKernelBridgeRecord

+ (instancetype)recordWithExperienceId:(NSString *)experienceId frame:(nonnull EXFrame *)frame
{
  return [[EXKernelBridgeRecord alloc] initWithExperienceId:experienceId frame:frame];
}

- (instancetype)initWithExperienceId:(NSString *)experienceId frame:(nonnull EXFrame *)frame
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _frame = frame;
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
  return ([other.experienceId isEqualToString:_experienceId] && [other.frame.initialUri isEqual:_frame.initialUri]);
}

- (NSUInteger)hash
{
  NSUInteger experienceIdHash = (_experienceId) ? _experienceId.hash : NSNotFound;
  NSUInteger initialUriHash = (_frame && _frame.initialUri) ? _frame.initialUri.hash : NSNotFound;
  return experienceIdHash ^ initialUriHash;
}

@end
