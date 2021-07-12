//
// Created by Marc Rousavy on 12.07.21.
//

#pragma once

#include <jni.h>
#include <fbjni/fbjni.h>

#include <memory>

namespace expo {

using namespace facebook;
using SampleBufferCallback = std::function<void(jint)>;

class JMediaPlayerData : public jni::HybridClass<JMediaPlayerData> {
public:
    static auto constexpr kJavaDescriptor = "Lexpo.modules.av.player/MediaPlayerData;";
    static auto constexpr TAG = "JMediaPlayerData";
    static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);
    static void registerNatives();

    void setSampleBufferCallback(const SampleBufferCallback&& sampleBufferCallback);
    void unsetSampleBufferCallback();
    void setEnableSampleBufferCallback(bool enable);

private:
    friend HybridBase;
    jni::global_ref<JMediaPlayerData::javaobject> javaPart_;
    SampleBufferCallback sampleBufferCallback_;

    void sampleBufferCallback(jint sampleBuffer);

    explicit JMediaPlayerData(jni::alias_ref<CameraView::jhybridobject> jThis) :
            javaPart_(jni::make_global(jThis)),
            sampleBufferCallback_(nullptr)
    {}
};

} // namespace expo
