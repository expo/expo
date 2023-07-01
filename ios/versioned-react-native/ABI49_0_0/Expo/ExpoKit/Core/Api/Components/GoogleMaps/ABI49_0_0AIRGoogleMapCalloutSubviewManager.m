//
//  ABI49_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI49_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI49_0_0React/ABI49_0_0RCTView.h>

@implementation ABI49_0_0AIRGoogleMapCalloutSubviewManager
ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI49_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI49_0_0RCTBubblingEventBlock)

@end

#endif
