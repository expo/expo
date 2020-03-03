//
//  ABI37_0_0AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import "ABI37_0_0AIRGoogleMap.h"

@interface ABI37_0_0AIRGoogleMapManager : ABI37_0_0RCTViewManager
@property (nonatomic, assign) ABI37_0_0AIRGoogleMap *map;

@end

#endif
