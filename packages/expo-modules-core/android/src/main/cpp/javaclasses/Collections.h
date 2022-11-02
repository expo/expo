#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo::java {

template<typename E = jobject>
struct Iterable : public jni::JavaClass<Iterable<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/lang/Iterable;";
};

template<typename E = jobject>
struct Collection : public jni::JavaClass<Collection<E>, Iterable<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Collection;";

  bool add(jni::alias_ref<E> element) {
    static auto addMethod = Collection<E>::javaClassStatic()->
      template getMethod<jboolean(jni::alias_ref<jni::JObject>)>("add");
    return addMethod(this->self(), element);
  }
};

template<typename E = jobject>
struct List : public jni::JavaClass<List<E>, Collection<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/List;";
};

template<typename E = jobject>
struct ArrayList : public jni::JavaClass<ArrayList<E>, List<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/ArrayList;";

  static jni::local_ref<typename ArrayList<E>::javaobject> create(size_t size) {
    return ArrayList<E>::newInstance((int) size);
  }
};

template<typename K = jobject, typename V = jobject>
struct Map : public jni::JavaClass<Map<K, V>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Map;";

  jni::local_ref<V> put(jni::alias_ref<K> key, jni::alias_ref<V> value) {
    static auto putMethod = Map<K, V>::javaClassStatic()->
      template getMethod<jni::local_ref<V>(jni::alias_ref<K>, jni::alias_ref<V>)>("put");
    return putMethod(this->self(), key, value);
  }
};

template<typename K = jobject, typename V = jobject>
struct HashMap : public jni::JavaClass<HashMap<K, V>, Map<K, V>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/HashMap;";
};

template<typename K = jobject, typename V = jobject>
struct LinkedHashMap : public jni::JavaClass<LinkedHashMap<K, V>, HashMap<K, V>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/LinkedHashMap;";

  static jni::local_ref<typename LinkedHashMap<K, V>::javaobject> create(size_t size) {
    return LinkedHashMap<K, V>::newInstance((int) size);
  }
};
} // namespace expo::java
