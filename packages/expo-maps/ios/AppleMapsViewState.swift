// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit
import SwiftUI

@available(iOS 18.0, *)
public class AppleMapsViewiOS18State: ObservableObject {
  @Published var mapCameraPosition: MapCameraPosition = .automatic
  @Published var selection: MapSelection<MKMapItem>?
  @Published var lookAroundScene: MKLookAroundScene?
  @Published var lookAroundPresented: Bool = false
}

@available(iOS 17.0, *)
public class AppleMapsViewiOS17State: ObservableObject {
  @Published var mapCameraPosition: MapCameraPosition = .automatic
  @Published var lookAroundScene: MKLookAroundScene?
  @Published var lookAroundPresented: Bool = false
}
