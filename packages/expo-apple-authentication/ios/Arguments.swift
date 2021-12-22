// Copyright 2021-present 650 Industries. All rights reserved.

import AuthenticationServices
import ExpoModulesCore
import Foundation

internal struct SignInOptions: Record {
  @Field
  var requestedScopes: [Scope]?
  
  @Field
  var state: String?
  
  @Field
  var nonce: String?
}

@available(iOS 13.0, *)
internal enum Scope: Int, EnumArgument {
  case fullName = 0
  case email = 1
}

internal struct RefreshOptions: Record {
  @Field
  var user: String
  
  @Field
  var requestedScopes: [Scope]?
  
  @Field
  var state: String?
}

internal struct SignOutOptions: Record {
  @Field
  var user: String
  
  @Field
  var state: String?
}

internal struct AuthenticationResponse: Record {
  @Field
  var user: String

  @Field
  var state: Nullable<String>
  
  @Field
  var fullName: Nullable<FullName>
  
  @Field
  var email: Nullable<String>

  @Field
  var realUserStatus: ASUserDetectionStatus = ASUserDetectionStatus.unknown
  
  @Field
  var identityToken: Nullable<String>
  
  @Field
  var authorizationCode: Nullable<String>
}

internal struct FullName: Record {
  init(from personNameComponents: NSPersonNameComponents) {
    return @{
             @"namePrefix": EXNullIfNil(nameComponents.namePrefix),
             @"givenName": EXNullIfNil(nameComponents.givenName),
             @"middleName": EXNullIfNil(nameComponents.middleName),
             @"familyName": EXNullIfNil(nameComponents.familyName),
             @"nameSuffix": EXNullIfNil(nameComponents.nameSuffix),
             @"nickname": EXNullIfNil(nameComponents.nickname)
             };
  }
  
  @Field
  var namePrefix: Nullable<String>
  
  @Field
  var givenName: Nullable<String>
  
  @Field
  var middleName: Nullable<String>
  
  @Field
  var familyName: Nullable<String>
  
  @Field
  var nameSuffix: Nullable<String>
  
  @Field
  var nickname: Nullable<String>
}

typealias Nullable<T> = T
