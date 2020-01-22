//
//  RCTConvert+GMSMapViewType.m
//
//  Created by Nick Italiano on 10/23/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import "RCTConvert+GMSMapViewType.h"
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTConvert.h>
#import <React/RCTConvert+CoreLocation.h>

@implementation RCTConvert (GMSMapViewType)
  RCT_ENUM_CONVERTER(GMSMapViewType,
  (
    @{
      @"standard": @(kGMSTypeNormal),
      @"satellite": @(kGMSTypeSatellite),
      @"hybrid": @(kGMSTypeHybrid),
      @"terrain": @(kGMSTypeTerrain),
      @"none": @(kGMSTypeNone)
    }
  ), kGMSTypeTerrain, intValue)


+ (GMSCameraPosition*)GMSCameraPosition:(id)json
{
    json = [self NSDictionary:json];
    return [RCTConvert GMSCameraPositionWithDefaults:json existingCamera:nil];
}

+ (GMSCameraPosition*)GMSCameraPositionWithDefaults:(id)json existingCamera:(GMSCameraPosition*)existingCamera
{
    CLLocationDegrees latitude = 0;
    CLLocationDegrees longitude = 0;
    double viewingAngle = 0;
    double zoom = 0;
    double bearing = 0;

    if (existingCamera != nil) {
        viewingAngle = existingCamera.viewingAngle;
        latitude = existingCamera.target.latitude;
        longitude = existingCamera.target.longitude;
        zoom = existingCamera.zoom;
        bearing = existingCamera.bearing;
    }

    if (json[@"center"]) {
        CLLocationCoordinate2D target = [self CLLocationCoordinate2D:json[@"center"]];
        latitude = target.latitude;
        longitude = target.longitude;
    }

    if (json[@"pitch"]) {
        viewingAngle = [self double:json[@"pitch"]];
    }

    // zoomAtCoordinate:forMeters:perPoints is offered by the SDK, which would allow
    // us to support the "altitude" property of the camera as an alternative to "zoom".
    // However, I am not clear on what the "perPoints" argument does...
    if (json[@"zoom"]) {
        zoom = [self double:json[@"zoom"]];
    }

    if (json[@"heading"]) {
        bearing = [self double:json[@"heading"]];
    }

    return [GMSCameraPosition cameraWithLatitude:latitude
                                       longitude:longitude
                                            zoom:zoom
                                         bearing:bearing
                                    viewingAngle:viewingAngle];
}

@end

#endif
