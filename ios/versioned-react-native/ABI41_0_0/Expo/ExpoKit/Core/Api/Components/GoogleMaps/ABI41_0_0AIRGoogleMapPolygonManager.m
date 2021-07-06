//
//  ABI41_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS
#import "ABI41_0_0AIRGoogleMapPolygonManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0RCTConvert+AirMap.h"
#import "ABI41_0_0AIRGoogleMapPolygon.h"

@interface ABI41_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI41_0_0AIRGoogleMapPolygonManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapPolygon *polygon = [ABI41_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI41_0_0AIRMapCoordinateArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI41_0_0AIRMapCoordinateArrayArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end

#endif
