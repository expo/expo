#include "BSPatch.h"

namespace jni = facebook::jni;

extern "C" int main(int argc, char *argv[]);

namespace expo {

// static
void BSPatch::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", BSPatch::initHybrid),
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

  char *argv[] = {
      const_cast<char*>("bspatch"),
      const_cast<char*>(oldFile.c_str()),
      const_cast<char*>(newFile.c_str()),
      const_cast<char*>(patchFile.c_str())
  };

  return main(4, argv);
}

jni::local_ref<BSPatch::jhybriddata>
BSPatch::initHybrid(jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

}