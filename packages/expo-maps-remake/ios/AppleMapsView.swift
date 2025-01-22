// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import MapKit

@available(iOS 17.0, *)
@Observable
class MapPosition {
  var region: MapCameraPosition
  
  init(cameraPosition: CameraPosition) {
    let coordinates = cameraPosition.coordinates
    region = MapCameraPosition.region(
      MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: coordinates.latitude, longitude: coordinates.longitude),
        span: MKCoordinateSpan(latitudeDelta: cameraPosition.zoom, longitudeDelta: cameraPosition.zoom)
      )
    )
  }
}

class AppleMapsViewProps: ExpoSwiftUI.ViewProps {
  @Field var markers: [MapMarker] = []
  @Field var annotations: [MapAnnotation] = []
  @Field var cameraPosition: CameraPosition
  var onMapClick = EventDispatcher()
  var onMarkerClick = EventDispatcher()
  var onPOIClick = EventDispatcher()
}

struct AppleMapsView: ExpoSwiftUI.View {
  @Namespace var mapScope
  @EnvironmentObject var props: AppleMapsViewProps
  @State private var selectedResult: MKMapItem?
  
  var body: some View {
    if #available(iOS 18.0, *) {
      @Bindable var mapPosition: MapPosition = .init(cameraPosition: props.cameraPosition)
      
      MapReader { reader in
        Map(position: $mapPosition.region, selection: $selectedResult) {
          if !props.markers.isEmpty {
            ForEach(props.markers) { marker in
              Marker(
                coordinate: CLLocationCoordinate2D(
                  latitude: marker.coordinates.latitude,
                  longitude: marker.coordinates.longitude
                ),
                label: { Text(marker.title) }
              )
            }
          }
          
          if !props.annotations.isEmpty {
            ForEach(props.annotations) { annotation in
              Annotation(
                annotation.title,
                coordinate: CLLocationCoordinate2D(
                  latitude: annotation.coordinates.latitude,
                  longitude: annotation.coordinates.longitude
                )
              ) {
                ZStack {
                  RoundedRectangle(cornerRadius: 5)
                    .fill(annotation.backgroundColor)
                  Text(annotation.text)
                    .foregroundStyle(annotation.textColor)
                    .padding(5)
                }
              }
            }
          }
        }
        .onTapGesture { position in
          if let coordinate = reader.convert(position, from: .local) {
            props.onMapClick([
              "latitude": coordinate.latitude,
              "longitude": coordinate.longitude
            ])
          }
        }
        .mapControls {
          MapCompass()
          MapScaleView()
          MapPitchToggle()
          MapUserLocationButton()
        }
        .mapStyle(.standard(showsTraffic: true))
        .mapFeatureSelectionAccessory(.automatic)
      }
    } else {
      EmptyView()
    }
  }
}

