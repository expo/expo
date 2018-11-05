// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCalendar.h"
#import "EXCalendarConverter.h"
#import "EXScopedModuleRegistry.h"
#import "EXCalendarRequester.h"
#import "EXRemindersRequester.h"

#import <EXPermissions/EXPermissions.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>
#import <EventKit/EventKit.h>
#import <UIKit/UIKit.h>

@interface EXCalendar ()

@property (nonatomic, strong) EKEventStore *eventStore;
@property (nonatomic) BOOL isAccessToEventStoreGranted;
@property (nonatomic, weak) id<EXPermissionsScopedModuleDelegate> kernelPermissionsServiceDelegate;

@end

@implementation EXCalendar

@synthesize bridge = _bridge;

EX_EXPORT_SCOPED_MODULE(ExponentCalendar, PermissionsManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id<EXPermissionsScopedModuleDelegate>)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelPermissionsServiceDelegate = kernelServiceInstance;
  }
  return self;
}

#pragma mark -
#pragma mark Event Store Initialize

- (EKEventStore *)eventStore
{
  if (!_eventStore) {
    _eventStore = [[EKEventStore alloc] init];
  }
  return _eventStore;
}

#pragma mark -
#pragma mark Event Store Accessors

RCT_EXPORT_METHOD(getCalendarsAsync:(NSString *)typeString resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }

  NSArray *calendars;
  if (!typeString) {
    NSArray *eventCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeEvent];
    NSArray *reminderCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeReminder];
    calendars = [eventCalendars arrayByAddingObjectsFromArray:reminderCalendars];
  } else if ([typeString isEqualToString:@"event"]) {
    calendars = [self.eventStore calendarsForEntityType:EKEntityTypeEvent];
  } else if ([typeString isEqualToString:@"reminder"]) {
    calendars = [self.eventStore calendarsForEntityType:EKEntityTypeReminder];
  } else {
    reject(@"E_INVALID_CALENDAR_ENTITY_TYPE",
         [NSString stringWithFormat:@"Calendar entityType %@ is not supported", typeString],
         nil);
    return;
  }

  if (!calendars) {
    reject(@"E_CALENDARS_NOT_FOUND", @"Could not find calendars", nil);
    return;
  }

  resolve([EXCalendarConverter serializeCalendars:calendars]);
}

RCT_EXPORT_METHOD(saveCalendarAsync:(NSDictionary *)details resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  EKCalendar *calendar = nil;
  NSString *title = [RCTConvert NSString:details[@"title"]];
  NSNumber *color = [RCTConvert NSNumber:details[@"color"]];
  NSString *sourceId = [RCTConvert NSString:details[@"sourceId"]];
  NSString *type = [RCTConvert NSString:details[@"entityType"]];
  NSString *calendarId = [RCTConvert NSString:details[@"id"]];

  if (calendarId) {
    calendar = [self.eventStore calendarWithIdentifier:calendarId];

    if (calendar.immutable == YES) {
      reject(@"E_CALENDAR_NOT_SAVED",
         [NSString stringWithFormat:@"Calendar %@ is immutable and cannot be modified", title],
         nil);
      return;
    }
  } else {
    if ([type isEqualToString:@"event"]) {
      calendar = [EKCalendar calendarForEntityType:EKEntityTypeEvent eventStore:self.eventStore];
    } else if ([type isEqualToString:@"reminder"]) {
      calendar = [EKCalendar calendarForEntityType:EKEntityTypeReminder eventStore:self.eventStore];
    } else {
      reject(@"E_INVALID_CALENDAR_ENTITY_TYPE",
           [NSString stringWithFormat:@"Calendar entityType %@ is not supported", type],
           nil);
      return;
    }

    if (sourceId) {
      calendar.source = [self.eventStore sourceWithIdentifier:sourceId];
    }
  }

  if (title) {
    calendar.title = title;
  }

  if (color) {
    calendar.CGColor = [RCTConvert UIColor:color].CGColor;
  } else if (details[@"color"] == [NSNull null]) {
    calendar.CGColor = nil;
  }

  NSError *error = nil;
  BOOL success = [self.eventStore saveCalendar:calendar commit:YES error:&error];
  if (success) {
    resolve(calendar.calendarIdentifier);
  } else {
    reject(@"E_CALENDAR_NOT_SAVED",
         [NSString stringWithFormat:@"Calendar %@ could not be saved", title],
         error);
  }
}

