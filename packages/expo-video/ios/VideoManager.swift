// Copyright 2024-present 650 Industries. All rights reserved.

import AVKit
import Foundation
import ExpoModulesCore

/**
 * Helper class used to keep track of all existing VideoViews and VideoPlayers and manage their lifecycle
 */
class VideoManager {
  static var shared = VideoManager()

  private static var managerQueue = DispatchQueue(label: "com.expo.video.manager.managerQueue")
  private var videoViews = NSHashTable<VideoView>.weakObjects()
  private let videoPlayers = SynchronizedHashTable<VideoPlayer>(weakObjects: true)
  private let clientsWantingNowPlaying = Mutex(Set<ObjectIdentifier>())

  var hasRegisteredPlayers: Bool {
    return !videoPlayers.allObjects.isEmpty
  }

  private init() {}

  func register(videoPlayer: VideoPlayer) {
    videoPlayers.add(videoPlayer)
  }

  func unregister(videoPlayer: VideoPlayer) {
    videoPlayers.remove(videoPlayer)
  }

  func register(videoView: VideoView) {
    videoViews.add(videoView)
  }

  func unregister(videoView: VideoView) {
    videoViews.remove(videoView)
  }

  func onAppForegrounded() {
    // While the app is backgrounded iOS can release the decode pipeline, leaving items in a
    // `.failed` state once we come back.
    reloadPlayers { $0.reloadIfFailed() }
  }

  private func reloadPlayers(_ reload: @escaping (VideoPlayer) -> Void) {
    Self.managerQueue.async { [weak self] in
      guard let self else {
        return
      }

      let players = self.videoPlayers.allObjects

      DispatchQueue.main.async {
        for player in players {
          reload(player)
        }
      }
    }
  }

  // MARK: - Now Playing

  func anotherPlayerWantsNowPlaying(than client: VideoMediaSessionClient) -> Bool {
    let id = ObjectIdentifier(client)
    return clientsWantingNowPlaying.withLock { clients in
      clients.contains { $0 != id }
    }
  }

  func setWantsNowPlaying(_ wantsNowPlaying: Bool, for client: VideoMediaSessionClient) {
    let id = ObjectIdentifier(client)
    let didChange = clientsWantingNowPlaying.withLock { clients in
      wantsNowPlaying ? clients.insert(id).inserted : clients.remove(id) != nil
    }
    guard didChange else {
      return
    }
    for player in videoPlayers.allObjects where player.mediaSession !== client {
      player.mediaSession?.refresh()
    }
  }

  func isAnotherPlayerPlaying(than client: VideoMediaSessionClient) -> Bool {
    return videoPlayers.allObjects.contains { $0.mediaSession !== client && $0.ref.rate != 0 }
  }

  func onAppBackgrounded() {
    for videoView in videoViews.allObjects {
      guard let player = videoView.player else {
        continue
      }
      if player.staysActiveInBackground == true {
        player.ref.audiovisualBackgroundPlaybackPolicy = .continuesIfPossible
      } else if !videoView.playerViewController.isInPictureInPicture {
        player.ref.audiovisualBackgroundPlaybackPolicy = .pauses
        player.ref.pause()
      }
    }
  }
}
