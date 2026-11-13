import Testing

@testable import ExpoLocation

@Suite("LocationUpdatesTaskOptions")
struct LocationUpdatesTaskOptionsTests {
  @Test(arguments: [
    Profile.default,
    Profile.automotiveNavigation,
    Profile.otherNavigation,
    Profile.fitness,
    Profile.airborne,
    Profile.lowPower
  ])
  func `a profile survives a round trip through the task dictionary`(profile: Profile) {
    let parsed = LocationUpdatesTaskOptions(LocationUpdatesTaskOptions(profile: profile).toDictionary())

    #expect(parsed.profile == profile)
  }

  @Test
  func `parses a known profile`() {
    #expect(LocationUpdatesTaskOptions(["profile": "airborne"]).profile == .airborne)
  }

  @Test
  func `falls back to the default profile when options are not the required shape`() {
    let malformedOptions: [[AnyHashable: Any]?] = [
      nil,
      [:],
      ["profile": 123],
      ["profile": "not-a-profile"]
    ]
    for options in malformedOptions {
      #expect(LocationUpdatesTaskOptions(options).profile == .default)
    }
  }
}
