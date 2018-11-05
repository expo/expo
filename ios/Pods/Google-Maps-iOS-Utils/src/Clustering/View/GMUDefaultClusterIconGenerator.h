/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "GMUClusterIconGenerator.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * This class places clusters into range-based buckets of size to avoid having too many distinct
 * cluster icons. For example a small cluster of 1 to 9 items will have a icon with a text label
 * of 1 to 9. Whereas clusters with a size of 100 to 199 items will be placed in the 100+ bucket
 * and have the '100+' icon shown.
 * This caches already generated icons for performance reasons.
 */
@interface GMUDefaultClusterIconGenerator : NSObject<GMUClusterIconGenerator>

/**
 * Initializes the object with default buckets and auto generated background images.
 */
- (instancetype)init;

/**
 * Initializes the object with given |buckets| and auto generated background images.
 */
- (instancetype)initWithBuckets:(NSArray<NSNumber *> *)buckets;

/**
 * Initializes the class with a list of buckets and the corresponding background images.
 * The backgroundImages array should ideally be big enough to hold the cluster label.
 * Notes:
 * - |buckets| should be strictly increasing. For example: @[@10, @20, @100, @1000].
 * - |buckets| and |backgroundImages| must have equal non zero lengths.
 */
- (instancetype)initWithBuckets:(NSArray<NSNumber *> *)buckets
               backgroundImages:(NSArray<UIImage *> *)backgroundImages;

/**
 * Initializes the class with a list of buckets and the corresponding background colors.
 *
 * Notes:
 * - |buckets| should be strictly increasing. For example: @[@10, @20, @100, @1000].
 * - |buckets| and |backgroundColors| must have equal non zero lengths.
 */
- (instancetype)initWithBuckets:(NSArray<NSNumber *> *)buckets
               backgroundColors:(NSArray<UIColor *> *)backgroundColors;

/**
 * Generates an icon with the given size.
 */
- (UIImage *)iconForSize:(NSUInteger)size;

@end

NS_ASSUME_NONNULL_END

