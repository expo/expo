public struct PermissionStatus: Record {
  public init() { }
  @Field
  var granted: Bool?
  @Field
  var canAskAgain: Bool?
  
  public init(granted: Bool? = nil, canAskAgain: Bool? = nil) {
    self.granted = granted
    self.canAskAgain = canAskAgain
  }
}
