import ExpoModulesCore

enum NonGregorianBirthdayCalendar: String, Enumerable {
  case buddhist
  case chinese
  case coptic
  case ethiopicAmeteMihret
  case ethiopicAmeteAlem
  case hebrew
  case indian
  case islamic
  case islamicCivil
  case japanese
  case persian
  case republicOfChina
}

struct NonGregorianBirthday: Record {
  @Field var year: Int?
  @Field var month: Int
  @Field var day: Int
  @Field var calendar: NonGregorianBirthdayCalendar = .islamic

  init() {}

  init(year: Int?, month: Int, day: Int, calendar: NonGregorianBirthdayCalendar) {
    if let year = year {
      self.year = year
    }
    self.month = month
    self.day = day
    self.calendar = calendar
  }
}
