// Constains player properties that have been set while the current item was being loaded and which can be
// correctly applied only after the player has set it's item. For now it's only currentTime, but we may add more in the future
internal class DangerousPropertiesStore {
  var ownerIsReplacing: Bool = false
  var currentTime: Double?

  func applyProperties(to player: VideoPlayer, reset shouldReset: Bool = true) {
    if let currentTime {
      player.currentTime = currentTime
    }
    if shouldReset {
      reset()
    }
  }

  func reset() {
    currentTime = nil
  }
}
