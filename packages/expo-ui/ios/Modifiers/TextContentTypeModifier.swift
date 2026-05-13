// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TextContentTypeValue: String, Enumerable {
  // Web addresses
  case url = "URL"

  // Contacts
  case namePrefix
  case name
  case nameSuffix
  case givenName
  case middleName
  case familyName
  case nickname
  case organizationName
  case jobTitle

  // Location
  case location
  case fullStreetAddress
  case streetAddressLine1
  case streetAddressLine2
  case addressCity
  case addressCityAndState
  case addressState
  case postalCode
  case sublocality
  case countryName

  // Accounts
  case username
  case password
  case newPassword

  // Security
  case oneTimeCode

  // Communication
  case emailAddress
  case telephoneNumber
  case cellularEID
  case cellularIMEI

  // Payment
  case creditCardNumber
  case creditCardExpiration
  case creditCardExpirationMonth
  case creditCardExpirationYear
  case creditCardSecurityCode
  case creditCardType
  case creditCardName
  case creditCardGivenName
  case creditCardMiddleName
  case creditCardFamilyName

  // Birthday
  case birthdate
  case birthdateDay
  case birthdateMonth
  case birthdateYear

  // Events
  case dateTime
  case flightNumber
  case shipmentTrackingNumber

  var toUITextContentType: UITextContentType {
    switch self {
    case .url: return .URL
    case .namePrefix: return .namePrefix
    case .name: return .name
    case .nameSuffix: return .nameSuffix
    case .givenName: return .givenName
    case .middleName: return .middleName
    case .familyName: return .familyName
    case .nickname: return .nickname
    case .organizationName: return .organizationName
    case .jobTitle: return .jobTitle
    case .location: return .location
    case .fullStreetAddress: return .fullStreetAddress
    case .streetAddressLine1: return .streetAddressLine1
    case .streetAddressLine2: return .streetAddressLine2
    case .addressCity: return .addressCity
    case .addressCityAndState: return .addressCityAndState
    case .addressState: return .addressState
    case .postalCode: return .postalCode
    case .sublocality: return .sublocality
    case .countryName: return .countryName
    case .username: return .username
    case .password: return .password
    case .newPassword: return .newPassword
    case .oneTimeCode: return .oneTimeCode
    case .emailAddress: return .emailAddress
    case .telephoneNumber: return .telephoneNumber
    case .cellularEID:
      if #available(iOS 17.4, tvOS 17.4, *) {
        return .cellularEID
      }
      return .telephoneNumber
    case .cellularIMEI:
      if #available(iOS 17.4, tvOS 17.4, *) {
        return .cellularIMEI
      }
      return .telephoneNumber
    case .creditCardNumber: return .creditCardNumber
    case .creditCardExpiration:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardExpiration
      }
      return .creditCardNumber
    case .creditCardExpirationMonth:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardExpirationMonth
      }
      return .creditCardNumber
    case .creditCardExpirationYear:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardExpirationYear
      }
      return .creditCardNumber
    case .creditCardSecurityCode:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardSecurityCode
      }
      return .creditCardNumber
    case .creditCardType:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardType
      }
      return .creditCardNumber
    case .creditCardName:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardName
      }
      return .creditCardNumber
    case .creditCardGivenName:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardGivenName
      }
      return .creditCardNumber
    case .creditCardMiddleName:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardMiddleName
      }
      return .creditCardNumber
    case .creditCardFamilyName:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .creditCardFamilyName
      }
      return .creditCardNumber
    case .birthdate:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .birthdate
      }
      return .name
    case .birthdateDay:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .birthdateDay
      }
      return .name
    case .birthdateMonth:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .birthdateMonth
      }
      return .name
    case .birthdateYear:
      if #available(iOS 17.0, tvOS 17.0, *) {
        return .birthdateYear
      }
      return .name
    case .dateTime: return .dateTime
    case .flightNumber: return .flightNumber
    case .shipmentTrackingNumber: return .shipmentTrackingNumber
    }
  }
}

internal struct TextContentTypeModifier: ViewModifier, Record {
  @Field var textContentType: TextContentTypeValue?

  func body(content: Content) -> some View {
    if let textContentType {
      content.textContentType(textContentType.toUITextContentType)
    } else {
      content
    }
  }
}
