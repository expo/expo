// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0EXCalendar/ABI42_0_0EXCalendarConverter.h>

@implementation ABI42_0_0EXCalendarConverter

+ (NSString *)_recurrenceFrequency:(EKRecurrenceFrequency)frequency
{
  if (frequency == EKRecurrenceFrequencyDaily) return @"daily";
  if (frequency == EKRecurrenceFrequencyWeekly) return @"weekly";
  if (frequency == EKRecurrenceFrequencyMonthly) return @"monthly";
  if (frequency == EKRecurrenceFrequencyYearly) return @"yearly";
  return @"none";
}

+ (NSString *)_calendarType:(EKCalendarType)type
{
  if (type == EKCalendarTypeLocal) return @"local";
  if (type == EKCalendarTypeCalDAV) return @"caldav";
  if (type == EKCalendarTypeExchange) return @"exchange";
  if (type == EKCalendarTypeSubscription) return @"subscribed";
  if (type == EKCalendarTypeBirthday) return @"birthdays";
  return @"unknown";
}

+ (NSString *)_entityType:(EKEntityMask)entityType
{
  BOOL allowsEvents = entityType & EKEntityMaskEvent;
  BOOL allowsReminders = entityType & EKEntityMaskReminder;

  if (allowsEvents && allowsReminders) {
    return @"both";
  }
  if (allowsReminders) {
    return @"reminder";
  }
  if (allowsEvents) {
    return @"event";
  }
  return nil;
}

+ (NSString *)_eventAvailability:(EKEventAvailability)availability
{
  if (availability == EKEventAvailabilityNotSupported) return @"notSupported";
  if (availability == EKEventAvailabilityBusy) return @"busy";
  if (availability == EKEventAvailabilityFree) return @"free";
  if (availability == EKEventAvailabilityTentative) return @"tentative";
  if (availability == EKEventAvailabilityUnavailable) return @"unavailable";
  return @"none";
}

+ (NSString *)_eventStatus:(EKEventStatus)status
{
  if (status == EKEventStatusNone) return @"none";
  if (status == EKEventStatusConfirmed) return @"confirmed";
  if (status == EKEventStatusTentative) return @"tentative";
  if (status == EKEventStatusCanceled) return @"canceled";
  return @"none";
}

+ (NSString *)_sourceType:(EKSourceType)type
{
  if (type == EKSourceTypeLocal) return @"local";
  if (type == EKSourceTypeExchange) return @"exchange";
  if (type == EKSourceTypeCalDAV) return @"caldav";
  if (type == EKSourceTypeMobileMe) return @"mobileme";
  if (type == EKSourceTypeSubscribed) return @"subscribed";
  if (type == EKSourceTypeBirthdays) return @"birthdays";
  return @"none";
}

+ (NSString *)_participantRole:(EKParticipantRole)role
{
  if (role == EKParticipantRoleUnknown) return @"unknown";
  if (role == EKParticipantRoleRequired) return @"required";
  if (role == EKParticipantRoleOptional) return @"optional";
  if (role == EKParticipantRoleChair) return @"chair";
  if (role == EKParticipantRoleNonParticipant) return @"nonParticipant";
  return @"none";
}

+ (NSString *)_participantStatus:(EKParticipantStatus)status
{
  if (status == EKParticipantStatusUnknown) return @"unknown";
  if (status == EKParticipantStatusPending) return @"pending";
  if (status == EKParticipantStatusAccepted) return @"accepted";
  if (status == EKParticipantStatusDeclined) return @"declined";
  if (status == EKParticipantStatusTentative) return @"tentative";
  if (status == EKParticipantStatusDelegated) return @"delegated";
  if (status == EKParticipantStatusCompleted) return @"completed";
  if (status == EKParticipantStatusInProcess) return @"inProcess";
  return @"none";
}

+ (NSString *)_participantType:(EKParticipantType)type
{
  if (type == EKParticipantTypeUnknown) return @"unknown";
  if (type == EKParticipantTypePerson) return @"person";
  if (type == EKParticipantTypeRoom) return @"room";
  if (type == EKParticipantTypeGroup) return @"group";
  if (type == EKParticipantTypeResource) return @"resource";
  return @"none";
}

