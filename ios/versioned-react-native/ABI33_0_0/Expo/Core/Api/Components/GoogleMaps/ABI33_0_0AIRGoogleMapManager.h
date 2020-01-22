//
//  ABI33_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>
#import "ABI33_0_0AIRGoogleMap.h"

@interface ABI33_0_0AIRGoogleMapManager : ABI33_0_0RCTViewManager
@property (nonatomic, assign) ABI33_0_0AIRGoogleMap *map;

@end

#endif