RCT_EXPORT_METHOD(deleteCalendarAsync:(NSString *)calendarId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  EKCalendar *calendar = [self.eventStore calendarWithIdentifier:calendarId];
  if (!calendar) {
    reject(@"E_INVALID_CALENDAR_ID",
         [NSString stringWithFormat:@"Calendar with id %@ could not be found", calendarId],
         nil);
    return;
  }
  NSError *error = nil;
  BOOL success = [self.eventStore removeCalendar:calendar commit:YES error:&error];
  if (success) {
    resolve(nil);
  } else {
    reject(@"E_CALENDAR_NOT_DELETED",
         [NSString stringWithFormat:@"Calendar with id %@ could not be removed", calendarId],
         error);
  }
}

RCT_EXPORT_METHOD(getEventsAsync:(NSDate *)startDate endDate:(NSDate *)endDate calendars:(NSArray *)calendars resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  NSMutableArray *eventCalendars;

  if (calendars.count) {
    eventCalendars = [[NSMutableArray alloc] init];
    NSArray *deviceCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeEvent];

    for (EKCalendar *calendar in deviceCalendars) {
      if ([calendars containsObject:calendar.calendarIdentifier]) {
        [eventCalendars addObject:calendar];
      }
    }
  }

  NSPredicate *predicate = [self.eventStore predicateForEventsWithStartDate:startDate
                                    endDate:endDate
                                  calendars:eventCalendars];

  NSArray *calendarEvents = [[self.eventStore eventsMatchingPredicate:predicate] sortedArrayUsingSelector:@selector(compareStartDateWithEvent:)];

  if (calendarEvents) {
    resolve([EXCalendarConverter serializeCalendarEvents:calendarEvents]);
  } else if (calendarEvents == nil) {
    resolve(@[]);
  } else {
    reject(@"E_EVENTS_NOT_FOUND", @"Events could not be found", nil);
  }
}

RCT_EXPORT_METHOD(getEventByIdAsync:(NSString *)eventId startDate:(NSDate *)startDate resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  EKEvent *calendarEvent = [self _getEventWithId:eventId startDate:startDate];

  if (calendarEvent) {
    resolve([EXCalendarConverter serializeCalendarEvent:calendarEvent]);
  } else {
    reject(@"E_EVENT_NOT_FOUND",
         [NSString stringWithFormat:@"Event with id %@ could not be found", eventId],
         nil);
  }
}

