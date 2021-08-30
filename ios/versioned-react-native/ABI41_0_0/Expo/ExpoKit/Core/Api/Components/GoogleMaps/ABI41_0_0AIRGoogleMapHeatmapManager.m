//
//  ABI41_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI41_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI41_0_0AIRGoogleMapHeatmap.h"
#import "ABI41_0_0AIRGoogleMap.h"
#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>

@interface ABI41_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI41_0_0AIRGoogleMapHeatmapManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapHeatmap *heatmap = [ABI41_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
