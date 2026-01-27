import ExpoModulesCore

struct Shape: Record {
  @Field var width: Int
  @Field var height: Int

  init() {}

  init(width: Int, height: Int) {
    self.width = width
    self.height = height
  }
}
