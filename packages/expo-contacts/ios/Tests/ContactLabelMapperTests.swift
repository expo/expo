import Contacts
import Testing

@testable import ExpoContacts

@Suite("ContactLabelMapper")
struct ContactLabelMapperTests {
  @Test
  func `toRecordLabel maps native labels to corresponding JS labels`() {
    #expect(ContactLabelMapper.toRecordLabel(CNLabelHome) == "home")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelPhoneNumberiPhone) == "iPhone")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelPhoneNumberAppleWatch) == "appleWatch")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelPhoneNumberHomeFax) == "faxHome")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelPhoneNumberOtherFax) == "otherFax")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelEmailiCloud) == "iCloud")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelURLAddressHomePage) == "homepage")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelDateAnniversary) == "anniversary")
    #expect(ContactLabelMapper.toRecordLabel(CNLabelContactRelationBrother) == "brother")
  }

  @Test
  func `unknown native labels round trip unchanged`() {
    let label = "_$!<FutureLabel>!$_"
    let recordLabel = ContactLabelMapper.toRecordLabel(label)

    #expect(recordLabel == label)
    #expect(ContactLabelMapper.toCNLabel(recordLabel) == label)
  }

  @Test(arguments: [nil, "", " ", "   ", "\t\n"] as [String?])
  func `toRecordLabel defaults missing or blank labels to other`(label: String?) {
    #expect(ContactLabelMapper.toRecordLabel(label) == "other")
  }

  @Test
  func `toRecordLabel passes a custom label through unchanged`() {
    #expect(ContactLabelMapper.toRecordLabel("boat") == "boat")
    #expect(ContactLabelMapper.toRecordLabel("Beach House") == "Beach House")
    #expect(ContactLabelMapper.toRecordLabel("Home") == "Home")
  }

  @Test
  func `toCNLabel accepts JS labels in lower case`() {
    #expect(ContactLabelMapper.toCNLabel("home") == CNLabelHome)
    #expect(ContactLabelMapper.toCNLabel("iphone") == CNLabelPhoneNumberiPhone)
    #expect(ContactLabelMapper.toCNLabel("applewatch") == CNLabelPhoneNumberAppleWatch)
    #expect(ContactLabelMapper.toCNLabel("faxhome") == CNLabelPhoneNumberHomeFax)
    #expect(ContactLabelMapper.toCNLabel("otherfax") == CNLabelPhoneNumberOtherFax)
    #expect(ContactLabelMapper.toCNLabel("icloud") == CNLabelEmailiCloud)
    #expect(ContactLabelMapper.toCNLabel("brother") == CNLabelContactRelationBrother)
  }

  @Test
  func `toCNLabel accepts JS labels in upper case`() {
    #expect(ContactLabelMapper.toCNLabel("HOME") == CNLabelHome)
    #expect(ContactLabelMapper.toCNLabel("IPHONE") == CNLabelPhoneNumberiPhone)
    #expect(ContactLabelMapper.toCNLabel("FAXHOME") == CNLabelPhoneNumberHomeFax)
    #expect(ContactLabelMapper.toCNLabel("OTHERFAX") == CNLabelPhoneNumberOtherFax)
    #expect(ContactLabelMapper.toCNLabel("ICLOUD") == CNLabelEmailiCloud)
    #expect(ContactLabelMapper.toCNLabel("BROTHER") == CNLabelContactRelationBrother)
  }

  @Test
  func `toCNLabel accepts JS labels in the casing returned by toRecordLabel`() {
    #expect(ContactLabelMapper.toCNLabel("iPhone") == CNLabelPhoneNumberiPhone)
    #expect(ContactLabelMapper.toCNLabel("appleWatch") == CNLabelPhoneNumberAppleWatch)
    #expect(ContactLabelMapper.toCNLabel("faxHome") == CNLabelPhoneNumberHomeFax)
    #expect(ContactLabelMapper.toCNLabel("faxWork") == CNLabelPhoneNumberWorkFax)
    #expect(ContactLabelMapper.toCNLabel("otherFax") == CNLabelPhoneNumberOtherFax)
    #expect(ContactLabelMapper.toCNLabel("iCloud") == CNLabelEmailiCloud)
  }

  @Test
  func `toCNLabel accepts JS labels in mixed case`() {
    #expect(ContactLabelMapper.toCNLabel("HoMe") == CNLabelHome)
    #expect(ContactLabelMapper.toCNLabel("iPHone") == CNLabelPhoneNumberiPhone)
    #expect(ContactLabelMapper.toCNLabel("iCLoud") == CNLabelEmailiCloud)
    #expect(ContactLabelMapper.toCNLabel("FaxHome") == CNLabelPhoneNumberHomeFax)
  }

  @Test(arguments: [nil, "", " ", "   ", "\t\n"] as [String?])
  func `toCNLabel defaults missing or blank labels to other`(label: String?) {
    #expect(ContactLabelMapper.toCNLabel(label) == CNLabelOther)
  }

  @Test
  func `toCNLabel passes a custom label through unchanged`() {
    #expect(ContactLabelMapper.toCNLabel("boat") == "boat")
    #expect(ContactLabelMapper.toCNLabel("Beach House") == "Beach House")
    #expect(ContactLabelMapper.toCNLabel("BeAcH hOuSe") == "BeAcH hOuSe")
    #expect(ContactLabelMapper.toCNLabel("BEACH HOUSE") == "BEACH HOUSE")
  }
}
