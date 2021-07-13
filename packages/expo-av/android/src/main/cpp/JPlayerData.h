//
// Created by Marc Rousavy on 12.07.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>

namespace expo {

using namespace facebook;
using SampleBufferCallback = std::function<void(jni::local_ref<jni::JArrayByte>)>;

class JPlayerData : public jni::HybridClass<JPlayerData> {
public:
    static auto constexpr kJavaDescriptor = "Lexpo/modules/av/player/PlayerData;";
    static auto constexpr TAG = "JPlayerData";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
    static void registerNatives();

    void setSampleBufferCallback(const SampleBufferCallback&& sampleBufferCallback);
    void unsetSampleBufferCallback();

private:
    friend HybridBase;
    jni::global_ref<JPlayerData::javaobject> javaPart_;
    SampleBufferCallback sampleBufferCallback_;

    void sampleBufferCallback(jni::alias_ref<jni::JArrayByte> sampleBuffer);
    void setEnableSampleBufferCallback(bool enable);

    explicit JPlayerData(jni::alias_ref<JPlayerData::jhybridobject> jThis) :
            javaPart_(jni::make_global(jThis)),
            sampleBufferCallback_(nullptr)
    {}
};

} // namespace expo
