/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <string>
#include <memory>
#include <mutex>
#include <unordered_set>

#import <jsi/jsi.h>
#import <ReactCommon/CallInvoker.h>

using namespace facebook;
using CallInvoker = facebook::react::CallInvoker;

/**
 * NOTE: This file is a mix of ReactCommon/TurboModuleUtils.h and ReactCommon/LongLivedObject.h
 * Copying it here is needed until we upgrade RN to 0.66 that includes this commit:
 * https://github.com/facebook/react-native/commit/32bfd7a857c23dd417f940d0c09843de257f6c61
 * After that we can just use <ReactCommon/TurboModuleUtils.h>
 *
 * We need to wrap it in another napespace, because it would conflict with existing RN implementation
 */
namespace expo {

/**
 * A simple wrapper class that can be registered to a collection that  keep it
 * alive for extended period of time. This object can be removed from the
 * collection when needed.
 *
 * The subclass of this class must be created using std::make_shared<T>().
 * After creation, add it to the `LongLivedObjectCollection`.
 * When done with the object, call `allowRelease()` to allow the OS to release
 * it.
 */
class LongLivedObject {
 public:
  virtual void allowRelease();
  
 protected:
  LongLivedObject() {}
  virtual ~LongLivedObject() {}
};

/**
 * A singleton, thread-safe, write-only collection for the `LongLivedObject`s.
 */
class LongLivedObjectCollection {
 public:
  static LongLivedObjectCollection &get();

  LongLivedObjectCollection() {}
  LongLivedObjectCollection(LongLivedObjectCollection const &) = delete;
  void operator=(LongLivedObjectCollection const &) = delete;

  void add(std::shared_ptr<LongLivedObject> o) const;
  void remove(const LongLivedObject *o) const;
  void clear() const;

 private:
  mutable std::unordered_set<std::shared_ptr<LongLivedObject>> collection_;
  mutable std::mutex collectionMutex_;
};

// Helper for passing jsi::Function arg to other methods.
class CallbackWrapper : public LongLivedObject {
 private:
  CallbackWrapper(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : longLivedObjectCollection_(),
        callback_(std::move(callback)),
        runtime_(runtime),
        jsInvoker_(std::move(jsInvoker)) {}

  CallbackWrapper(
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection,
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : longLivedObjectCollection_(longLivedObjectCollection),
        callback_(std::move(callback)),
        runtime_(runtime),
        jsInvoker_(std::move(jsInvoker)) {}

  // Use a weak_ptr to avoid a retain cycle: LongLivedObjectCollection owns all
  // CallbackWrappers. So, CallbackWrapper cannot own its
  // LongLivedObjectCollection.
  std::weak_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
  jsi::Function callback_;
  jsi::Runtime &runtime_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(
        new CallbackWrapper(std::move(callback), runtime, jsInvoker));
    LongLivedObjectCollection::get().add(wrapper);
    return wrapper;
  }

  static std::weak_ptr<CallbackWrapper> createWeak(
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection,
      jsi::Function &&callback,
      jsi::Runtime &runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(new CallbackWrapper(
        longLivedObjectCollection, std::move(callback), runtime, jsInvoker));
    longLivedObjectCollection->add(wrapper);
    return wrapper;
  }

  // Delete the enclosed jsi::Function
  void destroy() {
    allowRelease();
  }

  jsi::Function &callback() {
    return callback_;
  }

  jsi::Runtime &runtime() {
    return runtime_;
  }

  CallInvoker &jsInvoker() {
    return *(jsInvoker_);
  }

  void allowRelease() override {
    if (auto longLivedObjectCollection = longLivedObjectCollection_.lock()) {
      if (longLivedObjectCollection != nullptr) {
        longLivedObjectCollection->remove(this);
        return;
      }
    }
    LongLivedObject::allowRelease();
  }
};

}
