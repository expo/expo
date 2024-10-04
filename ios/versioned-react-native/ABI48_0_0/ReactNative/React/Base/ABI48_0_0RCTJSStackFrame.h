/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface ABI48_0_0RCTJSStackFrame : NSObject

@property (nonatomic, copy, readonly) NSString *methodName;
@property (nonatomic, copy, readonly) NSString *file;
@property (nonatomic, readonly) NSInteger lineNumber;
@property (nonatomic, readonly) NSInteger column;
@property (nonatomic, readonly) BOOL collapse;

- (instancetype)initWithMethodName:(NSString *)methodName
                              file:(NSString *)file
                        lineNumber:(NSInteger)lineNumber
                            column:(NSInteger)column
                          collapse:(BOOL)collapse;
- (NSDictionary *)toDictionary;

+ (instancetype)stackFrameWithLine:(NSString *)line;
+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict;
+ (NSArray<ABI48_0_0RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines;
+ (NSArray<ABI48_0_0RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts;

@end
