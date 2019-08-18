/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GoogleMapsDemos/Samples/Samples.h"

// Map Demos
#import "GoogleMapsDemos/Samples/BasicMapViewController.h"
#import "GoogleMapsDemos/Samples/CustomIndoorViewController.h"
#import "GoogleMapsDemos/Samples/DoubleMapViewController.h"
#import "GoogleMapsDemos/Samples/FrameRateViewController.h"
#import "GoogleMapsDemos/Samples/GestureControlViewController.h"
#import "GoogleMapsDemos/Samples/IndoorMuseumNavigationViewController.h"
#import "GoogleMapsDemos/Samples/IndoorViewController.h"
#import "GoogleMapsDemos/Samples/MapTypesViewController.h"
#import "GoogleMapsDemos/Samples/MapZoomViewController.h"
#import "GoogleMapsDemos/Samples/MyLocationViewController.h"
#import "GoogleMapsDemos/Samples/PaddingBehaviorViewController.h"
#import "GoogleMapsDemos/Samples/SnapshotReadyViewController.h"
#import "GoogleMapsDemos/Samples/StyledMapViewController.h"
#import "GoogleMapsDemos/Samples/TrafficMapViewController.h"
#import "GoogleMapsDemos/Samples/VisibleRegionViewController.h"

// Panorama Demos
#import "GoogleMapsDemos/Samples/FixedPanoramaViewController.h"
#import "GoogleMapsDemos/Samples/PanoramaViewController.h"

// Overlay Demos
#import "GoogleMapsDemos/Samples/AnimatedCurrentLocationViewController.h"
#import "GoogleMapsDemos/Samples/AnimatedUIViewMarkerViewController.h"
#import "GoogleMapsDemos/Samples/CustomMarkersViewController.h"
#import "GoogleMapsDemos/Samples/GradientPolylinesViewController.h"
#import "GoogleMapsDemos/Samples/GroundOverlayViewController.h"
#import "GoogleMapsDemos/Samples/MarkerEventsViewController.h"
#import "GoogleMapsDemos/Samples/MarkerInfoWindowViewController.h"
#import "GoogleMapsDemos/Samples/MarkerLayerViewController.h"
#import "GoogleMapsDemos/Samples/MarkersViewController.h"
#import "GoogleMapsDemos/Samples/PolygonsViewController.h"
#import "GoogleMapsDemos/Samples/PolylinesViewController.h"
#import "GoogleMapsDemos/Samples/TileLayerViewController.h"

// Camera Demos
#import "GoogleMapsDemos/Samples/CameraViewController.h"
#import "GoogleMapsDemos/Samples/FitBoundsViewController.h"
#import "GoogleMapsDemos/Samples/MapLayerViewController.h"

// Services
#import "GoogleMapsDemos/Samples/GeocoderViewController.h"
#import "GoogleMapsDemos/Samples/StructuredGeocoderViewController.h"

@implementation Samples

+ (NSArray *)loadSections {
  return @[ @"Map", @"Panorama", @"Overlays", @"Camera", @"Services" ];
}

