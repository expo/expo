//
//  ABI39_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS
#import "ABI39_0_0AIRGoogleMapPolygonManager.h"

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert.h>
#import <ABI39_0_0React/ABI39_0_0RCTConvert+CoreLocation.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0UIView+React.h>
#import "ABI39_0_0RCTConvert+AirMap.h"
#import "ABI39_0_0AIRGoogleMapPolygon.h"

@interface ABI39_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI39_0_0AIRGoogleMapPolygonManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapPolygon *polygon = [ABI39_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI39_0_0AIRMapCoordinateArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI39_0_0AIRMapCoordinateArrayArray)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)

@end

#endif
