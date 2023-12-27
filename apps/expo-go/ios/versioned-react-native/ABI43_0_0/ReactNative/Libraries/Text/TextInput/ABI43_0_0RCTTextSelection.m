/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTTextSelection.h>

@implementation ABI43_0_0RCTTextSelection

- (instancetype)initWithStart:(NSInteger)start end:(NSInteger)end
{
  if (self = [super init]) {
    _start = start;
    _end = end;
  }
  return self;
}

@end

@implementation ABI43_0_0RCTConvert (ABI43_0_0RCTTextSelection)

+ (ABI43_0_0RCTTextSelection *)ABI43_0_0RCTTextSelection:(id)json
{
  if ([json isKindOfClass:[NSDictionary class]]) {
    NSInteger start = [self NSInteger:json[@"start"]];
    NSInteger end = [self NSInteger:json[@"end"]];
    return [[ABI43_0_0RCTTextSelection alloc] initWithStart:start end:end];
  }

  return nil;
}

@end
