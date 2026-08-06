import DeclaredAgeRange
import ExpoModulesCore

internal enum AgeRangeDeclaration: String, Enumerable {
  case selfDeclared
  case guardianDeclared
  case confirmed

  @available(iOS 26.0, *)
  public init(_ range: AgeRangeService.AgeRangeDeclaration) {
    switch range {
    case .selfDeclared:
      self = .selfDeclared
    case .guardianDeclared:
      self = .guardianDeclared
    #if compiler(>=6.3.2) // Xcode 26.5+ (Swift 6.3.2) ships the iOS 26.5 SDK that declares `confirmed`.
    case .confirmed:
      self = .confirmed
    #endif
    // iOS 26.2 added six cases for an age the system verified rather than one a person declared, and
    // iOS 26.5 deprecated all six in favour of `confirmed`.
    #if compiler(>=6.2.3) // Xcode 26.2+ (Swift 6.2.3) ships the iOS 26.2 SDK that declares these six.
    case .checkedByOtherMethod, .guardianCheckedByOtherMethod,
      .governmentIDChecked, .guardianGovernmentIDChecked,
      .paymentChecked, .guardianPaymentChecked:
      self = .confirmed
    #endif
    @unknown default:
      // Fall back to the least assurance we can claim, so an unrecognised value can't loosen an age gate
      log.error(
        "Unhandled `AgeRangeService.AgeRangeDeclaration` value: \(range), reporting `selfDeclared` as fallback. Either the value was added in an iOS SDK newer than the one you build against — build with a newer Xcode — or expo-age-range needs to map it, in which case report it at github.com/expo/expo/issues."
      )
      self = .selfDeclared
    }
  }
}

internal struct AgeRangeResponse: Record {
  @Field
  var lowerBound: Int?
  @Field
  var upperBound: Int?
  @Field
  var ageRangeDeclaration: AgeRangeDeclaration?
  @Field
  var activeParentalControls: [String] = []

  public init() {
    // limited response used by iOS < 26, simulating an adult
    self.lowerBound = 18
  }

  @available(iOS 26.0, *)
  public init(_ range: AgeRangeService.AgeRange) {
    self.lowerBound = range.lowerBound
    self.upperBound = range.upperBound
    self.ageRangeDeclaration = range.ageRangeDeclaration.map(AgeRangeDeclaration.init)

    if range.activeParentalControls.contains(.communicationLimits) {
      self.activeParentalControls.append("communicationLimits")
    }
  }
}

internal struct AgeRangeRequestParams: Record {
  @Field
  var threshold1: Int
  @Field
  var threshold2: Int?
  @Field
  var threshold3: Int?
}
