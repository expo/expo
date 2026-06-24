import ExpoModulesCore

struct CreateFormOptions: Record {
  @Field var cancelButtonTitle: String?
  @Field var showsCancelButton: Bool?
  @Field var preventAnimation: Bool?
}
