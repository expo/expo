// Software License Agreement (BSD License)
//
// Copyright (c) 2010-2019, Deusty, LLC
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms,
// with or without modification, are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
//
// * Neither the name of Deusty nor the names of its contributors may be used
//   to endorse or promote products derived from this software without specific
//   prior written permission of Deusty, LLC.

#import <CocoaLumberjack/CocoaLumberjack.h>

NS_ASSUME_NONNULL_BEGIN

@interface DDFileLogger (Internal)

- (void)logData:(NSData *)data;

// Will assert if used outside logger's queue.
- (void)lt_logData:(NSData *)data;

- (NSData *)lt_dataForMessage:(DDLogMessage *)message;

@end

NS_ASSUME_NONNULL_END
