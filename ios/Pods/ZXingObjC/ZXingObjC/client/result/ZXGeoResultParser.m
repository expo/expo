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

#import "ZXGeoParsedResult.h"
#import "ZXGeoResultParser.h"

static NSRegularExpression *ZX_GEO_URL_PATTERN = nil;

@implementation ZXGeoResultParser

+ (void)initialize {
  if ([self class] != [ZXGeoResultParser class]) return;

  ZX_GEO_URL_PATTERN = [[NSRegularExpression alloc] initWithPattern:@"geo:([\\-0-9.]+),([\\-0-9.]+)(?:,([\\-0-9.]+))?(?:\\?(.*))?"
                                                            options:NSRegularExpressionCaseInsensitive error:nil];

}

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (rawText == nil || (![rawText hasPrefix:@"geo:"] && ![rawText hasPrefix:@"GEO:"])) {
    return nil;
  }

  NSArray *matches = [ZX_GEO_URL_PATTERN matchesInString:rawText options:0 range:NSMakeRange(0, rawText.length)];
  if (matches.count == 0) {
    return nil;
  }

  NSTextCheckingResult *match = matches[0];
  NSString *query = nil;
  if ([match rangeAtIndex:4].location != NSNotFound) {
    query = [rawText substringWithRange:[match rangeAtIndex:4]];
  }

  double latitude = [[rawText substringWithRange:[match rangeAtIndex:1]] doubleValue];
  if (latitude > 90.0 || latitude < -90.0) {
    return nil;
  }
  double longitude = [[rawText substringWithRange:[match rangeAtIndex:2]] doubleValue];
  if (longitude > 180.0 || longitude < -180.0) {
    return nil;
  }
  double altitude;
  if ([match rangeAtIndex:3].location == NSNotFound) {
    altitude = 0.0;
  } else {
    altitude = [[rawText substringWithRange:[match rangeAtIndex:3]] doubleValue];
    if (altitude < 0.0) {
      return nil;
    }
  }

  return [ZXGeoParsedResult geoParsedResultWithLatitude:latitude longitude:longitude altitude:altitude query:query];
}

@end
