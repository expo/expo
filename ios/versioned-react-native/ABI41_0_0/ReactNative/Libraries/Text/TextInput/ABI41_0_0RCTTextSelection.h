/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>

/**
 * Object containing information about a TextInput's selection.
 */
@interface ABI41_0_0RCTTextSelection : NSObject

@property (nonatomic, assign, readonly) NSInteger start;
@property (nonatomic, assign, readonly) NSInteger end;

- (instancetype)initWithStart:(NSInteger)start end:(NSInteger)end;

@end

@interface ABI41_0_0RCTConvert (ABI41_0_0RCTTextSelection)

+ (ABI41_0_0RCTTextSelection *)ABI41_0_0RCTTextSelection:(id)json;

@end