RCT_EXPORT_METHOD(saveEventAsync:(NSDictionary *)details options:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  EKEvent *calendarEvent = nil;
  NSString *calendarId;
  if (details[@"calendarId"]) {
    calendarId = [RCTConvert NSString:details[@"calendarId"]];
  }
  NSString *eventId = [RCTConvert NSString:details[@"id"]];
  NSString *title = [RCTConvert NSString:details[@"title"]];
  NSString *location = [RCTConvert NSString:details[@"location"]];
  NSDate *startDate = [RCTConvert NSDate:details[@"startDate"]];
  NSDate *endDate = [RCTConvert NSDate:details[@"endDate"]];
  NSDate *instanceStartDate = [RCTConvert NSDate:details[@"instanceStartDate"]];
  NSNumber *allDay = [RCTConvert NSNumber:details[@"allDay"]];
  NSString *notes = [RCTConvert NSString:details[@"notes"]];
  NSString *timeZone = [RCTConvert NSString:details[@"timeZone"]];
  NSString *url = [RCTConvert NSString:details[@"url"]];
  NSArray *alarms = [RCTConvert NSArray:details[@"alarms"]];
  NSDictionary *recurrenceRule = [RCTConvert NSDictionary:details[@"recurrenceRule"]];
  NSString *availability = [RCTConvert NSString:details[@"availability"]];

  NSNumber *futureEvents = options[@"futureEvents"];
  EKSpan span = EKSpanThisEvent;
  if ([futureEvents boolValue] == YES) {
    span = EKSpanFutureEvents;
  }

  if (eventId) {
    calendarEvent = [self _getEventWithId:eventId startDate:instanceStartDate];

    if (!calendarEvent) {
      reject(@"E_EVENT_NOT_SAVED",
         [NSString stringWithFormat:@"Event with id %@ could not be updated because it doesn't exist", eventId],
         nil);
      return;
    }
  } else {
    calendarEvent = [EKEvent eventWithEventStore:self.eventStore];
    calendarEvent.calendar = [self.eventStore defaultCalendarForNewEvents];

    if (calendarId) {
      EKCalendar *calendar = [self.eventStore calendarWithIdentifier:calendarId];
      if (!calendar) {
        reject(@"E_INVALID_CALENDAR_ID",
             [NSString stringWithFormat:@"Calendar with id %@ could not be found", calendarId],
             nil);
        return;
      }
      if (calendar.allowedEntityTypes ^ EKEntityMaskEvent) {
        reject(@"E_INVALID_CALENDAR_ID",
             [NSString stringWithFormat:@"Calendar with id %@ is not of type `event`", calendarId],
             nil);
        return;
      }
      calendarEvent.calendar = calendar;
    }
  }

  if (title) {
    calendarEvent.title = title;
  } else if (details[@"title"] == [NSNull null]) {
    calendarEvent.title = nil;
  }

  if (location) {
    calendarEvent.location = location;
  } else if (details[@"location"] == [NSNull null]) {
    calendarEvent.location = nil;
  }

  if (notes) {
    calendarEvent.notes = notes;
  } else if (details[@"notes"] == [NSNull null]) {
    calendarEvent.notes = nil;
  }

  if (timeZone) {
    calendarEvent.timeZone = [NSTimeZone timeZoneWithName:timeZone];
  } else if (details[@"timeZone"] == [NSNull null]) {
    calendarEvent.timeZone = nil;
  }

  if (alarms) {
    calendarEvent.alarms = [self _createCalendarEventAlarms:alarms];
  } else if (details[@"alarms"] == [NSNull null]) {
    calendarEvent.alarms = nil;
  }

  if (recurrenceRule) {
    NSString *frequency = [RCTConvert NSString:recurrenceRule[@"frequency"]];
    NSInteger interval = [RCTConvert NSInteger:recurrenceRule[@"interval"]];
    NSInteger occurrence = [RCTConvert NSInteger:recurrenceRule[@"occurrence"]];
    NSDate *endDate = nil;
    if (recurrenceRule[@"endDate"]) {
      endDate = [RCTConvert NSDate:recurrenceRule[@"endDate"]];
    }

    EKRecurrenceRule *rule = [self _createRecurrenceRule:frequency interval:interval occurrence:occurrence endDate:endDate];
    if (rule) {
      calendarEvent.recurrenceRules = @[ rule ];
    }
  } else if (details[@"recurrenceRule"] == [NSNull null]) {
    calendarEvent.recurrenceRules = nil;
  }

  NSURL *URL = [NSURL URLWithString:[url stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]]];
  if (URL) {
    calendarEvent.URL = URL;
  } else if (details[@"url"] == [NSNull null]) {
    calendarEvent.URL = nil;
  }

  if (startDate) {
    calendarEvent.startDate = startDate;
  } else if (details[@"startDate"] == [NSNull null]) {
    calendarEvent.startDate = nil;
  }

  if (endDate) {
    calendarEvent.endDate = endDate;
  } else if (details[@"endDate"] == [NSNull null]) {
    calendarEvent.endDate = nil;
  }

  if (allDay) {
    calendarEvent.allDay = [allDay boolValue];
  }

  if (availability) {
    calendarEvent.availability = [self _availabilityConstant:availability];
  }

  NSError *error = nil;
  BOOL success = [self.eventStore saveEvent:calendarEvent span:span commit:YES error:&error];

  if (success) {
    resolve(calendarEvent.calendarItemIdentifier);
  } else {
    reject(@"E_EVENT_NOT_SAVED",
         [NSString stringWithFormat:@"Event with id %@ was not saved", calendarEvent.calendarItemIdentifier],
         error);
  }
}

