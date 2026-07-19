#include "../ExpoHeader.pch"
#include "WorkletRuntimeInstaller.h"
#include "Worklet.h"
#include "WorkletNativeRuntime.h"
#include "SynchronizableFrontendConverter.h"
#include "../types/FrontendConverterProvider.h"
#include "../types/CppType.h"

#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::WorkletNativeRuntime::registerNatives();
    expo::WorkletRuntimeInstaller::registerNatives();
    expo::Worklet::registerNatives();

    expo::FrontendConverterProvider::instance()->registerConverter(
      expo::CppType::SERIALIZABLE,
      std::make_shared<expo::SynchronizableFrontendConverter>()
    );
  });
}
