import Contacts

func decodeEmailAddresses(_ input: [Email]?) -> [CNLabeledValue<NSString>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<NSString>]()
  for item in input {
    if let label = decodeEmailLabel(item.label),
    let email = item.email {
    let labeledValue = CNLabeledValue(label: label, value: email as NSString)
      output.append(labeledValue)
    }
  }

  return output.isEmpty ? nil : output
}

private func decodeEmailLabel(_ label: String) -> String? {
  var decodedLabel = decodeLabel(label: label)
  if let localizedLabel = CNLabeledValue<NSString>.localizedString(forLabel: CNLabelEmailiCloud) as String?,
  decodedLabel == localizedLabel {
    decodedLabel = CNLabelEmailiCloud
  }
  return decodedLabel
}

func decodeSocialProfiles(_ input: [SocialProfile]?) -> [CNLabeledValue<CNSocialProfile>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<CNSocialProfile>]()
  for item in input {
    let label = decodeLabel(label: item.label)
    let urlString = item.url
    let username = item.username
    let userId = item.userId
    let service = item.service
    let profile = CNSocialProfile(urlString: urlString?.path, username: username, userIdentifier: userId, service: service)
    output.append(CNLabeledValue(label: label, value: profile))
  }
  return output
}

func decodeInstantMessageAddresses(_ input: [InstantMessageAddress]?) -> [CNLabeledValue<CNInstantMessageAddress>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<CNInstantMessageAddress>]()
  for item in input {
    let label = decodeLabel(label: item.label)
    if let username = item.username, let service = item.service {
      let instantMessageAddress = CNInstantMessageAddress(username: username, service: service)
      output.append(CNLabeledValue(label: label, value: instantMessageAddress))
    }
  }
  return output
}

func decodeUrlAddresses(_ input: [UrlAddress]?) -> [CNLabeledValue<NSString>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<NSString>]()
  for item in input {
    let label = decodeUrlAddressLabel(item.label)
    if let urlString = item.url?.absoluteString {
      output.append(CNLabeledValue(label: label, value: urlString as NSString))
    }
  }
  return output
}

private func decodeUrlAddressLabel(_ label: String?) -> String? {
  guard var label else {
    return nil
  }

  label = decodeLabel(label: label)
  if label == CNLabeledValue<NSString>.localizedString(forLabel: CNLabelURLAddressHomePage) {
    label = CNLabelURLAddressHomePage
  }
  return label
}

func decodeDates(_ input: [ContactDate]?) -> [CNLabeledValue<NSDateComponents>]? {
  guard let input else {
    return nil
  }

  var output: [CNLabeledValue<NSDateComponents>] = []
  for item in input {
    guard let label = decodeDateLabel(item.label) else {
      continue
    }

    let val = NSDateComponents()
    if let day = item.day {
      val.day = day
    }
    if let month = item.month {
      val.month = month + 1
    }
    if let year = item.year {
      val.year = year
    }

    val.calendar = Calendar.current

    let labeledValue = CNLabeledValue(label: label, value: val)
    output.append(labeledValue)
  }

  return output
}

private func decodeDateLabel(_ label: String?) -> String? {
  var updatedLabel = label
  updatedLabel = decodeLabel(label: label)

  if updatedLabel == CNLabeledValue<NSString>.localizedString(forLabel: CNLabelDateAnniversary) {
    updatedLabel = CNLabelDateAnniversary
  }

  return updatedLabel
}

func decodeRelationships(_ input: [Relationship]?) -> [CNLabeledValue<CNContactRelation>]? {
  guard let input else {
    return nil
  }

  var output = [CNLabeledValue<CNContactRelation>]()
  for item in input {
    guard let label = decodeContactLabel(item.label), let name = item.name else {
      continue
    }

    let contactRelation = CNContactRelation(name: name)
    let labeledValue = CNLabeledValue(label: label, value: contactRelation)
    output.append(labeledValue)
  }
  return output
}

func decodeContactLabel(_ label: String?) -> String? {
  guard let label else {
    return nil
  }

  switch label {
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationChild):
    return CNLabelContactRelationChild
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationFather):
    return CNLabelContactRelationFather
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationFriend):
    return CNLabelContactRelationFriend
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationMother):
    return CNLabelContactRelationMother
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationParent):
    return CNLabelContactRelationParent
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationSister):
    return CNLabelContactRelationSister
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationSpouse):
    return CNLabelContactRelationSpouse
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationBrother):
    return CNLabelContactRelationBrother
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationManager):
    return CNLabelContactRelationManager
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationAssistant):
    return CNLabelContactRelationAssistant
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationPartner):
    return CNLabelContactRelationPartner
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationSon):
    return CNLabelContactRelationSon
  case CNLabeledValue<NSString>.localizedString(forLabel: CNLabelContactRelationDaughter):
    return CNLabelContactRelationDaughter
  default:
    return label
  }
}
