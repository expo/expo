import Foundation

class AudioComponentRegistry {
  private var players = [String: AudioPlayer]()
  private var playlists = [String: AudioPlaylist]()
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

  func add(_ playlist: AudioPlaylist) {
    registryQueue.async(flags: .barrier) {
      self.playlists[playlist.id] = playlist
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

  func remove(_ playlist: AudioPlaylist) {
    registryQueue.async(flags: .barrier) {
      self.playlists.removeValue(forKey: playlist.id)
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

      self.playlists.values.forEach { $0.owningRegistry = nil }
      self.playlists.removeAll()

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

  var allPlaylists: [String: AudioPlaylist] {
    return registryQueue.sync {
      return playlists
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

  func getPlaylist(id: String) -> AudioPlaylist? {
    return registryQueue.sync {
      return playlists[id]
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
