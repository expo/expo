import Contacts

/**
 Translates between Apple's predefined `CNLabeledValue` label constants and the
 stable, semantic keys that the JavaScript API exposes.

 Apple stores a predefined label as an opaque constant, for example
 `_$!<Home>!$_`. The Android implementation and the TypeScript types both use
 short keys like `"home"` and `"work"` instead, so iOS maps the constants to the
 same keys. Labels that Apple does not predefine are custom labels and pass
 through unchanged in both directions.
 */
enum ContactLabelMapper {
  private static let cnLabelToRecordLabel: [String: String] = [
    // Generic labels, used by every labeled field.
    CNLabelHome: "home",
    CNLabelWork: "work",
    CNLabelSchool: "school",
    CNLabelOther: "other",
    // Phone numbers.
    CNLabelPhoneNumberiPhone: "iPhone",
    CNLabelPhoneNumberMobile: "mobile",
    CNLabelPhoneNumberMain: "main",
    CNLabelPhoneNumberHomeFax: "faxHome",
    CNLabelPhoneNumberWorkFax: "faxWork",
    CNLabelPhoneNumberOtherFax: "otherFax",
    CNLabelPhoneNumberPager: "pager",
    // Email addresses.
    CNLabelEmailiCloud: "iCloud",
    // URL addresses.
    CNLabelURLAddressHomePage: "homepage",
    // Dates.
    CNLabelDateAnniversary: "anniversary",
    // Relations.
    CNLabelContactRelationAssistant: "assistant",
    CNLabelContactRelationBrother: "brother",
    CNLabelContactRelationChild: "child",
    CNLabelContactRelationDaughter: "daughter",
    CNLabelContactRelationFather: "father",
    CNLabelContactRelationFriend: "friend",
    CNLabelContactRelationManager: "manager",
    CNLabelContactRelationMother: "mother",
    CNLabelContactRelationParent: "parent",
    CNLabelContactRelationPartner: "partner",
    CNLabelContactRelationSister: "sister",
    CNLabelContactRelationSon: "son",
    CNLabelContactRelationSpouse: "spouse"
  ]

  private static let recordLabelToCNLabel: [String: String] = {
    var mapping = [String: String]()
    for (cnLabel, recordLabel) in cnLabelToRecordLabel {
      mapping[recordLabel.lowercased()] = cnLabel
    }
    return mapping
  }()

  /**
   Converts a label read from a `CNLabeledValue` into the key that the
   JavaScript API returns.
   */
  static func toRecordLabel(_ cnLabel: String) -> String {
    return cnLabelToRecordLabel[cnLabel] ?? cnLabel
  }

  /**
   Converts a key received from JavaScript into the label that the Contacts
   framework stores. The comparison ignores case, like on Android.
   */
  static func toCNLabel(_ recordLabel: String) -> String {
    return recordLabelToCNLabel[recordLabel.lowercased()] ?? recordLabel
  }
}
