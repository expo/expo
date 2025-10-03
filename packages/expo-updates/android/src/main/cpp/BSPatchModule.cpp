#include "BSPatch.h"
#include <cstdlib>
#include <cstring>

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

  char *argv[4];
  argv[0] = strdup("bspatch");
  argv[1] = strdup(oldFile.c_str());
  argv[2] = strdup(newFile.c_str());
  argv[3] = strdup(patchFile.c_str());

  int result = bspatch_main(4, argv);

  for (int i = 0; i < 4; ++i) {
    free(argv[i]);
  }

  return result;
}

}