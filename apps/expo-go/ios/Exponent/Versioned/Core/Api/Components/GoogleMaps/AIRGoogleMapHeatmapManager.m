//
//  AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "AIRGoogleMapHeatmapManager.h"
#import "AIRGoogleMapHeatmap.h"
#import "AIRGoogleMap.h"
#import <React/RCTBridge.h>
#import <React/UIView+React.h>

@interface AIRGoogleMapHeatmapManager()

@end

@implementation AIRGoogleMapHeatmapManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapHeatmap *heatmap = [AIRGoogleMapHeatmap new];
  return heatmap;
}

RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
RCT_EXPORT_VIEW_PROPERTY(opacity, float)
RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end