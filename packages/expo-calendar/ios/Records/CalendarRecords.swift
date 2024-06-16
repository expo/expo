import ExpoModulesCore

enum CalendarEntity: String, Enumerable {
  case event
  case reminder
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
  var creationDate: Either<String, Double>?
  @Field
  var lastModifiedDate: Either<String, Double>?
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
  var startDate: Either<String, Double>?
  @Field
  var endDate: Either<String, Double>?
  @Field
  var originalStartDate: String?
  @Field
  var isDetached: Bool?
  @Field
  var instanceStartDate: Either<String, Double>?
  @Field
  var allDay: Bool
  @Field
  var availability: String
  @Field
  var status: String
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
  var creationDate: Either<String, Double>?
  @Field
  var lastModifiedDate: Either<String, Double>?
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
  var startDate: Either<String, Double>?
  @Field
  var dueDate: Either<String, Double>?
  @Field
  var completed: Bool?
  @Field
  var completionDate: Either<String, Double>?
}
