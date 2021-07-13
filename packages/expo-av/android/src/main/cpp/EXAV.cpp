//
// Created by Marc Rousavy on 13.07.21.
//

#include <jni.h>
#include <fbjni/fbjni.h>
#include "JAVManager.h"
#include "JPlayerData.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
    return facebook::jni::initialize(vm, [] {
        expo::JAVManager::registerNatives();
        expo::JPlayerData::registerNatives();
    });
}
