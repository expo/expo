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

#import "ZXCalendarParsedResult.h"
#import "ZXResult.h"
#import "ZXVCardResultParser.h"
#import "ZXVEventResultParser.h"

@implementation ZXVEventResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (rawText == nil) {
    return nil;
  }
  NSUInteger vEventStart = [rawText rangeOfString:@"BEGIN:VEVENT"].location;
  if (vEventStart == NSNotFound) {
    return nil;
  }

  NSString *summary = [self matchSingleVCardPrefixedField:@"SUMMARY" rawText:rawText trim:YES];
  NSString *start = [self matchSingleVCardPrefixedField:@"DTSTART" rawText:rawText trim:YES];
  if (start == nil) {
    return nil;
  }
  NSString *end = [self matchSingleVCardPrefixedField:@"DTEND" rawText:rawText trim:YES];
  NSString *duration = [self matchSingleVCardPrefixedField:@"DURATION" rawText:rawText trim:YES];
  NSString *location = [self matchSingleVCardPrefixedField:@"LOCATION" rawText:rawText trim:YES];
  NSString *organizer = [self stripMailto:[self matchSingleVCardPrefixedField:@"ORGANIZER" rawText:rawText trim:YES]];

  NSMutableArray *attendees = [self matchVCardPrefixedField:@"ATTENDEE" rawText:rawText trim:YES];
  if (attendees != nil) {
    for (int i = 0; i < attendees.count; i++) {
      attendees[i] = [self stripMailto:attendees[i]];
    }
  }
  NSString *description = [self matchSingleVCardPrefixedField:@"DESCRIPTION" rawText:rawText trim:YES];

  NSString *geoString = [self matchSingleVCardPrefixedField:@"GEO" rawText:rawText trim:YES];
  double latitude;
  double longitude;
  if (geoString == nil) {
    latitude = NAN;
    longitude = NAN;
  } else {
    NSUInteger semicolon = [geoString rangeOfString:@";"].location;
    if (semicolon == NSNotFound) {
      return nil;
    }
    latitude = [[geoString substringToIndex:semicolon] doubleValue];
    longitude = [[geoString substringFromIndex:semicolon + 1] doubleValue];
  }

  @try {
    return [ZXCalendarParsedResult calendarParsedResultWithSummary:summary
                                                       startString:start
                                                         endString:end
                                                    durationString:duration
                                                          location:location
                                                         organizer:organizer
                                                         attendees:attendees
                                                       description:description
                                                          latitude:latitude
                                                         longitude:longitude];
  } @catch (NSException *iae) {
    return nil;
  }
}

- (NSString *)matchSingleVCardPrefixedField:(NSString *)prefix rawText:(NSString *)rawText trim:(BOOL)trim {
  NSArray *values = [ZXVCardResultParser matchSingleVCardPrefixedField:prefix rawText:rawText trim:trim parseFieldDivider:NO];
  return values == nil || values.count == 0 ? nil : values[0];
}

- (NSMutableArray *)matchVCardPrefixedField:(NSString *)prefix rawText:(NSString *)rawText trim:(BOOL)trim {
  NSMutableArray *values = [ZXVCardResultParser matchVCardPrefixedField:prefix rawText:rawText trim:trim parseFieldDivider:NO];
  if (values == nil || values.count == 0) {
    return nil;
  }
  NSUInteger size = values.count;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:size];
  for (int i = 0; i < size; i++) {
    [result addObject:values[i][0]];
  }
  return result;
}

- (NSString *)stripMailto:(NSString *)s {
  if (s != nil && ([s hasPrefix:@"mailto:"] || [s hasPrefix:@"MAILTO:"])) {
    s = [s substringFromIndex:7];
  }
  return s;
}

@end