+ (NSMutableArray *)_calendarSupportedAvailabilitiesFromMask:(EKCalendarEventAvailabilityMask)types
{
  NSMutableArray *availabilitiesStrings = [[NSMutableArray alloc] init];

  if(types & EKCalendarEventAvailabilityBusy) [availabilitiesStrings addObject:@"busy"];
  if(types & EKCalendarEventAvailabilityFree) [availabilitiesStrings addObject:@"free"];
  if(types & EKCalendarEventAvailabilityTentative) [availabilitiesStrings addObject:@"tentative"];
  if(types & EKCalendarEventAvailabilityUnavailable) [availabilitiesStrings addObject:@"unavailable"];

  return availabilitiesStrings;
}

+ (NSDictionary *)serializeSource:(EKSource *)source
{
  if (!source) {
    return nil;
  }
  return @{
       @"id": source.sourceIdentifier,
       @"type": [ABI42_0_0EXCalendarConverter _sourceType:source.sourceType],
       @"name": ABI42_0_0UMNullIfNil(source.title)
       };
}

+ (NSMutableDictionary *)serializeCalendar:(EKCalendar *)calendar
{
  NSMutableDictionary *serializedCalendar = [[NSMutableDictionary alloc] init];

  serializedCalendar[@"id"] = ABI42_0_0UMNullIfNil(calendar.calendarIdentifier);
  serializedCalendar[@"title"] = ABI42_0_0UMNullIfNil(calendar.title);
  serializedCalendar[@"source"] = ABI42_0_0UMNullIfNil([ABI42_0_0EXCalendarConverter serializeSource:calendar.source]);
  serializedCalendar[@"entityType"] = [ABI42_0_0EXCalendarConverter _entityType:calendar.allowedEntityTypes];
  serializedCalendar[@"color"] = calendar.CGColor ? [ABI42_0_0UMUtilities hexStringWithCGColor:calendar.CGColor] : [NSNull null];
  serializedCalendar[@"type"] = [ABI42_0_0EXCalendarConverter _calendarType:calendar.type];
  serializedCalendar[@"allowsModifications"] = @(calendar.allowsContentModifications);
  serializedCalendar[@"allowedAvailabilities"] = [ABI42_0_0EXCalendarConverter _calendarSupportedAvailabilitiesFromMask:calendar.supportedEventAvailabilities];

  return serializedCalendar;
}

+ (NSArray *)serializeCalendars:(NSArray *)calendars
{
  NSMutableArray *serializedCalendars = [[NSMutableArray alloc] init];

  for (EKCalendar *calendar in calendars) {
    [serializedCalendars addObject:[ABI42_0_0EXCalendarConverter serializeCalendar:calendar]];
  }

  return serializedCalendars;
}

