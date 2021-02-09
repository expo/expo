/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * One row of an RSS Expanded Stacked symbol, consisting of 1+ expanded pairs.
 */
@interface ZXRSSExpandedRow : NSObject

@property (nonatomic, strong, readonly) NSArray *pairs;
@property (nonatomic, assign, readonly) int rowNumber;
/** Did this row of the image have to be reversed (mirrored) to recognize the pairs? */
@property (nonatomic, assign, readonly) BOOL wasReversed;

- (id)initWithPairs:(NSArray *)pairs rowNumber:(int)rowNumber wasReversed:(BOOL)wasReversed;
- (BOOL)isReversed;
- (BOOL)isEquivalent:(NSArray *)otherPairs;

@end
