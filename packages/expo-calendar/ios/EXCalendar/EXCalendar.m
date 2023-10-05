// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EventKit/EventKit.h>

#import <ExpoModulesCore/EXUtilities.h>

#import <EXCalendar/EXCalendar.h>
#import <EXCalendar/EXCalendarConverter.h>
#import <EXCalendar/EXCalendarPermissionRequester.h>
#import <EXCalendar/EXRemindersPermissionRequester.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

@interface EXCalendar ()

@property (nonatomic, strong) EKEventStore *eventStore;
@property (nonatomic) BOOL isAccessToEventStoreGranted;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic) EKEntityMask permittedEntities;

@end

@implementation EXCalendar

- (instancetype)init
{
  if (self = [super init]) {
    _permittedEntities = 0;
  }
  
  return self;
}

EX_EXPORT_MODULE(ExpoCalendar);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[
                                                    [EXCalendarPermissionRequester new],
                                                    [EXRemindersPermissionRequester new]
                                                    ]
                           withPermissionsManager:_permissionsManager];
}

#pragma mark -
#pragma mark Event Store Initialize

- (EKEventStore *)eventStore
{
  if (!_eventStore) {
    _eventStore = [[EKEventStore alloc] init];
    [self _initializePermittedEntities];
  }
  return _eventStore;
}

#pragma mark -
#pragma mark Event Store Accessors

EX_EXPORT_METHOD_AS(getCalendarsAsync,
                    getCalendarsAsync:(NSString *)typeString
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSArray *calendars;
  if (!typeString) {
    if(![self _checkCalendarPermissions:reject] || ![self _checkRemindersPermissions:reject]) {
      return;
    }
    
    NSArray *eventCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeEvent];
    NSArray *reminderCalendars = [self.eventStore calendarsForEntityType:EKEntityTypeReminder];
    calendars = [eventCalendars arrayByAddingObjectsFromArray:reminderCalendars];
  } else if ([typeString isEqualToString:@"event"]) {
    if (![self _checkCalendarPermissions:reject]) {
      return;
    }
    
    calendars = [self.eventStore calendarsForEntityType:EKEntityTypeEvent];
  } else if ([typeString isEqualToString:@"reminder"]) {
    if (![self _checkRemindersPermissions:reject]) {
      return;
    }
    
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

EX_EXPORT_METHOD_AS(getDefaultCalendarAsync,
                    getDefaultCalendarAsync:(EXPromiseResolveBlock)resolve
                    rejector:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  EKCalendar *defaultCalendar = [self.eventStore defaultCalendarForNewEvents];
  if (defaultCalendar == nil) {
    return reject(@"E_CALENDARS_NOT_FOUND", @"Could not find default calendars", nil);
  }
  resolve([EXCalendarConverter serializeCalendar:defaultCalendar]);
}

EX_EXPORT_METHOD_AS(saveCalendarAsync,
                    saveCalendarAsync:(NSDictionary *)details
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  EKCalendar *calendar = nil;
  NSString *title = details[@"title"];
  NSNumber *color = details[@"color"];
  NSString *sourceId = details[@"sourceId"];
  NSString *type = details[@"entityType"];
  NSString *calendarId = details[@"id"];

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
    } else {
      calendar.source = [type isEqualToString:@"event"] ? self.eventStore.defaultCalendarForNewEvents.source : self.eventStore.defaultCalendarForNewReminders.source;
    }
  }

  if (title) {
    calendar.title = title;
  }

  if (color) {
    calendar.CGColor = [EXUtilities UIColor:color].CGColor;
  } else if (details[@"color"] == [NSNull null]) {
    calendar.CGColor = nil;
  }

  NSError *error = nil;
  BOOL success = [self.eventStore saveCalendar:calendar commit:YES error:&error];
  if (success) {
    resolve(calendar.calendarIdentifier);
  } else {
    reject(@"E_CALENDAR_NOT_SAVED",
           [NSString stringWithFormat:@"Calendar '%@' could not be saved: %@", title, error.description],
         error);
  }
}