+ (NSMutableDictionary *)_serializeCalendarItem:(EKCalendarItem *)item withDateFormatter:(NSDateFormatter *)dateFormatter
{
  NSMutableDictionary *serializedItem = [[NSMutableDictionary alloc] init];

  if (item.calendarItemIdentifier) {
    serializedItem[@"id"] = item.calendarItemIdentifier;
  }

  if (item.calendar) {
    serializedItem[@"calendarId"] = item.calendar.calendarIdentifier;
  }

  if (item.title) {
    serializedItem[@"title"] = item.title;
  }

  if (item.location) {
    serializedItem[@"location"] = item.location;
  }

  if (item.creationDate) {
    serializedItem[@"creationDate"] = [dateFormatter stringFromDate:item.creationDate];
  }

  if (item.lastModifiedDate) {
    serializedItem[@"lastModifiedDate"] = [dateFormatter stringFromDate:item.lastModifiedDate];
  }

  serializedItem[@"timeZone"] = ABI42_0_0UMNullIfNil(item.timeZone.name);
  serializedItem[@"url"] = ABI42_0_0UMNullIfNil(item.URL.absoluteString.stringByRemovingPercentEncoding);
  serializedItem[@"notes"] = ABI42_0_0UMNullIfNil(item.notes);
  serializedItem[@"alarms"] = [ABI42_0_0EXCalendarConverter _serializeAlarms:item.alarms withDateFormatter:dateFormatter];

  if (item.hasRecurrenceRules) {
    EKRecurrenceRule *rule = [item.recurrenceRules objectAtIndex:0];
    NSString *frequencyType = [ABI42_0_0EXCalendarConverter _recurrenceFrequency:[rule frequency]];

    NSMutableDictionary *recurrenceRule = [NSMutableDictionary dictionaryWithDictionary:@{@"frequency": frequencyType}];

    if ([rule interval]) {
      recurrenceRule[@"interval"] = @([rule interval]);
    }

    if ([[rule recurrenceEnd] endDate]) {
      recurrenceRule[@"endDate"] = [dateFormatter stringFromDate:[[rule recurrenceEnd] endDate]];
    }

    if ([[rule recurrenceEnd] occurrenceCount]) {
      recurrenceRule[@"occurrence"] = @([[rule recurrenceEnd] occurrenceCount]);
    }

    if ([rule daysOfTheWeek]) {
      NSMutableArray *daysOfTheWeek = [[NSMutableArray alloc] init];

      for (EKRecurrenceDayOfWeek *dayOfTheWeek in [rule daysOfTheWeek]) {
        [daysOfTheWeek addObject:@{@"dayOfTheWeek":@([dayOfTheWeek dayOfTheWeek]),
                   @"weekNumber":@([dayOfTheWeek weekNumber])}];
      }
      recurrenceRule[@"daysOfTheWeek"] = daysOfTheWeek;
    }

    if ([rule daysOfTheMonth]) {
      recurrenceRule[@"daysOfTheMonth"] = [rule daysOfTheMonth];
    }

    if ([rule daysOfTheYear]) {
      recurrenceRule[@"daysOfTheYear"] = [rule daysOfTheYear];
    }

    if ([rule weeksOfTheYear]) {
      recurrenceRule[@"weeksOfTheYear"] = [rule weeksOfTheYear];
    }

    if ([rule monthsOfTheYear]) {
      recurrenceRule[@"monthsOfTheYear"] = [rule monthsOfTheYear];
    }

    if ([rule setPositions]) {
      recurrenceRule[@"setPositions"] = [rule setPositions];
    }

    serializedItem[@"recurrenceRule"] = recurrenceRule;
  }

  return serializedItem;
}

+ (NSArray *)serializeCalendarEvents:(NSArray *)calendarEvents
{
  NSMutableArray *serializedCalendarEvents = [[NSMutableArray alloc] init];

  for (EKEvent *event in calendarEvents) {

    [serializedCalendarEvents addObject:[ABI42_0_0EXCalendarConverter serializeCalendarEvent:event]];
  }

  return serializedCalendarEvents;
}

+ (NSDictionary *)serializeCalendarEvent:(EKEvent *)event
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
  [dateFormatter setTimeZone:timeZone];
  [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
  [dateFormatter setDateFormat: @"yyyy-MM-dd'T'HH:mm:ss.SSS'Z"];


  NSMutableDictionary *formedCalendarEvent = [ABI42_0_0EXCalendarConverter _serializeCalendarItem:event withDateFormatter:dateFormatter];

  if (event.startDate) {
    formedCalendarEvent[@"startDate"] = [dateFormatter stringFromDate:event.startDate];
  }

  if (event.endDate) {
    formedCalendarEvent[@"endDate"] = [dateFormatter stringFromDate:event.endDate];
  }

  if (event.occurrenceDate) {
    formedCalendarEvent[@"originalStartDate"] = [dateFormatter stringFromDate:event.occurrenceDate];
  }

  formedCalendarEvent[@"isDetached"] = [NSNumber numberWithBool:event.isDetached];
  formedCalendarEvent[@"allDay"] = [NSNumber numberWithBool:event.allDay];
  formedCalendarEvent[@"availability"] = [ABI42_0_0EXCalendarConverter _eventAvailability:event.availability];
  formedCalendarEvent[@"status"] = [ABI42_0_0EXCalendarConverter _eventStatus:event.status];
  formedCalendarEvent[@"organizer"] = ABI42_0_0UMNullIfNil([ABI42_0_0EXCalendarConverter _serializeAttendee:event.organizer]);

  return formedCalendarEvent;
}

+ (NSArray *)serializeReminders:(NSArray<EKReminder *> *)reminders
{
  NSMutableArray *serializedReminders = [[NSMutableArray alloc] init];

  for (EKReminder *reminder in reminders) {
    [serializedReminders addObject:[ABI42_0_0EXCalendarConverter serializeReminder:reminder]];
  }

  return serializedReminders;
}

