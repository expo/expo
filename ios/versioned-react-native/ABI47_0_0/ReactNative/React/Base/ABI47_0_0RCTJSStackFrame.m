/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTJSStackFrame.h"

#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTUtils.h"

/**
 * The RegEx used to parse Error.stack.
 *
 * JavaScriptCore has the following format:
 *
 *   Exception: Error: argh
 *     func1@/path/to/file.js:2:18
 *     func2@/path/to/file.js:6:8
 *     eval@[native code]
 *     global code@/path/to/file.js:13:5
 *
 * Another supported format:
 *
 *  Error: argh
 *   at func1 (/path/to/file.js:2:18)
 *   at func2 (/path/to/file.js:6:8)
 *   at eval (native)
 *   at global (/path/to/file.js:13:5)
 */
static NSRegularExpression *ABI47_0_0RCTJSStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSString *pattern =
        @"\\s*(?:at)?\\s*" // Skip leading "at" and whitespace, noncapturing
        @"(.+?)" // Capture the function name (group 1)
        @"\\s*[@(]" // Skip whitespace, then @ or (
        @"(.*):" // Capture the file name (group 2), then colon
        @"(\\d+):(\\d+)" // Line and column number (groups 3 and 4)
        @"\\)?$" // Optional closing paren and EOL
        ;
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:pattern options:0 error:&regexError];
    if (regexError) {
      ABI47_0_0RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

@implementation ABI47_0_0RCTJSStackFrame

- (instancetype)initWithMethodName:(NSString *)methodName
                              file:(NSString *)file
                        lineNumber:(NSInteger)lineNumber
                            column:(NSInteger)column
                          collapse:(BOOL)collapse
{
  if (self = [super init]) {
    _methodName = methodName;
    _file = file;
    _lineNumber = lineNumber;
    _column = column;
    _collapse = collapse;
  }
  return self;
}

- (NSDictionary *)toDictionary
{
  return @{
    @"methodName" : ABI47_0_0RCTNullIfNil(self.methodName),
    @"file" : ABI47_0_0RCTNullIfNil(self.file),
    @"lineNumber" : @(self.lineNumber),
    @"column" : @(self.column),
    @"collapse" : @(self.collapse)
  };
}

+ (instancetype)stackFrameWithLine:(NSString *)line
{
  NSTextCheckingResult *match = [ABI47_0_0RCTJSStackFrameRegex() firstMatchInString:line
                                                                   options:0
                                                                     range:NSMakeRange(0, line.length)];
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
                                   column:[column integerValue]
                                 collapse:NO];
}

+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict
{
  return [[self alloc] initWithMethodName:ABI47_0_0RCTNilIfNull(dict[@"methodName"])
                                     file:dict[@"file"]
                               lineNumber:[ABI47_0_0RCTNilIfNull(dict[@"lineNumber"]) integerValue]
                                   column:[ABI47_0_0RCTNilIfNull(dict[@"column"]) integerValue]
                                 collapse:[ABI47_0_0RCTNilIfNull(dict[@"collapse"]) boolValue]];
}

+ (NSArray<ABI47_0_0RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSString *line in [lines componentsSeparatedByString:@"\n"]) {
    ABI47_0_0RCTJSStackFrame *frame = [self stackFrameWithLine:line];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

+ (NSArray<ABI47_0_0RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSDictionary *dict in dicts) {
    ABI47_0_0RCTJSStackFrame *frame = [self stackFrameWithDictionary:dict];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p method name: %@; file name: %@; line: %ld; column: %ld>",
                                    self.class,
                                    self,
                                    self.methodName,
                                    self.file,
                                    (long)self.lineNumber,
                                    (long)self.column];
}

@end