EX_EXPORT_METHOD_AS(deleteCalendarAsync,
                    deleteCalendarAsync:(NSString *)calendarId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
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

EX_EXPORT_METHOD_AS(getEventsAsync,
                    getEventsAsync:(NSString *)startDateStr
                    endDate:(NSString *)endDateStr
                    calendars:(NSArray *)calendars
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  NSMutableArray *eventCalendars;
  NSDate *startDate = [EXUtilities NSDate:startDateStr];
  NSDate *endDate = [EXUtilities NSDate:endDateStr];

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

EX_EXPORT_METHOD_AS(getEventByIdAsync,
                    getEventByIdAsync:(NSString *)eventId
                    startDate:(NSString *)startDateStr
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  NSDate *startDate = [EXUtilities NSDate:startDateStr];
  EKEvent *calendarEvent = [self _getEventWithId:eventId startDate:startDate];

  if (calendarEvent) {
    resolve([EXCalendarConverter serializeCalendarEvent:calendarEvent]);
  } else {
    reject(@"E_EVENT_NOT_FOUND",
         [NSString stringWithFormat:@"Event with id %@ could not be found", eventId],
         nil);
  }
}

EX_EXPORT_METHOD_AS(saveEventAsync,
                    saveEventAsync:(NSDictionary *)details
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  EKEvent *calendarEvent = nil;
  NSString *calendarId = details[@"calendarId"];
  NSString *eventId = details[@"id"];
  NSString *title = details[@"title"];
  NSString *location = details[@"location"];
  NSDate *startDate = [EXUtilities NSDate:details[@"startDate"]];
  NSDate *endDate = [EXUtilities NSDate:details[@"endDate"]];
  NSDate *instanceStartDate = [EXUtilities NSDate:details[@"instanceStartDate"]];
  NSNumber *allDay = details[@"allDay"];
  NSString *notes = details[@"notes"];
  NSString *timeZone = details[@"timeZone"];
  NSString *url = details[@"url"];
  NSArray *alarms = details[@"alarms"];
  NSDictionary *recurrenceRule = details[@"recurrenceRule"];
  NSString *availability = details[@"availability"];

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
      
      calendarEvent = [EKEvent eventWithEventStore:self.eventStore];
      calendarEvent.calendar = calendar;
    } else {
        reject(@"E_INVALID_CALENDAR_ID", @"CalendarId is required.", nil);
        return; 
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

  if (details[@"timeZone"] == [NSNull null]) {
    calendarEvent.timeZone = nil;
  } else if (timeZone) {
    NSTimeZone *eventTimeZone = [NSTimeZone timeZoneWithName:timeZone];
    if (eventTimeZone) {
      calendarEvent.timeZone = eventTimeZone;
    } else {
      return reject(@"E_EVENT_INVALID_TIMEZONE", @"Invalid timeZone", nil);
    }
  }

  if (alarms) {
    calendarEvent.alarms = [self _createCalendarEventAlarms:alarms];
  } else if (details[@"alarms"] == [NSNull null]) {
    calendarEvent.alarms = nil;
  }

  if (recurrenceRule) {
    EKRecurrenceRule *rule = [self _createRecurrenceRule:recurrenceRule];
    if (rule) {
      calendarEvent.recurrenceRules = @[ rule ];
    }
  } else if (details[@"recurrenceRule"] == [NSNull null]) {
    calendarEvent.recurrenceRules = nil;
  }

  if (url) {
    NSURLComponents *URLComponents = [NSURLComponents componentsWithString:url];
    if (URLComponents && URLComponents.URL) {
      calendarEvent.URL = URLComponents.URL;
    }
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
         [NSString stringWithFormat:@"Event with id %@ was not saved. %@", calendarEvent.calendarItemIdentifier, error.description],
         error);
  }
}

EX_EXPORT_METHOD_AS(deleteEventAsync,
                    deleteEventAsync:(NSDictionary *)event
                    options:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  NSNumber *futureEvents = options[@"futureEvents"];
  EKSpan span = EKSpanThisEvent;
  if ([futureEvents boolValue] == YES) {
    span = EKSpanFutureEvents;
  }

  NSDate *instanceStartDate = [EXUtilities NSDate:event[@"instanceStartDate"]];

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

EX_EXPORT_METHOD_AS(getAttendeesForEventAsync,
                    getAttendeesForEventAsync:(NSDictionary *)event
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkCalendarPermissions:reject]) {
    return;
  }

  NSDate *instanceStartDate = [EXUtilities NSDate:event[@"instanceStartDate"]];

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

EX_EXPORT_METHOD_AS(getRemindersAsync,
                    getRemindersAsync:(NSString * _Nullable)startDateStr
                    endDate:(NSString * _Nullable)endDateStr
                    calendars:(NSArray *)calendars
                    status:(NSString * _Nullable)status
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkRemindersPermissions:reject]) {
    return;
  }

  NSMutableArray *reminderCalendars;
  NSDate *startDate = [EXUtilities NSDate:startDateStr];
  NSDate *endDate = [EXUtilities NSDate:endDateStr];

  if (calendars && calendars.count) {
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

EX_EXPORT_METHOD_AS(getReminderByIdAsync,
                    getReminderByIdAsync:(NSString *)reminderId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkRemindersPermissions:reject]) {
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

EX_EXPORT_METHOD_AS(saveReminderAsync,
                    saveReminderAsync:(NSDictionary *)details
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkRemindersPermissions:reject]) {
    return;
  }

  EKReminder *reminder = nil;
  NSString *calendarId = details[@"calendarId"];
  NSString *reminderId = details[@"id"];
  NSDate *startDate = [EXUtilities NSDate:details[@"startDate"]];
  NSDate *dueDate = [EXUtilities NSDate:details[@"dueDate"]];
  NSDate *completionDate = [EXUtilities NSDate:details[@"completionDate"]];
  NSNumber *completed = details[@"completed"];
  NSString *title = details[@"title"];
  NSString *location = details[@"location"];
  NSString *notes = details[@"notes"];
  NSString *timeZone = details[@"timeZone"];
  NSArray *alarms = details[@"alarms"];
  NSDictionary *recurrenceRule = details[@"recurrenceRule"];
  NSString *url = details[@"url"];

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

  if (details[@"timeZone"] == [NSNull null]) {
    reminder.timeZone = nil;
  } else if (timeZone) {
    NSTimeZone *eventTimeZone = [NSTimeZone timeZoneWithName:timeZone];
    if (eventTimeZone) {
      reminder.timeZone = eventTimeZone;
    } else {
      return reject(@"E_EVENT_INVALID_TIMEZONE", @"Invalid timeZone", nil);
    }
  }

  if (alarms) {
    reminder.alarms = [self _createCalendarEventAlarms:alarms];
  } else if (details[@"alarms"] == [NSNull null]) {
    reminder.alarms = nil;
  }

  if (recurrenceRule) {
    EKRecurrenceRule *rule = [self _createRecurrenceRule:recurrenceRule];
    if (rule) {
      reminder.recurrenceRules = @[ rule ];
    }
  } else if (details[@"recurrenceRule"] == [NSNull null]) {
    reminder.recurrenceRules = nil;
  }

  if (url) {
    NSURLComponents *URLComponents = [NSURLComponents componentsWithString:url];
    if (URLComponents && URLComponents.URL) {
      reminder.URL = URLComponents.URL;
    }
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
         [NSString stringWithFormat:@"Reminder with id %@ was not saved. %@", reminder.calendarItemIdentifier, error.description],
         error);
  }
}

