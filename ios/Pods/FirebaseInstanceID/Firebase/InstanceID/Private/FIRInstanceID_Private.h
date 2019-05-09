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

#import <FirebaseInstanceID/FIRInstanceID.h>

/**
 * Private API used by other Firebase SDKs.
 */
@interface FIRInstanceID ()

/**
 *  Private initializer.
 */
- (nonnull instancetype)initPrivately;

/**
 *  Returns a Firebase Messaging scoped token for the firebase app.
 *
 *  @return Returns the stored token if the device has registered with Firebase Messaging, otherwise
 *          returns nil.
 */
- (nullable NSString *)token;

@end
