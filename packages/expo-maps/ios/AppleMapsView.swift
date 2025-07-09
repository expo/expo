// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import MapKit
import SwiftUI

class AppleMapsViewProps: ExpoSwiftUI.ViewProps {
  @Field var markers: [MapMarker] = []
  @Field var annotations: [MapAnnotation] = []
  @Field var polylines: [ExpoAppleMapPolyline] = []
  @Field var polygons: [Polygon] = []
  @Field var circles: [Circle] = []
  @Field var cameraPosition: CameraPosition
  @Field var uiSettings: MapUISettings = MapUISettings()
  @Field var properties: MapProperties = MapProperties()
  let onMapClick = EventDispatcher()
  let onMarkerClick = EventDispatcher()
  let onPolylineClick = EventDispatcher()
  let onPolygonClick = EventDispatcher()
  let onCircleClick = EventDispatcher()
  let onCameraMove = EventDispatcher()
}

protocol AppleMapsViewProtocol: View {
  func setCameraPosition(config: CameraPosition?)
  func openLookAround(coordinate: Coordinate) async throws
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

  func openLookAround(coordinate: Coordinate) async throws {
    try await appleMapsView?.openLookAround(coordinate: coordinate)
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
