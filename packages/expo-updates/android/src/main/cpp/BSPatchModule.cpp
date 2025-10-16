// Copyright 2015-present 650 Industries. All rights reserved.

#include "BSPatch.h"
#include <array>

namespace jni = facebook::jni;

extern "C" int bspatch_main(int argc, char *argv[]);

namespace expo {

void BSPatch::registerNatives() {
  javaClassStatic()->registerNatives({
    makeNativeMethod("applyPatch", BSPatch::applyPatch),
  });
}

jint BSPatch::applyPatch(jni::alias_ref<jni::JClass>,
  jni::alias_ref<jni::JString> oldFilePath,
  jni::alias_ref<jni::JString> newFilePath,
  jni::alias_ref<jni::JString> patchFilePath) {
  std::string oldFile = oldFilePath->toStdString();
  std::string newFile = newFilePath->toStdString();
  std::string patchFile = patchFilePath->toStdString();

  std::array<char *, 4> argv = {
    const_cast<char *>("bspatch"),
    const_cast<char *>(oldFile.c_str()),
    const_cast<char *>(newFile.c_str()),
    const_cast<char *>(patchFile.c_str()),
  };

  return bspatch_main(static_cast<int>(argv.size()), argv.data());
}

}
