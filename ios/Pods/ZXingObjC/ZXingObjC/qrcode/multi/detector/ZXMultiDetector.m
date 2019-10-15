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

#import "ZXDecodeHints.h"
#import "ZXErrors.h"
#import "ZXMultiDetector.h"
#import "ZXMultiFinderPatternFinder.h"
#import "ZXResultPointCallback.h"

@implementation ZXMultiDetector

- (NSArray *)detectMulti:(ZXDecodeHints *)hints error:(NSError **)error {
  id<ZXResultPointCallback> resultPointCallback = hints == nil ? nil : hints.resultPointCallback;
  ZXMultiFinderPatternFinder *finder = [[ZXMultiFinderPatternFinder alloc] initWithImage:self.image resultPointCallback:resultPointCallback];
  NSArray *info = [finder findMulti:hints error:error];
  if ([info count] == 0) {
    if (error) *error = ZXNotFoundErrorInstance();
    return nil;
  }

  NSMutableArray *result = [NSMutableArray array];
  for (int i = 0; i < [info count]; i++) {
    ZXDetectorResult *patternInfo = [self processFinderPatternInfo:info[i] error:nil];
    if (patternInfo) {
      [result addObject:patternInfo];
    }
  }

  return result;
}

@end
