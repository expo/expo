/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI29_0_0/ABI29_0_0RCTConvert.h>

/**
 * Object containing information about a TextInput's selection.
 */
@interface ABI29_0_0RCTTextSelection : NSObject

@property (nonatomic, assign, readonly) NSInteger start;
@property (nonatomic, assign, readonly) NSInteger end;

- (instancetype)initWithStart:(NSInteger)start end:(NSInteger)end;

@end

@interface ABI29_0_0RCTConvert (ABI29_0_0RCTTextSelection)

+ (ABI29_0_0RCTTextSelection *)ABI29_0_0RCTTextSelection:(id)json;

@end
