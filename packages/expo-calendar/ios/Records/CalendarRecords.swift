import ExpoModulesCore

enum CalendarEntity: String, Enumerable {
  case event, reminder
}

struct CalendarRecord: Record {
  @Field
  var id: String?
  @Field
  var title: String
  @Field
  var sourceId: String?
  @Field
  var source: Source
  @Field
  var type: String?
  @Field
  var color: Int
  @Field
  var entityType: CalendarEntity?
  @Field
  var allowsModifications: Bool
  @Field
  var allowedAvailabilities: [String]
}

struct Source: Record {
  @Field
  var id: String?
  @Field
  var type: String
  @Field
  var name: String
  @Field
  var isLocalAccount: Bool?
}

struct Event: Record {
  @Field
  var id: String?
  @Field
  var calendarId: String?
  @Field
  var title: String
  @Field
  var location: String
  @Field
  var creationDate: String?
  @Field
  var lastModifiedDate: String?
  @Field
  var timeZone: String?
  @Field
  var url: String?
  @Field
  var notes: String
  @Field
  var alarms: [Alarm]
  @Field
  var recurrenceRule: RecurrenceRule?
  @Field
  var startDate: String
  @Field
  var endDate: String
  @Field
  var originalStartDate: String?
  @Field
  var isDetached: Bool?
  @Field
  var instanceStartDate: String?
  @Field
  var allDay: Bool
  @Field
  var availability: String
  @Field
  var status: String
}

struct Alarm: Record {
  @Field
  var absoluteDate: String?
  @Field
  var relativeOffset: Int?
  @Field
  var structuredLocation: AlarmLocation?
  @Field
  var method: String?
}

struct AlarmLocation: Record {
  @Field
  var title: String
  @Field
  var proximity: String?
  @Field
  var radius: Double?
  @Field
  var coords: Coordinates?
}

struct Coordinates: Record {
  @Field
  var latitude: Double
  @Field
  var longitude: Double
}

struct RecurringEventOptions: Record {
  @Field
  var futureEvents: Bool?
  @Field
  var instanceStartDate: String?
}

struct Reminder: Record {
  @Field
  var id: String?
  @Field
  var calendarId: String?
  @Field
  var title: String?
  @Field
  var location: String?
  @Field
  var creationDate: String?
  @Field
  var lastModifiedDate: String?
  @Field
  var timeZone: String?
  @Field
  var url: String?
  @Field
  var notes: String?
  @Field
  var alarms: [Alarm]?
  @Field
  var recurrenceRule: RecurrenceRule?
  @Field
  var startDate: String?
  @Field
  var dueDate: String?
  @Field
  var completed: Bool?
  @Field
  var completionDate: String?
}
