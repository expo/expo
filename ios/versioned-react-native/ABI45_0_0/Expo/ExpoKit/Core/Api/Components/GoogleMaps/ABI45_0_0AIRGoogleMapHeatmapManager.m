//
//  ABI45_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI45_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI45_0_0AIRGoogleMapHeatmap.h"
#import "ABI45_0_0AIRGoogleMap.h"
#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

@interface ABI45_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI45_0_0AIRGoogleMapHeatmapManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapHeatmap *heatmap = [ABI45_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end