import Contacts
import ExpoModulesCore

struct SocialProfileMapper: ContactRecordMapper {
  typealias TExistingRecord = ExistingSocialProfileRecord
  typealias TNewRecord = NewSocialProfileRecord
  typealias TPatchRecord = PatchSocialProfileRecord
  typealias TDomainValue = CNSocialProfile
  
  func newRecordToCNLabeledValue(_ record: NewSocialProfileRecord) -> CNLabeledValue<CNSocialProfile> {
    let socialProfile = mapToCNSocialProfile(
      urlString: record.url,
      username: record.username,
      service: record.service,
      userId: record.userId
    )
    return CNLabeledValue(label: record.label, value: socialProfile)
  }

  func existingRecordToCNLabeledValue(_ record: ExistingSocialProfileRecord) -> CNLabeledValue<CNSocialProfile> {
    let socialProfile = mapToCNSocialProfile(
      urlString: record.url,
      username: record.username,
      service: record.service,
      userId: record.userId
    )
    return CNLabeledValue(label: record.label, value: socialProfile)
  }

  func cnLabeledValueToExistingRecord(_ labeledValue: CNLabeledValue<CNSocialProfile>) -> ExistingSocialProfileRecord {
    let socialProfile = labeledValue.value
    
    return ExistingSocialProfileRecord(
      id: labeledValue.identifier,
      label: labeledValue.label ?? CNLabelOther,
      username: socialProfile.username,
      service: socialProfile.service,
      url: socialProfile.urlString,
      userId: socialProfile.userIdentifier
    )
  }

  private func mapToCNSocialProfile(
    urlString: String?,
    username: String?,
    service: String?,
    userId: String?
  ) -> CNSocialProfile {
    return CNSocialProfile(
      urlString: urlString,
      username: username,
      userIdentifier: userId,
      service: service ?? ""
    )
  }
  
  func apply(patch: PatchSocialProfileRecord, to cnLabeledValue: CNLabeledValue<CNSocialProfile>) -> CNLabeledValue<CNSocialProfile> {
    var toModify = cnLabeledValue

    if case .value(let label) = patch.label {
      toModify = toModify.settingLabel(label)
    }
    
    var currentUrlString = toModify.value.urlString
    var currentUsername = toModify.value.username
    var currentService = toModify.value.service
    var currentUserId = toModify.value.userIdentifier
    
    if case .value(let url) = patch.url {
      currentUrlString = url ?? ""
    }
    if case .value(let username) = patch.username {
      currentUsername = username ?? ""
    }
    if case .value(let service) = patch.service {
      currentService = service ?? ""
    }
    if case .value(let userId) = patch.userId {
      currentUserId = userId ?? ""
    }
    
    let newSocialProfile = CNSocialProfile(
      urlString: currentUrlString,
      username: currentUsername,
      userIdentifier: currentUserId,
      service: currentService
    )
    
    toModify = toModify.settingValue(newSocialProfile)

    return toModify
  }
}
