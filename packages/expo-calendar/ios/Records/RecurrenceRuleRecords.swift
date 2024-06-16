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

enum DayOfTheWeek: Int, Enumerable {
  case monday = 1
  case tuesday = 2
  case wednesday = 3
  case thursday = 4
  case friday = 5
  case saturday = 6
  case sunday = 7

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
