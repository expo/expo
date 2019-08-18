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

#import "GMUDefaultClusterIconGenerator.h"

/* Extensions for testing purposes only. */
@interface GMUDefaultClusterIconGenerator (Testing)

/* Draws |text| on top of an |image| and returns the resultant image. */
- (UIImage *)iconForText:(NSString *)text withBaseImage:(UIImage *)image;

/**
 * Draws |text| on top of a circle whose background color is determined by |bucketIndex|
 * and returns the resultant image.
 */
- (UIImage *)iconForText:(NSString *)text withBucketIndex:(NSUInteger)bucketIndex;

@end
