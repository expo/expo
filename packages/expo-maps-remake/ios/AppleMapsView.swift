// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import MapKit

class AppleMapsViewProps: ExpoSwiftUI.ViewProps {}

struct AppleMapsView: ExpoSwiftUI.View {
  @EnvironmentObject var props: AppleMapsViewProps

  var body: some View {
    if #available(iOS 17.0, *) {
      let cameraPosition = MapCameraPosition.region(
        MKCoordinateRegion(
          center: CLLocationCoordinate2D(latitude: 51.507222, longitude: -0.1275),
          span: MKCoordinateSpan(latitudeDelta: 1, longitudeDelta: 1)
        )
      )

      Map(initialPosition: cameraPosition)
    }
  }
}
