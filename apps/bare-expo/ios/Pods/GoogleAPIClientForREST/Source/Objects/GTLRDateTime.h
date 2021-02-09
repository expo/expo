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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 *  An immutable class representing a date and optionally a time in UTC.
 */
@interface GTLRDateTime : NSObject <NSCopying>

/**
 *  Constructor from a string representation.
 */
+ (nullable instancetype)dateTimeWithRFC3339String:(nullable NSString *)str;

/**
 *  Constructor from a date and time representation.
 */
+ (instancetype)dateTimeWithDate:(NSDate *)date;

/**
 *  Constructor from a date and time representation, along with an offset
 *  minutes value used when creating a RFC3339 string representation.
 *
 *  The date value is independent of time zone; the offset affects how the
 *  date will be rendered as a string.
 *
 *  The offsetMinutes may be initialized from a NSTimeZone as
 *  (timeZone.secondsFromGMT / 60)
 */
+ (instancetype)dateTimeWithDate:(NSDate *)date
                   offsetMinutes:(NSInteger)offsetMinutes;

/**
 *  Constructor from a date for an all-day event.
 *
 *  Use this constructor to create a @c GTLRDateTime that is "date only".
 *
 *  @note @c hasTime will be set to NO.
 */
+ (instancetype)dateTimeForAllDayWithDate:(NSDate *)date;

/**
 *  Constructor from date components.
 */
+ (instancetype)dateTimeWithDateComponents:(NSDateComponents *)date;

/**
 *  The represented date and time.
 *
 *  If @c hasTime is NO, the time is set to noon GMT so the date is valid for all time zones.
 */
@property(nonatomic, readonly) NSDate *date;

/**
 *  The date and time as a RFC3339 string representation.
 */
@property(nonatomic, readonly) NSString *RFC3339String;

/**
 *  The date and time as a RFC3339 string representation.
 *
 *  This returns the same string as @c RFC3339String.
 */
@property(nonatomic, readonly) NSString *stringValue;

/**
 *  The represented date and time as date components.
 */
@property(nonatomic, readonly, copy) NSDateComponents *dateComponents;

/**
 *  The fraction of seconds represented, 0-999.
 */
@property(nonatomic, readonly) NSInteger milliseconds;

/**
 *  The time offset displayed in the string representation, if any.
 *
 *  If the offset is not nil, the date and time will be rendered as a string
 *  for the time zone indicated by the offset.
 *
 *  An app may create a NSTimeZone for this with
 *  [NSTimeZone timeZoneForSecondsFromGMT:(offsetMinutes.integerValue * 60)]
 */
@property(nonatomic, readonly, nullable) NSNumber *offsetMinutes;

/**
 *  Flag indicating if the object represents date only, or date with time.
 */
@property(nonatomic, readonly) BOOL hasTime;

/**
 *  The calendar used by this class, Gregorian and UTC.
 */
+ (NSCalendar *)calendar;

@end

NS_ASSUME_NONNULL_END
