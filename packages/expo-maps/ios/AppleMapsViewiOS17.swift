import SwiftUI
import MapKit
import ExpoModulesCore

@available(iOS 17.0, *)
struct AppleMapsViewiOS17: View, AppleMapsViewProtocol {
  @EnvironmentObject var props: AppleMapsViewProps
  @ObservedObject private var state = AppleMapsViewiOS17State()

  func setCameraPosition(config: CameraPosition?) {
    withAnimation {
      state.mapCameraPosition = config.map(convertToMapCamera) ?? .userLocation(fallback: state.mapCameraPosition)
    }
  }

  func openLookAround(coordinate: Coordinate) async throws {
    if state.lookAroundScene != nil {
      throw LookAroundAlreadyPresentedException()
    }

    let scene = try await getLookAroundScene(from: CLLocationCoordinate2D(
      latitude: coordinate.latitude,
      longitude: coordinate.longitude
    ))

    if scene == nil {
      throw SceneUnavailableAtLocationException()
    }

    state.lookAroundScene = scene
    state.lookAroundPresented = true
  }

  var body: some View {
    let properties = props.properties
    let uiSettings = props.uiSettings

    // swiftlint:disable:next closure_body_length
    MapReader { reader in
      Map(position: $state.mapCameraPosition) {
        ForEach(props.markers) { marker in
          Marker(
            marker.title,
            systemImage: marker.systemImage,
            coordinate: marker.clLocationCoordinate2D
          )
          .tint(marker.tintColor)
        }

        ForEach(props.polylines) { polyline in
          MapPolyline(coordinates: polyline.clLocationCoordinates2D)
            .stroke(polyline.color, lineWidth: polyline.width)
        }

        ForEach(props.polygons) { polygon in
          renderPolygon(polygon)
        }

        ForEach(props.circles) { circle in
          renderCircle(circle)
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

        if props.properties.isMyLocationEnabled {
          UserAnnotation()
        }
      }
      .onTapGesture(coordinateSpace: .local) { position in
        if let coordinate = reader.convert(position, from: .local) {
          props.onMapClick([
            "coordinates": [
              "latitude": coordinate.latitude,
              "longitude": coordinate.longitude
            ]
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
      .mapStyle(properties.mapType.toMapStyle(properties))
      .lookAroundViewer(
        isPresented: $state.lookAroundPresented,
        initialScene: state.lookAroundScene,
        allowsNavigation: true,
        showsRoadLabels: true,
        pointsOfInterest: .all,
        onDismiss: {
          state.lookAroundScene = nil
          state.lookAroundPresented = false
        }
      )
      .onAppear {
        state.mapCameraPosition = convertToMapCamera(position: props.cameraPosition)
      }
    }
  }
}
