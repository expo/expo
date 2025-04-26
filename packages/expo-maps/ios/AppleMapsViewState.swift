// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit
import SwiftUI

@available(iOS 18.0, *)
public class AppleMapsViewState: ObservableObject {
  @Published var mapCameraPosition: MapCameraPosition = .automatic
  @Published var selection: MapSelection<MKMapItem>?
}

@available(iOS 17.0, *)
public class AppleMapsCameraState: ObservableObject {
  @Published var mapCameraPosition: MapCameraPosition = .automatic
}
