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
  @Field var year: String?
  @Field var month: String
  @Field var day: String
  @Field var calendar: NonGregorianBirthdayCalendar = .islamic
  
  init() {}
  
  init(year: String?, month: String, day: String, calendar: NonGregorianBirthdayCalendar) {
    self.year = year
    self.month = month
    self.day = day
    self.calendar = calendar
  }
}
