//
//  AmplitudePrivate.h
//  Amplitude
//
//  Created by Hao Liu on 3/15/20.
//  Copyright © 2020 Amplitude. All rights reserved.
//

#import "Amplitude.h"

@interface Amplitude ()

@property (nonatomic, copy, readwrite) NSString *apiKey;
@property (nonatomic, copy, readwrite) NSString *userId;
@property (nonatomic, copy, readwrite) NSString *deviceId;
@property (nonatomic, copy, readwrite) NSString *instanceName;

@end
