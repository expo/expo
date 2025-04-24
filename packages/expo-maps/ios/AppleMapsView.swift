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
      appleMapsView = AppleMapsView()
    } else {
      appleMapsView = nil
    }
  }

  func setCameraPosition(config: CameraPosition?) {
    appleMapsView?.setCameraPosition(config: config)
  }

  var body: some View {
    if #available(iOS 18.0, *) {
      if let appleMapsView = appleMapsView as? AppleMapsView {
        appleMapsView.environmentObject(props)
      }
    } else {
      EmptyView()
    }
  }
}

@available(iOS 18.0, *)
struct AppleMapsView: View, AppleMapsViewProtocol {
  @EnvironmentObject var props: AppleMapsViewProps
  @ObservedObject var state = AppleMapsViewState()

  func setCameraPosition(config: CameraPosition?) {
    withAnimation {
      state.mapCameraPosition =
        config.map(convertToMapCamera) ?? .userLocation(fallback: state.mapCameraPosition)
    }
  }

  var body: some View {
    let properties = props.properties
    let uiSettings = props.uiSettings

    // swiftlint:disable:next closure_body_length
    MapReader { reader in
      Map(position: $state.mapCameraPosition, selection: $state.selection) {
        ForEach(props.markers) { marker in
          Marker(
            marker.title,
            systemImage: marker.systemImage,
            coordinate: marker.clLocationCoordinate2D
          )
          .tint(marker.tintColor)
          .tag(MapSelection(marker.mapItem))
        }

        ForEach(props.polylines) { polyline in
          MapPolyline(coordinates: polyline.clLocationCoordinates2D)
            .stroke(polyline.strokeColor, lineWidth: polyline.strokeWidth)
            .tag(MapSelection<MKMapItem>(polyline.mapItem))
        }

        ForEach(props.annotations) { annotation in
          Annotation(
            annotation.title,
            coordinate: annotation.clLocationCoordinate2D
          ) {
            ZStack {
              if let icon = annotation.icon {
                Image(uiImage: icon.ref)
                  .resizable()
                  .frame(width: 50, height: 50)
              } else {
                RoundedRectangle(cornerRadius: 5)
                  .fill(annotation.backgroundColor)
              }
              Text(annotation.text)
                .foregroundStyle(annotation.textColor)
                .padding(5)
            }
          }
        }
        UserAnnotation()
      }
      .onTapGesture(coordinateSpace: .local) { position in
        if let coordinate = reader.convert(position, from: .local) {
          // First check if we hit a polyline and send an event
          if let hit = polyline(at: coordinate) {
            let coords = hit.coordinates.map {
              [
                "latitude": $0.latitude,
                "longitude": $0.longitude
              ]
            }
            props.onPolylineClick([
              "id": hit.id,
              "strokeColor": hit.strokeColor,
              "strokeWidth": hit.strokeWidth,
              "contourStyle": hit.contourStyle,
              "coordinates": coords
            ])
          }

          // Send an event of map click regardless
          props.onMapClick([
            "latitude": coordinate.latitude,
            "longitude": coordinate.longitude
          ])
        }
      }
      .mapControls {
        if uiSettings.compassEnabled {
          MapCompass()
        }
        if uiSettings.scaleBarEnabled {
          MapScaleView()
        }
        if uiSettings.togglePitchEnabled {
          MapPitchToggle()
        }
        if uiSettings.myLocationButtonEnabled {
          MapUserLocationButton()
        }
      }
      .onChange(of: props.cameraPosition) { _, newValue in
        state.mapCameraPosition = convertToMapCamera(position: newValue)
      }
      .onChange(of: state.selection, perform: handleSelectionChange)
      .onMapCameraChange(frequency: .onEnd) { context in
        let cameraPosition = context.region.center
        let longitudeDelta = context.region.span.longitudeDelta
        let zoomLevel = log2(360 / longitudeDelta)

        props.onCameraMove([
          "coordinates": [
            "latitude": cameraPosition.latitude,
            "longitude": cameraPosition.longitude
          ],
          "zoom": zoomLevel,
          "tilt": context.camera.pitch,
          "bearing": context.camera.heading
        ])
      }
      .mapFeatureSelectionAccessory(props.properties.selectionEnabled ? .automatic : nil)
      .mapStyle(properties.mapType.toMapStyle(
        showsTraffic: properties.isTrafficEnabled
      ))
      .onAppear {
        state.mapCameraPosition = convertToMapCamera(position: props.cameraPosition)
      }
    }
  }

  private func handleSelectionChange(_ newSelection: MapSelection<MKMapItem>?) {
    guard let item = newSelection?.value else {
      return
    }

    if let marker = props.markers.first(where: { $0.mapItem == item }) {
      props.onMarkerClick([
        "title": marker.title,
        "tintColor": marker.tintColor,
        "systemImage": marker.systemImage,
        "coordinates": [
          "latitude": marker.coordinates.latitude,
          "longitude": marker.coordinates.longitude
        ]
      ])
      return
    }
  }

  private func polyline(at tap: CLLocationCoordinate2D) -> ExpoAppleMapPolyline? {
    let tapPoint = MKMapPoint(tap)
    let threshold = props.properties.polylineTapThreshold

    return props.polylines.first { line in
      let pts = line.clLocationCoordinates2D.map(MKMapPoint.init)

      var minDist = CLLocationDistance.greatestFiniteMagnitude
      for (a, b) in zip(pts, pts.dropFirst()) {
        minDist = min(minDist, tapPoint.distance(toSegmentFrom: a, to: b))
        if minDist < threshold {
          return true
        }
      }
      return false
    }
  }
}
