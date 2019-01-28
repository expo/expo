// Copyright 2015-present 650 Industries. All rights reserved.

#import <EventKit/EventKit.h>
#import <Foundation/Foundation.h>

@interface EXCalendarConverter : NSObject

+ (NSDictionary *)serializeSource:(EKSource *)source;
+ (NSArray *)serializeCalendars:(NSArray *)calendars;
+ (NSDictionary *)serializeCalendarEvent:(EKEvent *)event;
+ (NSArray *)serializeCalendarEvents:(NSArray *)calendarEvents;
+ (NSDictionary *)serializeReminder:(EKReminder *)reminder;
+ (NSArray *)serializeReminders:(NSArray<EKReminder *> *)reminders;
+ (NSArray *)serializeAttendees:(NSArray<EKParticipant *> *)attendees;

@end
