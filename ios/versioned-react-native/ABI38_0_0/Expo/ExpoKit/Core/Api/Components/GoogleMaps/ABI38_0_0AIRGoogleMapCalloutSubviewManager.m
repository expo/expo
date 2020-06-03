//
//  ABI38_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI38_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI38_0_0React/ABI38_0_0RCTView.h>

@implementation ABI38_0_0AIRGoogleMapCalloutSubviewManager
ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI38_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)

@end

#endif
