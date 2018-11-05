/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI27_0_0/ABI27_0_0RCTConvert.h>

/**
 * Object containing information about a TextInput's selection.
 */
@interface ABI27_0_0RCTTextSelection : NSObject

@property (nonatomic, assign, readonly) NSInteger start;
@property (nonatomic, assign, readonly) NSInteger end;

- (instancetype)initWithStart:(NSInteger)start end:(NSInteger)end;

@end

@interface ABI27_0_0RCTConvert (ABI27_0_0RCTTextSelection)

+ (ABI27_0_0RCTTextSelection *)ABI27_0_0RCTTextSelection:(id)json;

@end
