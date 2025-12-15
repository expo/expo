import ExpoModulesCore

enum NonGregorianBirthdayCalendar: String, Enumerable {
  case buddhist = "buddhist"
  case chinese = "chinese"
  case coptic = "coptic"
  case ethiopicAmeteMihret = "ethiopicAmeteMihret"
  case ethiopicAmeteAlem = "ethiopicAmeteAlem"
  case hebrew = "hebrew"
  case indian = "indian"
  case islamic = "islamic"
  case islamicCivil = "islamicCivil"
  case japanese = "japanese"
  case persian = "persian"
  case republicOfChina = "republicOfChina"
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
