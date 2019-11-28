//
//  DTCompatibility.h
//  DTFoundation
//
//  Created by Rene Pirringer on 30.07.15.
//  Copyright (c) 2015 Cocoanetics. All rights reserved.
//

#import <Availability.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED > 80400
#define DT_SUPPORTED_INTERFACE_ORIENTATIONS_RETURN_TYPE UIInterfaceOrientationMask
#else
#define DT_SUPPORTED_INTERFACE_ORIENTATIONS_RETURN_TYPE NSUInteger
#endif

