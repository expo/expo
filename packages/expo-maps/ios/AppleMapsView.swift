// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import MapKit

class AppleMapsViewProps: ExpoSwiftUI.ViewProps {
  @Field var markers: [MapMarker] = []
  @Field var annotations: [MapAnnotation] = []
  @Field var cameraPosition: CameraPosition
  @Field var uiSettings: MapUISettings = MapUISettings()
  @Field var properties: MapProperties = MapProperties()
  let onMapClick = EventDispatcher()
  let onMarkerClick = EventDispatcher()
  let onCameraMove = EventDispatcher()
}

struct AppleMapsViewWrapper: ExpoSwiftUI.View {
  @EnvironmentObject var props: AppleMapsViewProps

  var body: some View {
    if #available(iOS 18.0, *) {
      AppleMapsView()
        .environmentObject(props)
    } else {
      EmptyView()
    }
  }
}

@available(iOS 18.0, *)
struct AppleMapsView: View {
  @EnvironmentObject var props: AppleMapsViewProps
  @State private var mapCameraPosition: MapCameraPosition = .automatic
  @State var selection: MapSelection<MKMapItem>?

  var body: some View {
    let properties = props.properties
    let uiSettings = props.uiSettings

    // swiftlint:disable:next closure_body_length
    MapReader { reader in
      Map(position: $mapCameraPosition, selection: $selection) {
        ForEach(props.markers) { marker in
          Marker(
            marker.title,
            systemImage: marker.systemImage,
            coordinate: marker.clLocationCoordinate2D
          )
          .tint(marker.tintColor)
          .tag(MapSelection(marker.mapItem))
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
        mapCameraPosition = convertToMapCamera(position: newValue)
      }
      .onChange(of: selection) { _, newValue in
        if let marker = props.markers.first(where: { $0.mapItem == newValue?.value }) {
          props.onMarkerClick([
            "title": marker.title,
            "tintColor": marker.tintColor,
            "systemImage": marker.systemImage,
            "coordinates": [
              "latitude": marker.coordinates.latitude,
              "longitude": marker.coordinates.longitude
            ]
          ])
        }
      }
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
        mapCameraPosition = convertToMapCamera(position: props.cameraPosition)
      }
    }
  }
}