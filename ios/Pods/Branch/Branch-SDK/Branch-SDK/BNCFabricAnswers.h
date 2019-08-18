//
//  BNCFabricAnswers.h
//  Branch-TestBed
//
//  Created by Ahmed Nawar on 6/2/16.
//  Copyright © 2016 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCFabricAnswers : NSObject

+ (NSDictionary*) branchConfigurationDictionary;
+ (void)sendEventWithName:(NSString*)name andAttributes:(NSDictionary*)attributes;

@end
