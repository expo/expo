//
//  AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMapCalloutSubviewManager.h"
#import "AIRGoogleMapCalloutSubview.h"
#import <React/RCTView.h>

@implementation AIRGoogleMapCalloutSubviewManager
RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapCalloutSubview *calloutSubview = [AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end

#endif
