//
//  ABI37_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI37_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI37_0_0AIRGoogleMapHeatmap.h"
#import "ABI37_0_0AIRGoogleMap.h"
#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>

@interface ABI37_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI37_0_0AIRGoogleMapHeatmapManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapHeatmap *heatmap = [ABI37_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
