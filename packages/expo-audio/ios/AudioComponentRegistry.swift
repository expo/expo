class AudioComponentRegistry {
  static let shared = AudioComponentRegistry()
  var players = [String: AudioPlayer]()
  var recorders = [String: AudioRecorder]()

  private init() {}

  func add(_ player: AudioPlayer) {
    players[player.id] = player
  }

  func add(_ recorder: AudioRecorder) {
    recorders[recorder.id] = recorder
  }

  func remove(_ player: AudioPlayer) {
    players.removeValue(forKey: player.id)
  }

  func remove(_ recorder: AudioRecorder) {
    recorders.removeValue(forKey: recorder.id)
  }

  func removeAll() {
    players.removeAll()
    recorders.removeAll()
  }
}