+ (NSDictionary *)serializeReminder:(EKReminder *)reminder
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
  [dateFormatter setTimeZone:timeZone];
  [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
  [dateFormatter setDateFormat: @"yyyy-MM-dd'T'HH:mm:ss.SSS'Z"];
  NSCalendar *currentCalendar = [NSCalendar currentCalendar];

  NSMutableDictionary *formedReminder = [ABI42_0_0EXCalendarConverter _serializeCalendarItem:reminder withDateFormatter:dateFormatter];

  if (reminder.startDateComponents) {
    NSDate *startDate = [currentCalendar dateFromComponents:reminder.startDateComponents];
    formedReminder[@"startDate"] = [dateFormatter stringFromDate:startDate];
  }

  if (reminder.dueDateComponents) {
    NSDate *dueDate = [currentCalendar dateFromComponents:reminder.dueDateComponents];
    formedReminder[@"dueDate"] = [dateFormatter stringFromDate:dueDate];
  }

  formedReminder[@"completed"] = @(reminder.completed);

  if (reminder.completionDate) {
    formedReminder[@"completionDate"] = [dateFormatter stringFromDate:reminder.completionDate];
  }

  return formedReminder;
}

+ (NSArray *)serializeAttendees:(NSArray<EKParticipant *> *)attendees
{
  NSMutableArray *serializedAttendees = [[NSMutableArray alloc] init];

  for (EKParticipant *attendee in attendees) {
    [serializedAttendees addObject:[ABI42_0_0EXCalendarConverter _serializeAttendee:attendee]];
  }

  return serializedAttendees;
}

+ (NSDictionary *)_serializeAttendee:(EKParticipant *)attendee
{
  if (!attendee) {
    return nil;
  }
  NSDictionary *emptyAttendee = @{
                  @"isCurrentUser": @"",
                  @"name": @"",
                  @"role": @"",
                  @"status": @"",
                  @"type": @"",
                  @"url": @""
                  };

  NSMutableDictionary *formedAttendee = [NSMutableDictionary dictionaryWithDictionary:emptyAttendee];

  formedAttendee[@"isCurrentUser"] = @(attendee.currentUser);

  if (attendee.name) {
    formedAttendee[@"name"] = attendee.name;
  }

  if (attendee.participantRole) {
    formedAttendee[@"role"] = [ABI42_0_0EXCalendarConverter _participantRole:attendee.participantRole];
  }

  if (attendee.participantStatus) {
    formedAttendee[@"status"] = [ABI42_0_0EXCalendarConverter _participantStatus:attendee.participantStatus];
  }

  if (attendee.participantType) {
    formedAttendee[@"type"] = [ABI42_0_0EXCalendarConverter _participantType:attendee.participantType];
  }

  if (attendee.URL) {
    formedAttendee[@"url"] = attendee.URL.absoluteString.stringByRemovingPercentEncoding;
  }

  return formedAttendee;
}

+ (NSArray<NSDictionary *> *)_serializeAlarms:(NSArray<EKAlarm *> *)alarms withDateFormatter:(NSDateFormatter *)dateFormatter
{
  NSMutableArray *serializedAlarms = [[NSMutableArray alloc] init];

  for (EKAlarm *alarm in alarms) {
    NSMutableDictionary *formattedAlarm = [[NSMutableDictionary alloc] init];

    if (alarm.absoluteDate) {
      formattedAlarm[@"absoluteDate"] = [dateFormatter stringFromDate:alarm.absoluteDate];
    }
    if (alarm.relativeOffset) {
      formattedAlarm[@"relativeOffset"] = @(alarm.relativeOffset / 60.0);
    }
    if (alarm.structuredLocation) {
      NSString *proximity = nil;
      switch (alarm.proximity) {
        case EKAlarmProximityEnter:
          proximity = @"enter";
          break;
        case EKAlarmProximityLeave:
          proximity = @"leave";
          break;
        default:
          proximity = @"None";
          break;
      }
      formattedAlarm[@"structuredLocation"] = @{
                                                @"title": alarm.structuredLocation.title,
                                                @"proximity": proximity,
                                                @"radius": @(alarm.structuredLocation.radius),
                                                @"coords": @{
                                                    @"latitude": @(alarm.structuredLocation.geoLocation.coordinate.latitude),
                                                    @"longitude": @(alarm.structuredLocation.geoLocation.coordinate.longitude)
                                                    }
                                                };

    }
    [serializedAlarms addObject:formattedAlarm];
  }
  return serializedAlarms;
}

@end
