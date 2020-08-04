//
//  ABI37_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import "ABI37_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI37_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

@implementation ABI37_0_0AIRGoogleMapCalloutSubviewManager
ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI37_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)

@end

#endif