RCT_EXPORT_METHOD(deleteEventAsync:(NSDictionary *)event options:(NSDictionary *)options resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  NSNumber *futureEvents = options[@"futureEvents"];
  EKSpan span = EKSpanThisEvent;
  if ([futureEvents boolValue] == YES) {
    span = EKSpanFutureEvents;
  }

  NSDate *instanceStartDate = [RCTConvert NSDate:event[@"instanceStartDate"]];

  EKEvent *calendarEvent = [self _getEventWithId:event[@"id"] startDate:instanceStartDate];

  if (!calendarEvent) {
    resolve(nil);
    return;
  }

  NSError *error = nil;
  BOOL success = [self.eventStore removeEvent:calendarEvent span:span commit:YES error:&error];
  if (success) {
    resolve(nil);
  } else {
    reject(@"E_EVENT_NOT_DELETED",
         [NSString stringWithFormat:@"Event with id %@ could not be deleted", event[@"id"]],
         error);
  }
}

RCT_EXPORT_METHOD(getAttendeesForEventAsync:(NSDictionary *)event resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXCalendarRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"calendar" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing calendar permission.", nil);
    return;
  }
  NSDate *instanceStartDate = [RCTConvert NSDate:event[@"instanceStartDate"]];

  EKEvent *item = [self _getEventWithId:event[@"id"] startDate:instanceStartDate];

  if (!item) {
  return reject(@"E_EVENT_NOT_FOUND",
          [NSString stringWithFormat:@"Event with id %@ could not be found", event[@"id"]],
          nil);
  }

  if (item.hasAttendees) {
    resolve([EXCalendarConverter serializeAttendees:item.attendees]);
  } else {
    resolve([[NSArray alloc] init]);
  }
}

RCT_EXPORT_METHOD(getRemindersAsync:(NSDate * _Nullable)startDate endDate:(NSDate * _Nullable)endDate calendars:(NSArray *)calendars status:(NSString * _Nullable)status resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXRemindersRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"reminders" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing reminders permission.", nil);
    return;
  }
  NSMutableArray *reminderCalendars;

  if (calendars.count) {
    reminderCalendars = [[NSMutableArray alloc] init];
    NSArray *deviceCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeReminder];

    for (EKCalendar *calendar in deviceCalendars) {
      if ([calendars containsObject:calendar.calendarIdentifier]) {
        [reminderCalendars addObject:calendar];
      }
    }
  } else {
    reject(@"E_MISSING_PARAMETER",
         @"`Calendar.getRemindersAsync` needs at least one calendar ID",
         nil);
    return;
  }

  NSPredicate *predicate;
  if (status && [status isEqualToString:@"incomplete"]) {
    predicate = [self.eventStore predicateForIncompleteRemindersWithDueDateStarting:startDate ending:endDate calendars:reminderCalendars];
  } else if (status && [status isEqualToString:@"completed"]) {
    predicate = [self.eventStore predicateForCompletedRemindersWithCompletionDateStarting:startDate ending:endDate calendars:reminderCalendars];
  } else {
    predicate = [self.eventStore predicateForRemindersInCalendars:reminderCalendars];
  }

  [self.eventStore fetchRemindersMatchingPredicate:predicate completion:^(NSArray<EKReminder *> *reminders) {
    if (!reminders) {
      resolve(@[]);
    } else {
      resolve([EXCalendarConverter serializeReminders:reminders]);
    }
  }];
}

RCT_EXPORT_METHOD(getReminderByIdAsync:(NSString *)reminderId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXRemindersRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"reminders" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing reminders permission.", nil);
    return;
  }
  EKReminder *reminder = (EKReminder *)[self.eventStore calendarItemWithIdentifier:reminderId];

  if (reminder) {
    if (![reminder isKindOfClass:[EKReminder class]]) {
      reject(@"E_REMINDER_NOT_FOUND",
          [NSString stringWithFormat:@"ID %@ does not belong to a reminder", reminderId],
          nil);
      return;
    }
    resolve([EXCalendarConverter serializeReminder:reminder]);
  } else {
    reject(@"E_REMINDER_NOT_FOUND",
         [NSString stringWithFormat:@"Reminder with id %@ could not be found", reminderId],
         nil);
  }
}

