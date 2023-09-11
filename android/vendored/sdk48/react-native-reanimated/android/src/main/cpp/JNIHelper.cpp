#include "JNIHelper.h"

namespace reanimated {

using namespace facebook::jni;
using namespace facebook;
using namespace react;

local_ref<JNIHelper::PropsMap> JNIHelper::PropsMap::create() {
  return newInstance();
}

void JNIHelper::PropsMap::put(
    const std::string &key,
    jni::local_ref<JObject> object) {
  static auto method =
      getClass()
          ->getMethod<jobject(
              jni::local_ref<JObject>, jni::local_ref<JObject>)>("put");
  method(self(), jni::make_jstring(key), object);
}

jni::local_ref<JNIHelper::PropsMap> JNIHelper::ConvertToPropsMap(
    jsi::Runtime &rt,
    const jsi::Object &props) {
  auto map = PropsMap::create();

  auto propNames = props.getPropertyNames(rt);
  for (size_t i = 0, size = propNames.size(rt); i < size; i++) {
    auto jsiKey = propNames.getValueAtIndex(rt, i).asString(rt);
    auto value = props.getProperty(rt, jsiKey);
    auto key = jsiKey.utf8(rt);
    if (value.isUndefined() || value.isNull()) {
      map->put(key, nullptr);
    } else if (value.isBool()) {
      map->put(key, JBoolean::valueOf(value.getBool()));
    } else if (value.isNumber()) {
      map->put(key, jni::autobox(value.asNumber()));
    } else if (value.isString()) {
      map->put(key, jni::make_jstring(value.asString(rt).utf8(rt)));
    } else if (value.isObject()) {
      if (value.asObject(rt).isArray(rt)) {
        map->put(
            key,
            ReadableNativeArray::newObjectCxxArgs(
                jsi::dynamicFromValue(rt, value)));
      } else {
        map->put(
            key,
            ReadableNativeMap::newObjectCxxArgs(
                jsi::dynamicFromValue(rt, value)));
      }
    }
  }

  return map;
}

}; // namespace reanimated
