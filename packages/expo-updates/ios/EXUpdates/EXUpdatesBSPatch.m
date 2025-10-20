// Copyright 2015-present 650 Industries. All rights reserved.

#include "EXUpdatesBSPatch.h"

extern int bspatch_main(int argc, char *argv[]);

int EXUpdatesApplyBSDiffPatch(const char *oldFilePath,
                              const char *newFilePath,
                              const char *patchFilePath) {
  const char *argvConst[4] = {
    "bspatch",
    oldFilePath,
    newFilePath,
    patchFilePath,
  };

  return bspatch_main(4, (char **)argvConst);
}
