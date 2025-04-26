// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit
import SwiftUI

class AppleMapsViewProps: ExpoSwiftUI.ViewProps {
  @Field var markers: [MapMarker] = []
  @Field var annotations: [MapAnnotation] = []
  @Field var polylines: [ExpoAppleMapPolyline] = []
  @Field var cameraPosition: CameraPosition
  @Field var uiSettings: MapUISettings = MapUISettings()
  @Field var properties: MapProperties = MapProperties()
  let onMapClick = EventDispatcher()
  let onMarkerClick = EventDispatcher()
  let onPolylineClick = EventDispatcher()
  let onCameraMove = EventDispatcher()
}

extension MKMapPoint {
  // Perpendicular distance (in metres) from `self` to the
  // line segment **AB**.
  func distance(toSegmentFrom a: MKMapPoint, to b: MKMapPoint) -> CLLocationDistance {
    let dx = b.x - a.x
    let dy = b.y - a.y

    // Degenerate segment => use point distance
    guard dx != 0 || dy != 0 else {
      return distance(to: a)
    }

    let t = ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)
    // Clamp the projection to the segment
    let clamped = max(0.0, min(1.0, t))

    let proj = MKMapPoint(
      x: a.x + clamped * dx,
      y: a.y + clamped * dy
    )

    return distance(to: proj)
  }
}

protocol AppleMapsViewProtocol: View {
  func setCameraPosition(config: CameraPosition?)
}

struct AppleMapsViewWrapper: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView, AppleMapsViewProtocol {
  @ObservedObject var props: AppleMapsViewProps
  var appleMapsView: (any AppleMapsViewProtocol)?

  init(props: AppleMapsViewProps) {
    self.props = props
    if #available(iOS 18.0, *) {
      appleMapsView = AppleMapsViewiOS18()
    } else if #available(iOS 17.0, *) {
      appleMapsView = AppleMapsViewiOS17()
    } else {
      appleMapsView = nil
    }
  }

  func setCameraPosition(config: CameraPosition?) {
    appleMapsView?.setCameraPosition(config: config)
  }

  var body: some View {
    if #available(iOS 18.0, *), let mapsView18 = appleMapsView as? AppleMapsViewiOS18 {
      mapsView18.environmentObject(props)
    } else if #available(iOS 17.0, *), let mapsView17 = appleMapsView as? AppleMapsViewiOS17 {
      mapsView17.environmentObject(props)
    } else {
      EmptyView()
    }
  }
}
