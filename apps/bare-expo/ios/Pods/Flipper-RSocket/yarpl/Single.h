// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include "yarpl/Refcounted.h"

// include all the things a developer needs for using Single
#include "yarpl/single/Single.h"
#include "yarpl/single/SingleObserver.h"
#include "yarpl/single/SingleObservers.h"
#include "yarpl/single/SingleSubscriptions.h"
#include "yarpl/single/Singles.h"

/**
 * Create a single with code such as this:
 *
 *  auto a = Single<int>::create([](std::shared_ptr<SingleObserver<int>> obs) {
 *    obs->onSubscribe(SingleSubscriptions::empty());
 *    obs->onSuccess(1);
 *  });
 *
 *  // TODO add more documentation
 */
