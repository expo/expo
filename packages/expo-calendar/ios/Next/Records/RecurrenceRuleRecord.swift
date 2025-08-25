import ExpoModulesCore

internal struct RecurrenceRuleNext: Record {
  @Field
  var endDate: String?

  @Field
  var frequency: String?

  @Field
  var interval: Int?

  @Field
  var occurrence: Int?

  @Field
  var daysOfTheWeek: [[String: Int?]]?

  @Field
  var daysOfTheMonth: [Int]?

  @Field
  var daysOfTheYear: [Int]?

  @Field
  var monthsOfTheYear: [Int]?

  @Field
  var setPositions: [Int]?
}
