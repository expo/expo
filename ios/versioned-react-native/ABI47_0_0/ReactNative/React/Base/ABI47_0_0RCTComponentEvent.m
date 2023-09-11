/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTComponentEvent.h"

#import "ABI47_0_0RCTAssert.h"

@implementation ABI47_0_0RCTComponentEvent {
  NSArray *_arguments;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag body:(NSDictionary *)body
{
  if (self = [super init]) {
    NSMutableDictionary *mutableBody = [NSMutableDictionary dictionaryWithDictionary:body];
    mutableBody[@"target"] = viewTag;

    _eventName = ABI47_0_0RCTNormalizeInputEventName(name);
    _viewTag = viewTag;
    _arguments = @[ _viewTag, _eventName, mutableBody ];
  }
  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (NSArray *)arguments
{
  return _arguments;
}

- (BOOL)canCoalesce
{
  return NO;
}

+ (NSString *)moduleDotMethod
{
  return @"ABI47_0_0RCTEventEmitter.receiveEvent";
}

@end
