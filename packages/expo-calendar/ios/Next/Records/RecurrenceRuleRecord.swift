import ExpoModulesCore

internal struct RecurrenceRuleNext: Record {
  @Field
  var endDate: String? = nil

  @Field
  var frequency: String? = nil

  @Field
  var interval: Int? = nil

  @Field
  var occurrence: Int? = nil

  @Field
  var daysOfTheWeek: [[String: Int?]]? = nil

  @Field
  var daysOfTheMonth: [Int]? = nil

  @Field
  var daysOfTheYear: [Int]? = nil

  @Field
  var monthsOfTheYear: [Int]? = nil

  @Field
  var setPositions: [Int]? = nil
}
