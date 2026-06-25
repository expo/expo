import ExpoModulesCore

struct EditFormOptions: Record {
  @Field var displayedPropertyKeys: [String]?
  @Field var message: String?
  @Field var alternateName: String?
  @Field var allowsEditing: Bool?
  @Field var allowsActions: Bool?
  @Field var shouldShowLinkedContacts: Bool?
  @Field var cancelButtonTitle: String?
  @Field var showsCancelButton: Bool?
  @Field var preventAnimation: Bool?
  @Field var groupId: String?
}
