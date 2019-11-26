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

static NSRegularExpression *ZX_DATE_TIME = nil;
static NSRegularExpression *ZX_RFC2445_DURATION = nil;

const long ZX_RFC2445_DURATION_FIELD_UNITS[] = {
  7 * 24 * 60 * 60 * 1000, // 1 week
  24 * 60 * 60 * 1000, // 1 day
  60 * 60 * 1000, // 1 hour
  60 * 1000, // 1 minute
  1000, // 1 second
};

@implementation ZXCalendarParsedResult

+ (void)initialize {
  if ([self class] != [ZXCalendarParsedResult class]) return;

  ZX_DATE_TIME = [[NSRegularExpression alloc] initWithPattern:@"[0-9]{8}(T[0-9]{6}Z?)?"
                                                      options:0
                                                        error:nil];

  ZX_RFC2445_DURATION = [[NSRegularExpression alloc] initWithPattern:@"P(?:(\\d+)W)?(?:(\\d+)D)?(?:T(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?)?"
                                                             options:NSRegularExpressionCaseInsensitive
                                                               error:nil];
}

- (id)initWithSummary:(NSString *)summary startString:(NSString *)startString endString:(NSString *)endString
       durationString:(NSString *)durationString location:(NSString *)location organizer:(NSString *)organizer
            attendees:(NSArray *)attendees description:(NSString *)description latitude:(double)latitude
            longitude:(double)longitude {
  if (self = [super initWithType:kParsedResultTypeCalendar]) {
    _summary = summary;
    _start = [self parseDate:startString];

    if (endString == nil) {
      long durationMS = [self parseDurationMS:durationString];
      _end = durationMS < 0 ? nil : [NSDate dateWithTimeIntervalSince1970:[_start timeIntervalSince1970] + durationMS / 1000];
    } else {
      _end = [self parseDate:endString];
    }

    _startAllDay = startString.length == 8;
    _endAllDay = endString != nil && endString.length == 8;

    _location = location;
    _organizer = organizer;
    _attendees = attendees;
    _resultDescription = description;
    _latitude = latitude;
    _longitude = longitude;
  }
  return self;
}

+ (id)calendarParsedResultWithSummary:(NSString *)summary startString:(NSString *)startString
                            endString:(NSString *)endString durationString:(NSString *)durationString
                             location:(NSString *)location organizer:(NSString *)organizer
                            attendees:(NSArray *)attendees description:(NSString *)description latitude:(double)latitude
                            longitude:(double)longitude {
  return [[self alloc] initWithSummary:summary startString:startString endString:endString durationString:durationString
                              location:location organizer:organizer attendees:attendees description:description
                              latitude:latitude longitude:longitude];
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString stringWithCapacity:100];
  [ZXParsedResult maybeAppend:self.summary result:result];
  [ZXParsedResult maybeAppend:[self format:self.startAllDay date:self.start] result:result];
  [ZXParsedResult maybeAppend:[self format:self.endAllDay date:self.end] result:result];
  [ZXParsedResult maybeAppend:self.location result:result];
  [ZXParsedResult maybeAppend:self.organizer result:result];
  [ZXParsedResult maybeAppendArray:self.attendees result:result];
  [ZXParsedResult maybeAppend:self.description result:result];
  return result;
}

/**
 * Parses a string as a date. RFC 2445 allows the start and end fields to be of type DATE (e.g. 20081021)
 * or DATE-TIME (e.g. 20081021T123000 for local time, or 20081021T123000Z for UTC).
 */
- (NSDate *)parseDate:(NSString *)when {
  NSArray *matches = [ZX_DATE_TIME matchesInString:when options:0 range:NSMakeRange(0, when.length)];
  if (matches.count == 0) {
    [NSException raise:NSInvalidArgumentException
                format:@"Invalid date"];
  }
  if (when.length == 8) {
    // Show only year/month/day
    return [[self buildDateFormat] dateFromString:when];
  } else {
    // The when string can be local time, or UTC if it ends with a Z
    if (when.length == 16 && [when characterAtIndex:15] == 'Z') {
      return [[self buildDateTimeFormat] dateFromString:[when substringToIndex:15]];
    } else {
      return [[self buildDateTimeFormat] dateFromString:when];
    }
  }
}

- (NSString *)format:(BOOL)allDay date:(NSDate *)date {
  if (date == nil) {
    return nil;
  }
  NSDateFormatter *format = [[NSDateFormatter alloc] init];
  format.dateFormat = allDay ? @"MMM d, yyyy" : @"MMM d, yyyy hh:mm:ss a";
  return [format stringFromDate:date];
}

- (long)parseDurationMS:(NSString *)durationString {
  if (durationString == nil) {
    return -1;
  }
  NSArray *m = [ZX_RFC2445_DURATION matchesInString:durationString options:0 range:NSMakeRange(0, durationString.length)];
  if (m.count == 0) {
    return -1;
  }
  long durationMS = 0;
  NSTextCheckingResult *match = m[0];
  for (int i = 0; i < sizeof(ZX_RFC2445_DURATION_FIELD_UNITS) / sizeof(long); i++) {
    if ([match rangeAtIndex:i + 1].location != NSNotFound) {
      NSString *fieldValue = [durationString substringWithRange:[match rangeAtIndex:i + 1]];
      if (fieldValue != nil) {
        durationMS += ZX_RFC2445_DURATION_FIELD_UNITS[i] * [fieldValue intValue];
      }
    }
  }
  return durationMS;
}

- (NSDateFormatter *)buildDateFormat {
  NSDateFormatter *format = [[NSDateFormatter alloc] init];
  format.dateFormat = @"yyyyMMdd";
  format.timeZone = [NSTimeZone timeZoneWithAbbreviation:@"GMT"];
  return format;
}

- (NSDateFormatter *)buildDateTimeFormat {
  NSDateFormatter *format = [[NSDateFormatter alloc] init];
  format.dateFormat = @"yyyyMMdd'T'HHmmss";
  return format;
}

- (NSString *)description {
  return self.resultDescription;
}

@end