RCT_EXPORT_METHOD(saveReminderAsync:(NSDictionary *)details resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXRemindersRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"reminders" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing reminders permission.", nil);
    return;
  }
  EKReminder *reminder = nil;
  NSString *calendarId;
  if (details[@"calendarId"]) {
    calendarId = [RCTConvert NSString:details[@"calendarId"]];
  }
  NSString *reminderId = [RCTConvert NSString:details[@"id"]];
  NSDate *startDate = [RCTConvert NSDate:details[@"startDate"]];
  NSDate *dueDate = [RCTConvert NSDate:details[@"dueDate"]];
  NSNumber *completed = [RCTConvert NSNumber:details[@"completed"]];
  NSDate *completionDate = [RCTConvert NSDate:details[@"completionDate"]];
  NSString *title = [RCTConvert NSString:details[@"title"]];
  NSString *location = [RCTConvert NSString:details[@"location"]];
  NSString *notes = [RCTConvert NSString:details[@"notes"]];
  NSString *timeZone = [RCTConvert NSString:details[@"timeZone"]];
  NSArray *alarms = [RCTConvert NSArray:details[@"alarms"]];
  NSDictionary *recurrenceRule = [RCTConvert NSDictionary:details[@"recurrenceRule"]];
  NSString *url = [RCTConvert NSString:details[@"url"]];

  NSCalendar *currentCalendar = [NSCalendar currentCalendar];

  if (reminderId) {
    reminder = (EKReminder *)[self.eventStore calendarItemWithIdentifier:reminderId];
  } else {
    reminder = [EKReminder reminderWithEventStore:self.eventStore];
    reminder.calendar = [self.eventStore defaultCalendarForNewReminders];
    if (calendarId) {
      EKCalendar *calendar = [self.eventStore calendarWithIdentifier:calendarId];
      if (!calendar) {
        reject(@"E_INVALID_CALENDAR_ID",
             [NSString stringWithFormat:@"Calendar with id %@ could not be found", calendarId],
             nil);
        return;
      }
      if (calendar.allowedEntityTypes ^ EKEntityMaskReminder) {
        reject(@"E_INVALID_CALENDAR_ID",
             [NSString stringWithFormat:@"Calendar with id %@ is not of type `reminder`", calendarId],
             nil);
        return;
      }
      reminder.calendar = calendar;
    }
  }

  if (title) {
    reminder.title = title;
  } else if (details[@"title"] == [NSNull null]) {
    reminder.title = nil;
  }

  if (location) {
    reminder.location = location;
  } else if (details[@"location"] == [NSNull null]) {
    reminder.location = nil;
  }

  if (notes) {
    reminder.notes = notes;
  } else if (details[@"notes"] == [NSNull null]) {
    reminder.notes = nil;
  }

  if (timeZone) {
    reminder.timeZone = [NSTimeZone timeZoneWithName:timeZone];
  } else if (details[@"timeZone"] == [NSNull null]) {
    reminder.timeZone = nil;
  }

  if (alarms) {
    reminder.alarms = [self _createCalendarEventAlarms:alarms];
  } else if (details[@"alarms"] == [NSNull null]) {
    reminder.alarms = nil;
  }

  if (recurrenceRule) {
    NSString *frequency = [RCTConvert NSString:recurrenceRule[@"frequency"]];
    NSInteger interval = [RCTConvert NSInteger:recurrenceRule[@"interval"]];
    NSInteger occurrence = [RCTConvert NSInteger:recurrenceRule[@"occurrence"]];
    NSDate *endDate = nil;
    if (recurrenceRule[@"endDate"]) {
      endDate = [RCTConvert NSDate:recurrenceRule[@"endDate"]];
    }

    EKRecurrenceRule *rule = [self _createRecurrenceRule:frequency interval:interval occurrence:occurrence endDate:endDate];
    if (rule) {
      reminder.recurrenceRules = @[ rule ];
    }
  } else if (details[@"recurrenceRule"] == [NSNull null]) {
    reminder.recurrenceRules = nil;
  }

  NSURL *URL = [NSURL URLWithString:[url stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLHostAllowedCharacterSet]]];
  if (URL) {
    reminder.URL = URL;
  } else if (details[@"url"] == [NSNull null]) {
    reminder.URL = nil;
  }

  if (startDate) {
    NSDateComponents *startDateComponents = [currentCalendar components:(NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond) fromDate:startDate];
    reminder.startDateComponents = startDateComponents;
  } else if (details[@"startDate"] == [NSNull null]) {
    reminder.startDateComponents = nil;
  }

  if (dueDate) {
    NSDateComponents *dueDateComponents = [currentCalendar components:(NSCalendarUnitYear | NSCalendarUnitMonth | NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute | NSCalendarUnitSecond) fromDate:dueDate];
    reminder.dueDateComponents = dueDateComponents;
  } else if (details[@"dueDate"] == [NSNull null]) {
    reminder.dueDateComponents = nil;
  }

  if (completed) {
    reminder.completed = [completed boolValue];
  }

  if (completionDate) {
    reminder.completionDate = completionDate;
  } else if (details[@"completionDate"] == [NSNull null]) {
    reminder.completionDate = nil;
  }

  NSError *error = nil;
  BOOL success = [self.eventStore saveReminder:reminder commit:YES error:&error];
  if (success) {
    resolve(reminder.calendarItemIdentifier);
  } else {
    reject(@"E_REMINDER_NOT_SAVED",
         [NSString stringWithFormat:@"Reminder with id %@ was not saved", reminder.calendarItemIdentifier],
         error);
  }
}

