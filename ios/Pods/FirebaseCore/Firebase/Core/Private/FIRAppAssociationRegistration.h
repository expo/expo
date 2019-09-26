/*
 * Copyright 2017 Google
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

NS_ASSUME_NONNULL_BEGIN

//  TODO: Remove this once Auth moves over to Core's instance registration system.
/** @class FIRAppAssociationRegistration
    @brief Manages object associations as a singleton-dependent: At most one object is
        registered for any given host/key pair, and the object shall be created on-the-fly when
        asked for.
 */
@interface FIRAppAssociationRegistration<ObjectType> : NSObject

/** @fn registeredObjectWithHost:key:creationBlock:
    @brief Retrieves the registered object with a particular host and key.
    @param host The host object.
    @param key The key to specify the registered object on the host.
    @param creationBlock The block to return the object to be registered if not already.
        The block is executed immediately before this method returns if it is executed at all.
        It can also be executed multiple times across different method invocations if previous
        execution of the block returns @c nil.
    @return The registered object for the host/key pair, or @c nil if no object is registered
        and @c creationBlock returns @c nil.
    @remarks The method is thread-safe but non-reentrant in the sense that attempting to call this
        method again within the @c creationBlock with the same host/key pair raises an exception.
        The registered object is retained by the host.
 */
+ (nullable ObjectType)registeredObjectWithHost:(id)host
                                            key:(NSString *)key
                                  creationBlock:(ObjectType _Nullable (^)(void))creationBlock;

@end

NS_ASSUME_NONNULL_END
