/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <EXAV/CallbackWrapper.h>

/**
 * NOTE: This file is a copy of ReactCommon/LongLivedObject.cpp
 * Copying it here is needed until we upgrade RN to 0.66 that includes this commit:
 * https://github.com/facebook/react-native/commit/32bfd7a857c23dd417f940d0c09843de257f6c61
 * After that we can just use <ReactCommon/TurboModuleUtils.h>
 *
 * We need to wrap it in another napespace, because it would conflict with existing RN implementation
 */
namespace expo {

// LongLivedObjectCollection
LongLivedObjectCollection &LongLivedObjectCollection::get() {
  static LongLivedObjectCollection instance;
  return instance;
}

void LongLivedObjectCollection::add(std::shared_ptr<LongLivedObject> so) const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  collection_.insert(so);
}

void LongLivedObjectCollection::remove(const LongLivedObject *o) const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  auto p = collection_.begin();
  for (; p != collection_.end(); p++) {
    if (p->get() == o) {
      break;
    }
  }
  if (p != collection_.end()) {
    collection_.erase(p);
  }
}

void LongLivedObjectCollection::clear() const {
  std::lock_guard<std::mutex> lock(collectionMutex_);
  collection_.clear();
}

// LongLivedObject
void LongLivedObject::allowRelease() {
  LongLivedObjectCollection::get().remove(this);
}

}

