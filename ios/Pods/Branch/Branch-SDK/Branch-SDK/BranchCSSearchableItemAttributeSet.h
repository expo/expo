//
//  BranchCSSearchableItemAttributeSet.h
//  Branch-TestBed
//
//  Created by Derrick Staten on 9/8/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 90000
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"

#if __has_feature(modules)
@import CoreSpotlight;
@import MobileCoreServices;
#else
#import <CoreSpotlight/CoreSpotlight.h>
#import <MobileCoreServices/MobileCoreServices.h>
#endif

@interface BranchCSSearchableItemAttributeSet : CSSearchableItemAttributeSet

- (id)init;
- (id)initWithContentType:(NSString *)type;
- (void)indexWithCallback:(void (^) (NSString * url,
                                     NSString * spotlightIdentifier,
                                     NSError * error))callback;

@property (nonatomic, strong) NSDictionary *params;
@property (nonatomic, strong) NSSet *keywords;
@property (nonatomic) BOOL publiclyIndexable;           //!< Defaults to YES

@end

#pragma clang diagnostic pop
#endif
