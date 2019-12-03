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

#import "ZXIntArray.h"
#import "ZXRSSUtils.h"

@implementation ZXRSSUtils

/*
+ (NSArray *)rssWidths:(int)val n:(int)n elements:(int)elements maxWidth:(int)maxWidth noNarrow:(BOOL)noNarrow {
  NSMutableArray *widths = [NSMutableArray arrayWithCapacity:elements];
  int bar;
  int narrowMask = 0;
  for (bar = 0; bar < elements - 1; bar++) {
    narrowMask |= 1 << bar;
    int elmWidth = 1;
    int subVal;
    while (YES) {
      subVal = [self combins:n - elmWidth - 1 r:elements - bar - 2];
      if (noNarrow && (narrowMask == 0) && (n - elmWidth - (elements - bar - 1) >= elements - bar - 1)) {
        subVal -= [self combins:n - elmWidth - (elements - bar) r:elements - bar - 2];
      }
      if (elements - bar - 1 > 1) {
        int lessVal = 0;
        for (int mxwElement = n - elmWidth - (elements - bar - 2); mxwElement > maxWidth; mxwElement--) {
          lessVal += [self combins:n - elmWidth - mxwElement - 1 r:elements - bar - 3];
        }
        subVal -= lessVal * (elements - 1 - bar);
      } else if (n - elmWidth > maxWidth) {
        subVal--;
      }
      val -= subVal;
      if (val < 0) {
        break;
      }
      elmWidth++;
      narrowMask &= ~(1 << bar);
    }
    val += subVal;
    n -= elmWidth;
    [widths addObject:@(elmWidth)];
  }

  [widths addObject:@(n)];
  return widths;
}
*/

+ (int)rssValue:(ZXIntArray *)widths maxWidth:(int)maxWidth noNarrow:(BOOL)noNarrow {
  int elements = widths.length;
  int n = 0;
  for (int i = 0; i < elements; i++) {
    n += widths.array[i];
  }
  int val = 0;
  int narrowMask = 0;
  for (int bar = 0; bar < elements - 1; bar++) {
    int elmWidth;
    for (elmWidth = 1, narrowMask |= 1 << bar;
         elmWidth < widths.array[bar];
         elmWidth++, narrowMask &= ~(1 << bar)) {
      int subVal = [self combins:n - elmWidth - 1 r:elements - bar - 2];
      if (noNarrow && (narrowMask == 0) &&
          (n - elmWidth - (elements - bar - 1) >= elements - bar - 1)) {
        subVal -= [self combins:n - elmWidth - (elements - bar)
                              r:elements - bar - 2];
      }
      if (elements - bar - 1 > 1) {
        int lessVal = 0;
        for (int mxwElement = n - elmWidth - (elements - bar - 2);
             mxwElement > maxWidth; mxwElement--) {
          lessVal += [self combins:n - elmWidth - mxwElement - 1
                                 r:elements - bar - 3];
        }
        subVal -= lessVal * (elements - 1 - bar);
      } else if (n - elmWidth > maxWidth) {
        subVal--;
      }
      val += subVal;
    }
    n -= elmWidth;
  }
  return val;
}

+ (int)combins:(int)n r:(int)r {
  int maxDenom;
  int minDenom;
  if (n - r > r) {
    minDenom = r;
    maxDenom = n - r;
  } else {
    minDenom = n - r;
    maxDenom = r;
  }
  int val = 1;
  int j = 1;
  for (int i = n; i > maxDenom; i--) {
    val *= i;
    if (j <= minDenom) {
      val /= j;
      j++;
    }
  }
  while (j <= minDenom) {
    val /= j;
    j++;
  }
  return val;
}

/*
+ (NSArray *)elements:(NSArray *)eDist N:(int)N K:(int)K {
  NSMutableArray *widths = [NSMutableArray arrayWithCapacity:[eDist count] + 2];
  int twoK = 2 * K;
  [widths addObject:@1];
  int i;
  int minEven = 10;
  int barSum = 1;
  for (i = 1; i < twoK - 2; i += 2) {
    [widths addObject:@([eDist[i - 1] intValue] - [widths[i - 1] intValue])];
    [widths addObject:@([eDist[i] intValue] - [widths[i] intValue])];
    barSum += [widths[i] intValue] + [widths[i + 1] intValue];
    if ([widths[i] intValue] < minEven) {
      minEven = [widths[i] intValue];
    }
  }

  [widths addObject:@(N - barSum)];
  if ([widths[twoK - 1] intValue] < minEven) {
    minEven = [widths[twoK - 1] intValue];
  }
  if (minEven > 1) {
    for (i = 0; i < twoK; i += 2) {
      widths[i] = @([widths[i] intValue] + minEven - 1);
      widths[i + 1] = @([widths[i + 1] intValue] - minEven - 1);
    }
  }
  return widths;
}
*/

@end
