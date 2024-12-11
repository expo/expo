class AudioComponentRegistry {
  static let shared = AudioComponentRegistry()
  var players = [String: AudioPlayer]()
  #if os(iOS)
  var recorders = [String: AudioRecorder]()
  #endif

  private init() {}

  func add(_ player: AudioPlayer) {
    players[player.id] = player
  }

  #if os(iOS)
  func add(_ recorder: AudioRecorder) {
    recorders[recorder.id] = recorder
  }
  #endif

  func remove(_ player: AudioPlayer) {
    players.removeValue(forKey: player.id)
  }

  #if os(iOS)
  func remove(_ recorder: AudioRecorder) {
    recorders.removeValue(forKey: recorder.id)
  }
  #endif

  func removeAll() {
    players.removeAll()
    #if os(iOS)
    recorders.removeAll()
    #endif
  }
}
