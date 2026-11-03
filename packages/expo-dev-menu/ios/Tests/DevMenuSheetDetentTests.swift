import CoreGraphics
import Testing

@testable import EXDevMenu

@Suite("Dev menu sheet detent")
struct DevMenuSheetDetentTests {
  @Test
  func `uses the default fraction without onboarding`() {
    #expect(DevMenuSheetDetent.height(maximum: 800, onboardingHeight: nil) == 480)
  }

  @Test
  func `grows to fit onboarding taller than the default`() {
    #expect(DevMenuSheetDetent.height(maximum: 620, onboardingHeight: 500) == 500)
  }

  @Test
  func `keeps the default for onboarding shorter than the default`() {
    #expect(DevMenuSheetDetent.height(maximum: 800, onboardingHeight: 300) == 480)
  }

  @Test
  func `clamps onboarding taller than the maximum`() {
    #expect(DevMenuSheetDetent.height(maximum: 620, onboardingHeight: 900) == 620)
  }
}
