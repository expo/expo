// Copyright 2015-present 650 Industries. All rights reserved.

import MapKit

func isRegionEqual(_ r1: MKCoordinateRegion, _ r2: MKCoordinateRegion) -> Bool {
  return abs(r1.center.latitude - r2.center.latitude) < 0.0001 &&
         abs(r1.center.longitude - r2.center.longitude) < 0.0001 &&
         abs(r1.span.latitudeDelta - r2.span.latitudeDelta) < 0.0001 &&
         abs(r1.span.longitudeDelta - r2.span.longitudeDelta) < 0.0001
}

func createStandardRegion(center: CLLocationCoordinate2D) -> MKCoordinateRegion {
  return MKCoordinateRegion(
    center: center,
    span: MKCoordinateSpan(latitudeDelta: 0.004, longitudeDelta: 0.002)
  )
}
