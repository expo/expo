//
//  ABI44_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI44_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI44_0_0React/ABI44_0_0RCTView.h>

@implementation ABI44_0_0AIRGoogleMapCalloutSubviewManager
ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI44_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)

@end

#endif
