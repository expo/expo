//
//  ABI39_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI39_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI39_0_0React/ABI39_0_0RCTView.h>

@implementation ABI39_0_0AIRGoogleMapCalloutSubviewManager
ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI39_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)

@end

#endif
