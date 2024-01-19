// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

internal class ContentKeyManager {
  let contentKeySession: AVContentKeySession
  let contentKeyDelegate: ContentKeyDelegate
  let contentKeyDelegateQueue = DispatchQueue(label: "\(Bundle.main.bundleIdentifier).ExpoVideo.ContentKeyDelegateQueue")

  init() {
    contentKeySession = AVContentKeySession(keySystem: .fairPlayStreaming)
    contentKeyDelegate = ContentKeyDelegate()

    contentKeySession.setDelegate(contentKeyDelegate, queue: contentKeyDelegateQueue)
  }

  func addContentKeyRequest(videoSource: VideoSource, asset: AVContentKeyRecipient) {
    contentKeyDelegate.videoSource = videoSource
    contentKeySession.addContentKeyRecipient(asset)
  }
}
