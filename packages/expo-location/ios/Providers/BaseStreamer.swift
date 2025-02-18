// Copyright 2024-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

protocol Streamer {
    func stopStreaming()
}

internal class BaseStreamer: BaseLocationProvider, Streamer {
    func stopStreaming() {
        // Default empty implementation
    }
}
