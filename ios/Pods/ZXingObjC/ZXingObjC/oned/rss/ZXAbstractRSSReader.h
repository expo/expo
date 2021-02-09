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

#import "ZXOneDReader.h"

@class ZXIntArray;

typedef enum {
	ZX_RSS_PATTERNS_RSS14_PATTERNS = 0,
	ZX_RSS_PATTERNS_RSS_EXPANDED_PATTERNS
} ZX_RSS_PATTERNS;

@interface ZXAbstractRSSReader : ZXOneDReader

@property (nonatomic, strong, readonly) ZXIntArray *decodeFinderCounters;
@property (nonatomic, strong, readonly) ZXIntArray *dataCharacterCounters;
@property (nonatomic, assign, readonly) float *oddRoundingErrors;
@property (nonatomic, assign, readonly) unsigned int oddRoundingErrorsLen;
@property (nonatomic, assign, readonly) float *evenRoundingErrors;
@property (nonatomic, assign, readonly) unsigned int evenRoundingErrorsLen;
@property (nonatomic, strong, readonly) ZXIntArray *oddCounts;
@property (nonatomic, strong, readonly) ZXIntArray *evenCounts;

+ (int)parseFinderValue:(ZXIntArray *)counters finderPatternType:(ZX_RSS_PATTERNS)finderPatternType;
+ (int)count:(ZXIntArray *)array;
+ (void)increment:(ZXIntArray *)array errors:(float *)errors;
+ (void)decrement:(ZXIntArray *)array errors:(float *)errors;
+ (BOOL)isFinderPattern:(ZXIntArray *)counters;

@end