+ (NSArray *)loadDemos {
  NSArray *mapDemos =
  @[[self newDemo:[BasicMapViewController class]
        withTitle:@"Basic Map"
   andDescription:nil],
    [self newDemo:[MapTypesViewController class]
        withTitle:@"Map Types"
   andDescription:nil],
    [self newDemo:[StyledMapViewController class]
        withTitle:@"Styled Map"
   andDescription:nil],
    [self newDemo:[TrafficMapViewController class]
        withTitle:@"Traffic Layer"
   andDescription:nil],
    [self newDemo:[MyLocationViewController class]
        withTitle:@"My Location"
   andDescription:nil],
    [self newDemo:[IndoorViewController class]
        withTitle:@"Indoor"
   andDescription:nil],
    [self newDemo:[CustomIndoorViewController class]
        withTitle:@"Indoor with Custom Level Select"
   andDescription:nil],
    [self newDemo:[IndoorMuseumNavigationViewController class]
        withTitle:@"Indoor Museum Navigator"
   andDescription:nil],
    [self newDemo:[GestureControlViewController class]
        withTitle:@"Gesture Control"
   andDescription:nil],
    [self newDemo:[SnapshotReadyViewController class]
        withTitle:@"Snapshot Ready"
   andDescription:nil],
    [self newDemo:[DoubleMapViewController class]
        withTitle:@"Two Maps"
   andDescription:nil],
    [self newDemo:[VisibleRegionViewController class]
        withTitle:@"Visible Regions"
   andDescription:nil],
    [self newDemo:[MapZoomViewController class]
        withTitle:@"Min/Max Zoom"
   andDescription:nil],
    [self newDemo:[FrameRateViewController class]
        withTitle:@"Frame Rate"
   andDescription:nil],
    [self newDemo:[PaddingBehaviorViewController class]
        withTitle:@"Padding Behavior"
   andDescription:nil],
  ];

  NSArray *panoramaDemos =
  @[[self newDemo:[PanoramaViewController class]
        withTitle:@"Street View"
   andDescription:nil],
    [self newDemo:[FixedPanoramaViewController class]
        withTitle:@"Fixed Street View"
   andDescription:nil]];

  NSArray *overlayDemos =
  @[[self newDemo:[MarkersViewController class]
        withTitle:@"Markers"
   andDescription:nil],
    [self newDemo:[CustomMarkersViewController class]
        withTitle:@"Custom Markers"
   andDescription:nil],
    [self newDemo:[AnimatedUIViewMarkerViewController class]
        withTitle:@"UIView Markers"
   andDescription:nil],
    [self newDemo:[MarkerEventsViewController class]
        withTitle:@"Marker Events"
   andDescription:nil],
    [self newDemo:[MarkerLayerViewController class]
        withTitle:@"Marker Layer"
   andDescription:nil],
    [self newDemo:[MarkerInfoWindowViewController class]
        withTitle:@"Custom Info Windows"
   andDescription:nil],
    [self newDemo:[PolygonsViewController class]
        withTitle:@"Polygons"
   andDescription:nil],
    [self newDemo:[PolylinesViewController class]
        withTitle:@"Polylines"
   andDescription:nil],
    [self newDemo:[GroundOverlayViewController class]
        withTitle:@"Ground Overlays"
   andDescription:nil],
    [self newDemo:[TileLayerViewController class]
        withTitle:@"Tile Layers"
   andDescription:nil],
    [self newDemo:[AnimatedCurrentLocationViewController class]
        withTitle:@"Animated Current Location"
   andDescription:nil],
    [self newDemo:[GradientPolylinesViewController class]
        withTitle:@"Gradient Polylines"
   andDescription:nil]];

  NSArray *cameraDemos =
  @[[self newDemo:[FitBoundsViewController class]
        withTitle:@"Fit Bounds"
   andDescription:nil],
    [self newDemo:[CameraViewController class]
        withTitle:@"Camera Animation"
   andDescription:nil],
    [self newDemo:[MapLayerViewController class]
        withTitle:@"Map Layer"
   andDescription:nil]];

  NSArray *servicesDemos =
  @[[self newDemo:[GeocoderViewController class]
        withTitle:@"Geocoder"
   andDescription:nil],
    [self newDemo:[StructuredGeocoderViewController class]
        withTitle:@"Structured Geocoder"
   andDescription:nil],
  ];

  return @[mapDemos, panoramaDemos, overlayDemos, cameraDemos, servicesDemos];
}

+ (NSDictionary *)newDemo:(Class) class
                withTitle:(NSString *)title
           andDescription:(NSString *)description {
  return [[NSDictionary alloc] initWithObjectsAndKeys:class, @"controller",
          title, @"title", description, @"description", nil];
}
@end
