import Foundation

class AudioComponentRegistry {
  private var players = [String: AudioPlayer]()
  #if os(iOS)
  private var recorders = [String: AudioRecorder]()
  #endif

  private let registryQueue = DispatchQueue(label: "expo.audio.registry", attributes: .concurrent)

  init() {}

  func add(_ player: AudioPlayer) {
    registryQueue.async(flags: .barrier) {
      self.players[player.id] = player
    }
  }

  #if os(iOS)
  func add(_ recorder: AudioRecorder) {
    registryQueue.async(flags: .barrier) {
      self.recorders[recorder.id] = recorder
    }
  }
  #endif

  func remove(_ player: AudioPlayer) {
    registryQueue.async(flags: .barrier) {
      self.players.removeValue(forKey: player.id)
    }
  }

  #if os(iOS)
  func remove(_ recorder: AudioRecorder) {
    registryQueue.async(flags: .barrier) {
      self.recorders.removeValue(forKey: recorder.id)
    }
  }
  #endif

  func removeAll() {
    registryQueue.async(flags: .barrier) {
      self.players.values.forEach { $0.owningRegistry = nil }
      self.players.removeAll()

      #if os(iOS)
      self.recorders.values.forEach { $0.owningRegistry = nil }
      self.recorders.removeAll()
      #endif
    }
  }

  var allPlayers: [String: AudioPlayer] {
    return registryQueue.sync {
      return players
    }
  }

  #if os(iOS)
  var allRecorders: [String: AudioRecorder] {
    return registryQueue.sync {
      return recorders
    }
  }
  #endif

  func getPlayer(id: String) -> AudioPlayer? {
    return registryQueue.sync {
      return players[id]
    }
  }

  #if os(iOS)
  func getRecorder(id: String) -> AudioRecorder? {
    return registryQueue.sync {
      return recorders[id]
    }
  }
  #endif
}
