import ExpoModulesCore

struct AppleAuthenticationRequestOptions: Record {
  @Field
  var user: String?

  @Field
  var state: String?

  @Field
  var nonce: String?

  @Field
  var requestedScopes: [Int]?

  @Field
  var requestedOperation: Int = 0
}
