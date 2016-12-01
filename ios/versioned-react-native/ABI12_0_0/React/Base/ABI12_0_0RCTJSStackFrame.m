/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTJSStackFrame.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTUtils.h"

static NSRegularExpression *ABI12_0_0RCTJSStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:@"^([^@]+)@(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
    if (regexError) {
      ABI12_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

@implementation ABI12_0_0RCTJSStackFrame

- (instancetype)initWithMethodName:(NSString *)methodName file:(NSString *)file lineNumber:(NSInteger)lineNumber column:(NSInteger)column
{
  if (self = [super init]) {
    _methodName = methodName;
    _file = file;
    _lineNumber = lineNumber;
    _column = column;
  }
  return self;
}

- (NSDictionary *)toDictionary
{
  return @{
     @"methodName": ABI12_0_0RCTNullIfNil(self.methodName),
     @"file": ABI12_0_0RCTNullIfNil(self.file),
     @"lineNumber": @(self.lineNumber),
     @"column": @(self.column)
  };
}

+ (instancetype)stackFrameWithLine:(NSString *)line
{
  NSTextCheckingResult *match = [ABI12_0_0RCTJSStackFrameRegex() firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
  if (!match) {
    return nil;
  }

  NSString *methodName = [line substringWithRange:[match rangeAtIndex:1]];
  NSString *file = [line substringWithRange:[match rangeAtIndex:2]];
  NSString *lineNumber = [line substringWithRange:[match rangeAtIndex:3]];
  NSString *column = [line substringWithRange:[match rangeAtIndex:4]];

  return [[self alloc] initWithMethodName:methodName
                                     file:file
                               lineNumber:[lineNumber integerValue]
                                   column:[column integerValue]];
}

+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict
{
  return [[self alloc] initWithMethodName:dict[@"methodName"]
                                     file:dict[@"file"]
                               lineNumber:[dict[@"lineNumber"] integerValue]
                                   column:[dict[@"column"] integerValue]];
}

+ (NSArray<ABI12_0_0RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSString *line in [lines componentsSeparatedByString:@"\n"]) {
    ABI12_0_0RCTJSStackFrame *frame = [self stackFrameWithLine:line];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

+ (NSArray<ABI12_0_0RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSDictionary *dict in dicts) {
    ABI12_0_0RCTJSStackFrame *frame = [self stackFrameWithDictionary:dict];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

@end
