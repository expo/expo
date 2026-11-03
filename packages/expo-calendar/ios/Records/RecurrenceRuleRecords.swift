import ExpoModulesCore
import EventKit

struct RecurrenceRule: Record {
  @Field
  var frequency: String
  @Field
  var interval: Int?
  @Field
  var endDate: Either<String, Double>?
  @Field
  var occurrence: Int?
  @Field
  var daysOfTheWeek: [DaysOfTheWeek]?
  @Field
  var daysOfTheMonth: [Int]?
  @Field
  var monthsOfTheYear: [MonthOfTheYear]?
  @Field
  var weeksOfTheYear: [Int]?
  @Field
  var daysOfTheYear: [Int]?
  @Field
  var setPositions: [Int]?
}

struct DaysOfTheWeek: Record {
  @Field
  var dayOfTheWeek: DayOfTheWeek = .sunday
  @Field
  var weekNumber: Int
}

enum MonthOfTheYear: Int, Enumerable {
  case january = 1
  case february = 2
  case march = 3
  case april = 4
  case may = 5
  case june = 6
  case july = 7
  case august = 8
  case september = 9
  case october = 10
  case november = 11
  case december = 12
}

// Raw values match the JS `DayOfTheWeek` enum and `EKWeekday`: Sunday is 1 and Saturday is 7.
enum DayOfTheWeek: Int, Enumerable {
  case sunday = 1
  case monday = 2
  case tuesday = 3
  case wednesday = 4
  case thursday = 5
  case friday = 6
  case saturday = 7

  func toEKType() -> EKWeekday {
    switch self {
    case .monday:
      return .monday
    case .tuesday:
      return .tuesday
    case .wednesday:
      return .wednesday
    case .thursday:
      return .thursday
    case .friday:
      return .friday
    case .saturday:
      return .saturday
    case .sunday:
      return .sunday
    }
  }
}
