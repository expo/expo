//
//  FABAttributes.h
//  Fabric
//
//  Copyright (C) 2015 Twitter, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

#pragma once

#define FAB_UNAVAILABLE(x) __attribute__((unavailable(x)))

#if !__has_feature(nullability)
    #define nonnull
    #define nullable
    #define _Nullable
    #define _Nonnull
#endif

#ifndef NS_ASSUME_NONNULL_BEGIN
    #define NS_ASSUME_NONNULL_BEGIN
#endif

#ifndef NS_ASSUME_NONNULL_END
    #define NS_ASSUME_NONNULL_END
#endif


/**
 * The following macros are defined here to provide
 * backwards compatability. If you are still using
 * them you should migrate to the native nullability
 * macros.
 */
#define fab_nullable      nullable
#define fab_nonnull       nonnull
#define FAB_NONNULL       __fab_nonnull
#define FAB_NULLABLE      __fab_nullable
#define FAB_START_NONNULL NS_ASSUME_NONNULL_BEGIN
#define FAB_END_NONNULL   NS_ASSUME_NONNULL_END
