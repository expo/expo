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

#import "ZXParsedResult.h"

@interface ZXCalendarParsedResult : ZXParsedResult

@property (nonatomic, copy, readonly) NSString *summary;
@property (nonatomic, strong, readonly) NSDate *start;
@property (nonatomic, assign, readonly) BOOL startAllDay;
@property (nonatomic, strong, readonly) NSDate *end;
@property (nonatomic, assign, readonly) BOOL endAllDay;
@property (nonatomic, copy, readonly) NSString *location;
@property (nonatomic, copy, readonly) NSString *organizer;
@property (nonatomic, strong, readonly) NSArray *attendees;
@property (nonatomic, copy, readonly) NSString *resultDescription;
@property (nonatomic, assign, readonly) double latitude;
@property (nonatomic, assign, readonly) double longitude;

- (id)initWithSummary:(NSString *)summary startString:(NSString *)startString endString:(NSString *)endString
       durationString:(NSString *)durationString location:(NSString *)location organizer:(NSString *)organizer
            attendees:(NSArray *)attendees description:(NSString *)description latitude:(double)latitude
            longitude:(double)longitude;
+ (id)calendarParsedResultWithSummary:(NSString *)summary startString:(NSString *)startString
                            endString:(NSString *)endString durationString:(NSString *)durationString
                             location:(NSString *)location organizer:(NSString *)organizer
                            attendees:(NSArray *)attendees description:(NSString *)description latitude:(double)latitude
                            longitude:(double)longitude;

@end
