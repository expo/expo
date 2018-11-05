/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTJSStackFrame.h"

#import "ABI29_0_0RCTLog.h"
#import "ABI29_0_0RCTUtils.h"

static NSRegularExpression *ABI29_0_0RCTJSStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:@"^(?:([^@]+)@)?(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
    if (regexError) {
      ABI29_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

@implementation ABI29_0_0RCTJSStackFrame

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
     @"methodName": ABI29_0_0RCTNullIfNil(self.methodName),
     @"file": ABI29_0_0RCTNullIfNil(self.file),
     @"lineNumber": @(self.lineNumber),
     @"column": @(self.column)
  };
}

+ (instancetype)stackFrameWithLine:(NSString *)line
{
  NSTextCheckingResult *match = [ABI29_0_0RCTJSStackFrameRegex() firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
  if (!match) {
    return nil;
  }

  // methodName may not be present for e.g. anonymous functions
  const NSRange methodNameRange = [match rangeAtIndex:1];
  NSString *methodName = methodNameRange.location == NSNotFound ? nil : [line substringWithRange:methodNameRange];
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
  return [[self alloc] initWithMethodName:ABI29_0_0RCTNilIfNull(dict[@"methodName"])
                                     file:dict[@"file"]
                               lineNumber:[ABI29_0_0RCTNilIfNull(dict[@"lineNumber"]) integerValue]
                                   column:[ABI29_0_0RCTNilIfNull(dict[@"column"]) integerValue]];
}

+ (NSArray<ABI29_0_0RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSString *line in [lines componentsSeparatedByString:@"\n"]) {
    ABI29_0_0RCTJSStackFrame *frame = [self stackFrameWithLine:line];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

+ (NSArray<ABI29_0_0RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSDictionary *dict in dicts) {
    ABI29_0_0RCTJSStackFrame *frame = [self stackFrameWithDictionary:dict];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"<%@: %p method name: %@; file name: %@; line: %ld; column: %ld>",
          self.class,
          self,
          self.methodName,
          self.file,
          (long)self.lineNumber,
          (long)self.column];
}

@end
