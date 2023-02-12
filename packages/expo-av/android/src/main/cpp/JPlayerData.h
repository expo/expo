// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>

namespace expo {
  namespace av {

    namespace jni = facebook::jni;

    using SampleBufferCallback = std::function<void(jni::local_ref<jni::JArrayByte>, double)>;

    class JPlayerData : public jni::HybridClass<JPlayerData> {
    public:
      static auto constexpr kJavaDescriptor = "Lexpo/modules/av/player/PlayerData;";
      static auto constexpr TAG = "JPlayerData";

      static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

      static void registerNatives();

      void setSampleBufferCallback(const SampleBufferCallback &&sampleBufferCallback);

      void unsetSampleBufferCallback();

    private:
      friend HybridBase;
      jni::global_ref<JPlayerData::javaobject> javaPart_;
      SampleBufferCallback sampleBufferCallback_;

      void
      sampleBufferCallback(jni::alias_ref<jni::JArrayByte> sampleBuffer, jdouble positionSeconds);

      void setEnableSampleBufferCallback(bool enable);

      explicit JPlayerData(jni::alias_ref<jhybridobject> jThis) :
        javaPart_(jni::make_global(jThis)),
        sampleBufferCallback_(nullptr) {}
    };

  } // namespace av
} // namespace expo
