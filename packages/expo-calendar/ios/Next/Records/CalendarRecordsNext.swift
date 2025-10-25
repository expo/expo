import ExpoModulesCore

struct CalendarRecordNext: Record {
  @Field
  var id: String?
  @Field
  var title: String?
  @Field
  var sourceId: String?
  @Field
  var source: Source
  @Field
  var type: String?
  @Field
  var color: UIColor?
  @Field
  var entityType: CalendarEntity?
  @Field
  var allowsModifications: Bool
  @Field
  var allowedAvailabilities: [String]
}

struct EventNext: Record {
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
  var endDate: Either<String, Double>?
  @Field
  var originalStartDate: String?
  @Field
  var isDetached: Bool?
  @Field
  var instanceStartDate: Either<String, Double>?
  @Field
  var allDay: Bool?
  @Field
  var availability: String?
  @Field
  var status: String?
}
