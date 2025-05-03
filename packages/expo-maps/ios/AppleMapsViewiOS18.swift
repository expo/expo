import SwiftUI
import MapKit

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

@available(iOS 18.0, *)
struct AppleMapsViewiOS18: View, AppleMapsViewProtocol {
  @EnvironmentObject var props: AppleMapsViewProps
  @ObservedObject private var state = AppleMapsViewState()

  func setCameraPosition(config: CameraPosition?) {
    withAnimation {
      state.mapCameraPosition = config.map(convertToMapCamera) ?? .userLocation(fallback: state.mapCameraPosition)
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
            .stroke(polyline.color, lineWidth: polyline.width)
            .tag(MapSelection<MKMapItem>(polyline.mapItem))
        }

        ForEach(props.polygons) { polygon in
          renderPolygon(polygon)
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
          // check if we hit a polygon and send an event
          if let hit = props.polygons.first(where: { polygon in
            isTapInsidePolygon(tapCoordinate: coordinate, polygonCoordinates: polygon.clLocationCoordinates2D)
          }) {
              let coords = hit.coordinates.map {
                [
                  "latitude": $0.latitude,
                  "longitude": $0.longitude
                ]
              }
              props.onPolygonClick([
                "id": hit.id,
                "color": hit.color,
                "lineColor": hit.lineColor,
                "lineWidth": hit.lineWidth,
                "coordinates": coords
              ])
           }
           // Then check if we hit a polyline and send an event
           else if let hit = polyline(at: coordinate) {
             let coords = hit.coordinates.map {
               [
                 "latitude": $0.latitude,
                 "longitude": $0.longitude
               ]
             }
             props.onPolylineClick([
               "id": hit.id,
               "color": hit.color,
               "width": hit.width,
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
        "id": marker.id,
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

  // Point-in-polygon algorithm (Ray-casting)
  // See: https://rosettacode.org/wiki/Ray-casting_algorithm
  func isTapInsidePolygon(tapCoordinate: CLLocationCoordinate2D, polygonCoordinates: [CLLocationCoordinate2D]) -> Bool {
    var inside = false
    let n = polygonCoordinates.count
    var j = n - 1

    for i in 0..<n {
      let vi = polygonCoordinates[i]
      let vj = polygonCoordinates[j]

      // Check if the point's latitude is between the y-coordinates (latitude) of the edge
      // and if the point's longitude is to the left of the intersection with the edge
      if ((vi.latitude > tapCoordinate.latitude) != (vj.latitude > tapCoordinate.latitude)) &&
        (tapCoordinate.longitude < (vj.longitude - vi.longitude) * (tapCoordinate.latitude - vi.latitude) / (vj.latitude - vi.latitude) + vi.longitude) {
        inside.toggle()
      }
      j = i
    }
    
    return inside
  }
}
