/*
 * Copyright 2020 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <GoogleDataTransport/GDTCOREvent.h>

NS_ASSUME_NONNULL_BEGIN

/** A string sets in customBytes as a key paired to @YES if current event needs to
 * populate network connection info data, @NO otherwise.
 */
FOUNDATION_EXPORT NSString *const GDTCCTNeedsNetworkConnectionInfo;

/** A string sets in customBytes as a key paired to the network connection info data
 * of current event.
 */
FOUNDATION_EXPORT NSString *const GDTCCTNetworkConnectionInfo;

/** A category that uses the customBytes property of a GDTCOREvent to store network connection info.
 */
@interface GDTCOREvent (CCTNetworkConnectionInfo)

/** If YES, needs the network connection info field set during prioritization.
 * @note Uses the GDTCOREvent customBytes property.
 */
@property(nonatomic) BOOL needsNetworkConnectionInfoPopulated;

/** The network connection info as collected at the time of the event.
 * @note Uses the GDTCOREvent customBytes property.
 */
@property(nullable, nonatomic) NSData *networkConnectionInfoData;

@end

NS_ASSUME_NONNULL_END
