// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import MapKit

@available(iOS 17.0, *)
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
  @Field var uiSettings: MapUISettings = MapUISettings()
  @Field var properties: MapProperties = MapProperties()
  var onMapClick = EventDispatcher()
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
  
  @Namespace var mapScope
  
  var body: some View {
    MapReader { reader in
      Map(position: $mapCameraPosition, selection: $selection) {
        if !props.markers.isEmpty {
          ForEach(props.markers) { marker in
            Marker(
              coordinate: marker.clLocationCoordinate2D,
              label: { Text(marker.title) }
            )
            .tag(MapSelection(marker.mapItem))
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
        if props.uiSettings.compassEnabled {
          MapCompass()
        }
        if props.uiSettings.scaleBarEnabled {
          MapScaleView()
        }
        if props.uiSettings.togglePitchEnabled {
          MapPitchToggle()
        }
        if props.uiSettings.myLocationButtonEnabled {
          MapUserLocationButton()
        }
      }
      .mapFeatureSelectionAccessory()
      .mapStyle(props.properties.mapTypeIos.toMapStyle(
        showsTraffic: props.properties.isTrafficEnabled
      ))
      .onAppear {
        mapCameraPosition = MapPosition(cameraPosition: props.cameraPosition).region
      }
    }
  }
}