RCT_EXPORT_METHOD(deleteReminderAsync:(NSString *)reminderId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([EXPermissions statusForPermissions:[EXRemindersRequester permissions]] != EXPermissionStatusGranted ||
      ![_kernelPermissionsServiceDelegate hasGrantedPermission:@"reminders" forExperience:self.experienceId]) {
    reject(@"E_MISSING_PERMISSION", @"Missing reminders permission.", nil);
    return;
  }
  EKReminder *reminder = (EKReminder *)[self.eventStore calendarItemWithIdentifier:reminderId];
  if (!reminder) {
    reject(@"E_INVALID_REMINDER_ID",
         [NSString stringWithFormat:@"Reminder with id %@ could not be found", reminderId],
         nil);
    return;
  }
  NSError *error = nil;
  BOOL success = [self.eventStore removeReminder:reminder commit:YES error:&error];
  if (success) {
    resolve(nil);
  } else {
    reject(@"E_REMINDER_NOT_DELETED",
         [NSString stringWithFormat:@"Reminder with id %@ could not be removed", reminderId],
         error);
  }
}

RCT_EXPORT_METHOD(getSourcesAsync:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray *sources = [self.eventStore sources];

  if (!sources) {
    reject(@"E_SOURCE_NOT_FOUND",
         @"Sources could not be found",
         nil);
    return;
  }

  NSMutableArray *serializedSources = [[NSMutableArray alloc] init];
  for (EKSource *source in sources) {
    [serializedSources addObject:[EXCalendarConverter serializeSource:source]];
  }
  resolve(serializedSources);
}

RCT_EXPORT_METHOD(getSourceByIdAsync:(NSString *)sourceId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  EKSource *source = [self.eventStore sourceWithIdentifier:sourceId];
  if (!source) {
    reject(@"E_SOURCE_NOT_FOUND",
         [NSString stringWithFormat:@"Source with id %@ was not found", sourceId],
         nil);
    return;
  }

  resolve([EXCalendarConverter serializeSource:source]);
}

- (EKEvent * _Nullable)_getEventWithId:(NSString *)eventId startDate:(NSDate * _Nullable)startDate
{
  EKEvent *firstEvent = (EKEvent *)[self.eventStore calendarItemWithIdentifier:eventId];

  if (!firstEvent) {
    return nil;
  }

  if (!startDate) {
    return firstEvent;
  }

  if (firstEvent && firstEvent.startDate && [firstEvent.startDate compare:startDate] == NSOrderedSame) {
    return firstEvent;
  }

  EKCalendar *calendar = firstEvent.calendar;
  // add one month to startDate to get end of interval to search in - this should catch everything
  // we will take the first event in this interval
  NSDate *endDate = [startDate dateByAddingTimeInterval:2592000];
  NSArray<EKEvent *> *events = [self.eventStore eventsMatchingPredicate:[self.eventStore predicateForEventsWithStartDate:startDate endDate:endDate calendars:@[ calendar ]]];

  for (EKEvent *event in events) {
    if (![event.calendarItemIdentifier isEqualToString:eventId]) {
      break;
    }
    if (event.startDate && [event.startDate compare:startDate] == NSOrderedSame) {
      return event;
    }
  }
  return nil;
}

