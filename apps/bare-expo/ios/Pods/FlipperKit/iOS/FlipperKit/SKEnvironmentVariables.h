/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

/*
 * This class exists to retreive configuration values stored in environment
 * variables.
 */
@interface SKEnvironmentVariables : NSObject
+ (int)getInsecurePort;
+ (int)getSecurePort;
@end

#endif
