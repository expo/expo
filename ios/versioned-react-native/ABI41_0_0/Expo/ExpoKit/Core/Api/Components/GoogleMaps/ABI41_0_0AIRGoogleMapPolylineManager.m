//
//  ABI41_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapPolylineManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert+CoreLocation.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>
#import "ABI41_0_0RCTConvert+AirMap.h"
#import "ABI41_0_0AIRGoogleMapPolyline.h"

@interface ABI41_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI41_0_0AIRGoogleMapPolylineManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapPolyline *polyline = [ABI41_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI41_0_0AIRMapCoordinateArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI41_0_0RCTBubblingEventBlock)

@end

#endif
