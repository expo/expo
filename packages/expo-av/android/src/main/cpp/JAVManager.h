// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

#include "JPlayerData.h"

namespace expo {
  namespace av {

    namespace jni = facebook::jni;

    class JAVManager : public jni::HybridClass<JAVManager> {
    public:
      static auto constexpr kJavaDescriptor = "Lexpo/modules/av/AVManager;";
      static auto constexpr TAG = "JAVManager";

      static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

      static void registerNatives();

      void installJSIBindings(jlong jsRuntimePointer,
                              jni::alias_ref<facebook::react::CallInvokerHolder::javaobject> jsCallInvokerHolder);

    private:
      friend HybridBase;
      jni::global_ref<JAVManager::javaobject> javaPart_;

      explicit JAVManager(jni::alias_ref<jhybridobject> jThis) :
        javaPart_(jni::make_global(jThis)) {}

      JPlayerData *getMediaPlayerById(int id);
    };

  } // namespace av
} // namespace expo
