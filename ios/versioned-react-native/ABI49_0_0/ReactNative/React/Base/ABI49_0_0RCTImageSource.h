/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

/**
 * Object containing an image URL and associated metadata.
 */
@interface ABI49_0_0RCTImageSource : NSObject

@property (nonatomic, copy, readonly) NSURLRequest *request;
@property (nonatomic, assign, readonly) CGSize size;
@property (nonatomic, assign, readonly) CGFloat scale;

/**
 * Create a new image source object.
 * Pass a size of CGSizeZero if you do not know or wish to specify the image
 * size. Pass a scale of zero if you do not know or wish to specify the scale.
 */
- (instancetype)initWithURLRequest:(NSURLRequest *)request size:(CGSize)size scale:(CGFloat)scale;

/**
 * Create a copy of the image source with the specified size and scale.
 */
- (instancetype)imageSourceWithSize:(CGSize)size scale:(CGFloat)scale;

@end

@interface ABI49_0_0RCTConvert (ImageSource)

+ (ABI49_0_0RCTImageSource *)ABI49_0_0RCTImageSource:(id)json;
+ (NSArray<ABI49_0_0RCTImageSource *> *)ABI49_0_0RCTImageSourceArray:(id)json;

@end
