//
//  ABI33_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI33_0_0AIRGoogleMapCalloutSubview.h"
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@implementation ABI33_0_0AIRGoogleMapCalloutSubviewManager
ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI33_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)

@end

#endif