EX_EXPORT_METHOD_AS(deleteReminderAsync,
                    deleteReminderAsync:(NSString *)reminderId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self _checkRemindersPermissions:reject]) {
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
         [NSString stringWithFormat:@"Reminder with id %@ could not be removed. %@", reminderId, error.description],
         error);
  }
}

EX_EXPORT_METHOD_AS(getSourcesAsync,
                    getSourcesAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(getSourceByIdAsync,
                    getSourceByIdAsync:(NSString *)sourceId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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

EX_EXPORT_METHOD_AS(getCalendarPermissionsAsync,
                    getCalendarPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXCalendarPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

EX_EXPORT_METHOD_AS(requestCalendarPermissionsAsync,
                    requestCalendarPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXCalendarPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];  
}

EX_EXPORT_METHOD_AS(getRemindersPermissionsAsync,
                    getRemindersPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXRemindersPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

EX_EXPORT_METHOD_AS(requestRemindersPermissionsAsync,
                    requestRemindersPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXRemindersPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

#pragma mark - helpers

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

  NSDate *date = [EXUtilities NSDate:alarm[@"absoluteDate"]];
  NSNumber *relativeOffset = alarm[@"relativeOffset"];

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

- (NSArray *)_stringArrayToIntArray:(NSArray *)array
{
  if (!array) {
    return array;
  }

  NSMutableArray *ret = [[NSMutableArray alloc] init];

  for (NSString *item in array) {
    [ret addObject:[NSNumber numberWithInteger: [item integerValue]]];
  }

  return ret;
}

- (EKRecurrenceRule *)_createRecurrenceRule:(NSDictionary *)recurrenceRule
{
  NSString *frequency = recurrenceRule[@"frequency"];
  NSArray *validFrequencyTypes = @[@"daily", @"weekly", @"monthly", @"yearly"];
  NSInteger interval = [recurrenceRule[@"interval"] integerValue];
  NSInteger occurrence = [recurrenceRule[@"occurrence"] integerValue];
  NSDate *endDate = nil;

  if (!frequency || ![validFrequencyTypes containsObject:frequency]) {
    return nil;
  }

  if (recurrenceRule[@"endDate"]) {
      endDate = [EXUtilities NSDate:recurrenceRule[@"endDate"]];
  }

  NSMutableArray *daysOfTheWeek = nil;
  NSArray *daysOfTheMonth = [self _stringArrayToIntArray: recurrenceRule[@"daysOfTheMonth"]];
  NSArray *monthsOfTheYear = [self _stringArrayToIntArray: recurrenceRule[@"monthsOfTheYear"]];
  NSArray *weeksOfTheYear = [self _stringArrayToIntArray: recurrenceRule[@"weeksOfTheYear"]];
  NSArray *daysOfTheYear = [self _stringArrayToIntArray: recurrenceRule[@"daysOfTheYear"]];
  NSArray *setPositions = [self _stringArrayToIntArray: recurrenceRule[@"setPositions"]];

  if (recurrenceRule[@"daysOfTheWeek"]) {
    daysOfTheWeek = [[NSMutableArray alloc] init];

    for (NSDictionary *item in recurrenceRule[@"daysOfTheWeek"]) {
      [daysOfTheWeek addObject:[[EKRecurrenceDayOfWeek alloc] initWithDayOfTheWeek:[item[@"dayOfTheWeek"] integerValue]
                    weekNumber:[item[@"weekNumber"] integerValue]]];
    }
  }

  EKRecurrenceEnd *recurrenceEnd = nil;
  NSInteger recurrenceInterval = 1;
  if (endDate) {
    recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithEndDate:endDate];
  } else if (occurrence && occurrence > 0) {
    recurrenceEnd = [EKRecurrenceEnd recurrenceEndWithOccurrenceCount:occurrence];
  }

  if (interval > 1) {
    recurrenceInterval = interval;
  }

  EKRecurrenceRule *rule = [[EKRecurrenceRule alloc] initRecurrenceWithFrequency:[self _recurrenceFrequency:frequency]
                            interval:recurrenceInterval
                       daysOfTheWeek:daysOfTheWeek
                      daysOfTheMonth:daysOfTheMonth
                     monthsOfTheYear:monthsOfTheYear
                      weeksOfTheYear:weeksOfTheYear
                       daysOfTheYear:daysOfTheYear
                        setPositions:setPositions
                                 end:recurrenceEnd];
  return rule;
}

- (EKRecurrenceFrequency)_recurrenceFrequency:(NSString *)name
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

- (BOOL)_checkPermissions:(EKEntityType)entity reject:(EXPromiseRejectBlock)reject
{
  if (_eventStore && _permittedEntities & entity) {
    return YES;
  }
  
  Class requesterClass;
  switch (entity) {
    case EKEntityTypeEvent:
      requesterClass = [EXCalendarPermissionRequester class];
      break;
    case EKEntityTypeReminder:
      requesterClass = [EXRemindersPermissionRequester class];
      break;
    default: {
      NSString *errorMessage = [NSString stringWithFormat:@"Unknown entity: %lu.", (unsigned long)entity];
      reject(@"ERR_UNKNOWN_ENTITY", errorMessage, nil);
      return NO;
    }
  }
  
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:requesterClass]) {
    NSString *errorMessage = [NSString stringWithFormat:@"%@ permission is required to do this operation.", [[requesterClass permissionType] uppercaseString]];
    reject(@"ERR_MISSING_PERMISSION", errorMessage, nil);
    return NO;
  }
  
  [self _resetEventStoreIfPermissionsWasChanged:1 << entity];  
  return YES;
}

- (BOOL)_checkCalendarPermissions:(EXPromiseRejectBlock)reject
{
  return [self _checkPermissions:EKEntityTypeEvent reject:reject];
}

- (BOOL)_checkRemindersPermissions:(EXPromiseRejectBlock)reject
{
  return [self _checkPermissions:EKEntityTypeReminder reject:reject];
}

- (void)_initializePermittedEntities
{
  EKEntityMask permittedEntities = 0;
  if ([_permissionsManager hasGrantedPermissionUsingRequesterClass:[EXCalendarPermissionRequester class]]) {
    permittedEntities |= EKEntityMaskEvent;
  }
  
  if ([_permissionsManager hasGrantedPermissionUsingRequesterClass:[EXRemindersPermissionRequester class]]) {
    permittedEntities |= EKEntityMaskReminder;
  }
  
  _permittedEntities = permittedEntities;
}

// During the construction, EKEventStore checks permissions and loads data to which has access.
// If the user granted only partial permission and called a Calendar function, we get as a result an EKEventStore object only contains one type of entity.
// However, in the future user can add permission, so we need to reset EKEventStore to get all available data.
- (void)_resetEventStoreIfPermissionsWasChanged:(EKEntityMask)newEntity
{
  if (!_eventStore) {
    return;
  }
  
  if ((_permittedEntities & newEntity) == newEntity) {
    return;
  }
  [self.eventStore reset]; // We can safely reset the store, cause all changes are committed immediately.
  _permittedEntities |= newEntity;
}
@end