- (EKAlarm *)_createCalendarEventAlarm:(NSDictionary *)alarm
{
  EKAlarm *calendarEventAlarm = nil;

  NSDate *date = [RCTConvert NSDate:alarm[@"absoluteDate"]];
  NSNumber *relativeOffset = [RCTConvert NSNumber:alarm[@"relativeOffset"]];

  if (date) {
    calendarEventAlarm = [EKAlarm alarmWithAbsoluteDate:date];
  } else if (relativeOffset) {
    calendarEventAlarm = [EKAlarm alarmWithRelativeOffset:(60 * [relativeOffset intValue])];
  } else {
    calendarEventAlarm = [[EKAlarm alloc] init];
  }

  if ([alarm objectForKey:@"structuredLocation"] && [[alarm objectForKey:@"structuredLocation"] count]) {
    NSDictionary *locationOptions = [alarm valueForKey:@"structuredLocation"];
    NSDictionary *geo = [locationOptions valueForKey:@"coords"];
    CLLocation *geoLocation = [[CLLocation alloc] initWithLatitude:[[geo valueForKey:@"latitude"] doubleValue]
                               longitude:[[geo valueForKey:@"longitude"] doubleValue]];

    calendarEventAlarm.structuredLocation = [EKStructuredLocation locationWithTitle:[locationOptions valueForKey:@"title"]];
    calendarEventAlarm.structuredLocation.geoLocation = geoLocation;
    calendarEventAlarm.structuredLocation.radius = [[locationOptions valueForKey:@"radius"] doubleValue];

    if ([[locationOptions valueForKey:@"proximity"] isEqualToString:@"enter"]) {
      calendarEventAlarm.proximity = EKAlarmProximityEnter;
    } else if ([[locationOptions valueForKey:@"proximity"] isEqualToString:@"leave"]) {
      calendarEventAlarm.proximity = EKAlarmProximityLeave;
    } else {
      calendarEventAlarm.proximity = EKAlarmProximityNone;
    }
  }
  return calendarEventAlarm;
}

- (NSArray *)_createCalendarEventAlarms:(NSArray *)alarms
{
  NSMutableArray *calendarEventAlarms = [[NSMutableArray alloc] init];
  for (NSDictionary *alarm in alarms) {
    if ([alarm count] && ([alarm valueForKey:@"absoluteDate"] || [alarm valueForKey:@"relativeOffset"] || [alarm objectForKey:@"structuredLocation"])) {
      EKAlarm *reminderAlarm = [self _createCalendarEventAlarm:alarm];
      [calendarEventAlarms addObject:reminderAlarm];
    }
  }
  return [calendarEventAlarms copy];
}

-(EKRecurrenceRule *)_createRecurrenceRule:(NSString *)frequency interval:(NSInteger)interval occurrence:(NSInteger)occurrence endDate:(NSDate *)endDate
{
  EKRecurrenceRule *rule = nil;
  EKRecurrenceEnd *recurrenceEnd = nil;
  NSInteger recurrenceInterval = 1;
  NSArray *validFrequencyTypes = @[@"daily", @"weekly", @"monthly", @"yearly"];

  if (frequency && [validFrequencyTypes containsObject:frequency]) {

    if (endDate) {
      recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithEndDate:endDate];
    } else if (occurrence && occurrence > 0) {
      recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:occurrence];
    }

    if (interval > 1) {
      recurrenceInterval = interval;
    }

    rule = [[EKRecurrenceRule alloc] initRecurrenceWithFrequency:[self _recurrenceFrequency:frequency]
                              interval:recurrenceInterval
                                 end:recurrenceEnd];
  }
  return rule;
}

-(EKRecurrenceFrequency)_recurrenceFrequency:(NSString *)name
{
  if ([name isEqualToString:@"weekly"]) {
    return EKRecurrenceFrequencyWeekly;
  }
  if ([name isEqualToString:@"monthly"]) {
    return EKRecurrenceFrequencyMonthly;
  }
  if ([name isEqualToString:@"yearly"]) {
    return EKRecurrenceFrequencyYearly;
  }
  return EKRecurrenceFrequencyDaily;
}

- (EKEventAvailability)_availabilityConstant:(NSString *)string
{
  if([string isEqualToString:@"busy"]) {
    return EKEventAvailabilityBusy;
  }
  if([string isEqualToString:@"free"]) {
    return EKEventAvailabilityFree;
  }
  if([string isEqualToString:@"tentative"]) {
    return EKEventAvailabilityTentative;
  }
  if([string isEqualToString:@"unavailable"]) {
    return EKEventAvailabilityUnavailable;
  }
  return EKEventAvailabilityNotSupported;
}

@end
