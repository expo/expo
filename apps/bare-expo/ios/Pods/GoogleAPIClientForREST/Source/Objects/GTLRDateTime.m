/* Copyright (c) 2011 Google Inc.
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

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#import "GTLRDateTime.h"

static NSUInteger const kGTLRDateComponentBits = (NSCalendarUnitYear | NSCalendarUnitMonth
    | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute
    | NSCalendarUnitSecond);

@interface GTLRDateTime ()

- (void)setFromDate:(NSDate *)date;
- (void)setFromRFC3339String:(NSString *)str;

@property(nonatomic, copy, readwrite) NSDateComponents *dateComponents;
@property(nonatomic, assign, readwrite) NSInteger milliseconds;
@property(nonatomic, strong, readwrite, nullable) NSNumber *offsetMinutes;

@property(nonatomic, assign, readwrite) BOOL hasTime;

@end


@implementation GTLRDateTime {
  NSDate *_cachedDate;
  NSString *_cachedRFC3339String;
}

// A note about _milliseconds:
// RFC 3339 has support for fractions of a second.  NSDateComponents is all
// NSInteger based, so it can't handle a fraction of a second.  NSDate is
// built on NSTimeInterval so it has sub-millisecond precision.  GTLR takes
// the compromise of supporting the RFC's optional fractional second support
// by maintaining a number of milliseconds past what fits in the
// NSDateComponents.  The parsing and string conversions will include
// 3 decimal digits (hence milliseconds).  When going to a string, the decimal
// digits are only included if the milliseconds are non zero.

@dynamic date;
@dynamic RFC3339String;
@dynamic stringValue;
@dynamic hasTime;

@synthesize dateComponents = _dateComponents,
            milliseconds = _milliseconds,
            offsetMinutes = _offsetMinutes;

+ (instancetype)dateTimeWithRFC3339String:(NSString *)str {
  if (str == nil) return nil;

  GTLRDateTime *result = [[self alloc] init];
  [result setFromRFC3339String:str];
  return result;
}

+ (instancetype)dateTimeWithDate:(NSDate *)date {
  if (date == nil) return nil;

  GTLRDateTime *result = [[self alloc] init];
  [result setFromDate:date];
  return result;
}

+ (instancetype)dateTimeWithDate:(NSDate *)date
                   offsetMinutes:(NSInteger)offsetMinutes {
  GTLRDateTime *result = [self dateTimeWithDate:date];
  result.offsetMinutes = @(offsetMinutes);
  return result;
}

+ (instancetype)dateTimeForAllDayWithDate:(NSDate *)date {
  if (date == nil) return nil;

  GTLRDateTime *result = [[self alloc] init];
  [result setFromDate:date];
  result.hasTime = NO;
  return result;
}

+ (instancetype)dateTimeWithDateComponents:(NSDateComponents *)components {
  NSCalendar *cal = components.calendar ?: [self calendar];
  NSDate *date = [cal dateFromComponents:components];

  return [self dateTimeWithDate:date];
}

- (id)copyWithZone:(NSZone *)zone {
  // Object is immutable
  return self;
}

- (BOOL)isEqual:(GTLRDateTime *)other {
  if (self == other) return YES;
  if (![other isKindOfClass:[GTLRDateTime class]]) return NO;

  BOOL areDateComponentsEqual = [self.dateComponents isEqual:other.dateComponents];
  if (!areDateComponentsEqual) return NO;

  NSNumber *offsetMinutes = self.offsetMinutes;
  NSNumber *otherOffsetMinutes = other.offsetMinutes;
  if ((offsetMinutes == nil) != (otherOffsetMinutes == nil)
      || (offsetMinutes.integerValue != otherOffsetMinutes.integerValue)) return NO;

  return (self.milliseconds == other.milliseconds);
}

- (NSUInteger)hash {
  return [[self date] hash];
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p: {%@}",
    [self class], self, self.RFC3339String];
}

- (NSDate *)date {
  @synchronized(self) {
    if (_cachedDate) return _cachedDate;
  }

  NSDateComponents *dateComponents = self.dateComponents;
  NSTimeInterval extraMillisecondsAsSeconds = 0.0;
  NSCalendar *cal = [[self class] calendar];

  if (!self.hasTime) {
    // We're not keeping track of a time, but NSDate always is based on
    // an absolute time. We want to avoid returning an NSDate where the
    // calendar date appears different from what was used to create our
    // date-time object.
    //
    // We'll make a copy of the date components, setting the time on our
    // copy to noon GMT, since that ensures the date renders correctly for
    // any time zone.
    NSDateComponents *noonDateComponents = [dateComponents copy];
    [noonDateComponents setHour:12];
    [noonDateComponents setMinute:0];
    [noonDateComponents setSecond:0];
    dateComponents = noonDateComponents;
  } else {
    // Add in the fractional seconds that don't fit into NSDateComponents.
    extraMillisecondsAsSeconds = ((NSTimeInterval)self.milliseconds) / 1000.0;
  }

  NSDate *date = [cal dateFromComponents:dateComponents];

  // Add in any milliseconds that didn't fit into the dateComponents.
  if (extraMillisecondsAsSeconds > 0.0) {
    date = [date dateByAddingTimeInterval:extraMillisecondsAsSeconds];
  }

  @synchronized(self) {
    _cachedDate = date;
  }
  return date;
}

- (NSString *)stringValue {
  return self.RFC3339String;
}

- (NSString *)RFC3339String {
  @synchronized(self) {
    if (_cachedRFC3339String) return _cachedRFC3339String;
  }

  NSDateComponents *dateComponents = self.dateComponents;

  NSString *timeString = @""; // timeString like "T15:10:46-08:00"

  if (self.hasTime) {
    NSString *fractionalSecondsString = @"";
    if (self.milliseconds > 0.0) {
      fractionalSecondsString = [NSString stringWithFormat:@".%03ld", (long)self.milliseconds];
    }

    // If the dateTime was created from a string with a time offset, render that back in
    // and adjust the time.
    NSString *offsetStr = @"Z";
    NSNumber *offsetMinutes = self.offsetMinutes;
    if (offsetMinutes != nil) {
      BOOL isNegative = NO;
      NSInteger offsetVal = offsetMinutes.integerValue;
      if (offsetVal < 0) {
        isNegative = YES;
        offsetVal = -offsetVal;
      }
      NSInteger mins = offsetVal % 60;
      NSInteger hours = (offsetVal - mins) / 60;
      offsetStr = [NSString stringWithFormat:@"%c%02ld:%02ld",
                   isNegative ? '-' : '+', (long)hours, (long)mins];

      // Adjust date components back to account for the offset.
      //
      // This is the inverse of the adjustment done in setFromRFC3339String:.
      if (offsetVal != 0) {
        NSDate *adjustedDate =
            [self.date dateByAddingTimeInterval:(offsetMinutes.integerValue * 60)];
        NSCalendar *calendar = [[self class] calendar];
        dateComponents = [calendar components:kGTLRDateComponentBits
                                     fromDate:adjustedDate];
      }
    }

    timeString = [NSString stringWithFormat:@"T%02ld:%02ld:%02ld%@%@",
                  (long)dateComponents.hour, (long)dateComponents.minute,
                  (long)dateComponents.second, fractionalSecondsString,
                  offsetStr];
  }

  // full dateString like "2006-11-17T15:10:46-08:00"
  NSString *dateString = [NSString stringWithFormat:@"%04ld-%02ld-%02ld%@",
    (long)dateComponents.year, (long)dateComponents.month,
    (long)dateComponents.day, timeString];

  @synchronized(self) {
    _cachedRFC3339String = dateString;
  }
  return dateString;
}

- (void)setFromDate:(NSDate *)date {
  NSCalendar *cal = [[self class] calendar];

  NSDateComponents *components = [cal components:kGTLRDateComponentBits
                                        fromDate:date];
  self.dateComponents = components;

  // Extract the fractional seconds.
  NSTimeInterval asTimeInterval = [date timeIntervalSince1970];
  NSTimeInterval worker = asTimeInterval - trunc(asTimeInterval);
  self.milliseconds = (NSInteger)round(worker * 1000.0);
}

- (void)setFromRFC3339String:(NSString *)str {
  static NSCharacterSet *gDashSet;
  static NSCharacterSet *gTSet;
  static NSCharacterSet *gColonSet;
  static NSCharacterSet *gPlusMinusZSet;

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gDashSet = [NSCharacterSet characterSetWithCharactersInString:@"-"];
    gTSet = [NSCharacterSet characterSetWithCharactersInString:@"Tt "];
    gColonSet = [NSCharacterSet characterSetWithCharactersInString:@":"];
    gPlusMinusZSet = [NSCharacterSet characterSetWithCharactersInString:@"+-zZ"];
  });

  NSInteger year = NSDateComponentUndefined;
  NSInteger month = NSDateComponentUndefined;
  NSInteger day = NSDateComponentUndefined;
  NSInteger hour = NSDateComponentUndefined;
  NSInteger minute = NSDateComponentUndefined;
  NSInteger sec = NSDateComponentUndefined;
  NSInteger milliseconds = 0;
  double secDouble = -1.0;
  NSString* sign = nil;
  NSInteger offsetHour = 0;
  NSInteger offsetMinute = 0;

  if (str.length > 0) {
    NSScanner* scanner = [NSScanner scannerWithString:str];
    // There should be no whitespace, so no skip characters.
    [scanner setCharactersToBeSkipped:nil];

    // for example, scan 2006-11-17T15:10:46-08:00
    //                or 2006-11-17T15:10:46Z
    if (// yyyy-mm-dd
        [scanner scanInteger:&year] &&
        [scanner scanCharactersFromSet:gDashSet intoString:NULL] &&
        [scanner scanInteger:&month] &&
        [scanner scanCharactersFromSet:gDashSet intoString:NULL] &&
        [scanner scanInteger:&day] &&
        // Thh:mm:ss
        [scanner scanCharactersFromSet:gTSet intoString:NULL] &&
        [scanner scanInteger:&hour] &&
        [scanner scanCharactersFromSet:gColonSet intoString:NULL] &&
        [scanner scanInteger:&minute] &&
        [scanner scanCharactersFromSet:gColonSet intoString:NULL] &&
        [scanner scanDouble:&secDouble]) {

      // At this point we got secDouble, pull it apart.
      sec = (NSInteger)secDouble;
      double worker = secDouble - ((double)sec);
      milliseconds = (NSInteger)round(worker * 1000.0);

      // Finish parsing, now the offset info.
      if (// Z or +hh:mm
          [scanner scanCharactersFromSet:gPlusMinusZSet intoString:&sign] &&
          [scanner scanInteger:&offsetHour] &&
          [scanner scanCharactersFromSet:gColonSet intoString:NULL] &&
          [scanner scanInteger:&offsetMinute]) {
      }
    }
  }

  NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
  [dateComponents setYear:year];
  [dateComponents setMonth:month];
  [dateComponents setDay:day];
  [dateComponents setHour:hour];
  [dateComponents setMinute:minute];
  [dateComponents setSecond:sec];

  BOOL isMinusOffset = [sign isEqual:@"-"];
  if (isMinusOffset || [sign isEqual:@"+"]) {
    NSInteger totalOffsetMinutes = ((offsetHour * 60) + offsetMinute) * (isMinusOffset ? -1 : 1);
    self.offsetMinutes = @(totalOffsetMinutes);

    // Minus offset means Universal time is that many hours and minutes ahead.
    //
    // This is the inverse of the adjustment done above in RFC3339String.
    NSTimeInterval deltaOffsetSeconds = -totalOffsetMinutes * 60;
    NSCalendar *calendar = [[self class] calendar];
    NSDate *scannedDate = [calendar dateFromComponents:dateComponents];
    NSDate *offsetDate = [scannedDate dateByAddingTimeInterval:deltaOffsetSeconds];

    dateComponents = [calendar components:kGTLRDateComponentBits
                                 fromDate:offsetDate];
  }

  self.dateComponents = dateComponents;
  self.milliseconds = milliseconds;
}

- (BOOL)hasTime {
  NSDateComponents *dateComponents = self.dateComponents;

  BOOL hasTime = ([dateComponents hour] != NSDateComponentUndefined
                  && [dateComponents minute] != NSDateComponentUndefined);

  return hasTime;
}

- (void)setHasTime:(BOOL)shouldHaveTime {
  // We'll set time values to zero or kUndefinedDateComponent as appropriate.
  BOOL hadTime = self.hasTime;

  if (shouldHaveTime && !hadTime) {
    [_dateComponents setHour:0];
    [_dateComponents setMinute:0];
    [_dateComponents setSecond:0];
    _milliseconds = 0;
  } else if (hadTime && !shouldHaveTime) {
    [_dateComponents setHour:NSDateComponentUndefined];
    [_dateComponents setMinute:NSDateComponentUndefined];
    [_dateComponents setSecond:NSDateComponentUndefined];
    _milliseconds = 0;
  }
}

+ (NSCalendar *)calendar {
  NSCalendar *cal = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
  cal.timeZone = (NSTimeZone * _Nonnull)[NSTimeZone timeZoneWithName:@"Universal"];
  return cal;
}

@end
