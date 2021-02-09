/*
 * Copyright 2019 Google
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

#import <Foundation/Foundation.h>

#import <FirebaseCoreDiagnosticsInterop/FIRCoreDiagnosticsData.h>

NS_ASSUME_NONNULL_BEGIN

/** Implements the FIRCoreDiagnosticsData protocol to log diagnostics data. */
@interface FIRDiagnosticsData : NSObject <FIRCoreDiagnosticsData>

/** Inserts values into the diagnosticObjects dictionary if the value isn't nil.
 *
 * @param value The value to insert if it's not nil.
 * @param key The key to associate it with.
 */
- (void)insertValue:(nullable id)value forKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
