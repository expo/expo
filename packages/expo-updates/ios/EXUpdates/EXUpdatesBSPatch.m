#include "EXUpdatesBSPatch.h"

#include <stdlib.h>
#include <string.h>

extern int bspatch_main(int argc, char *argv[]);

int EXUpdatesApplyBSDiffPatch(const char *oldFilePath,
                              const char *newFilePath,
                              const char *patchFilePath) {
  char *argv[4];
  argv[0] = strdup("bspatch");
  argv[1] = strdup(oldFilePath);
  argv[2] = strdup(newFilePath);
  argv[3] = strdup(patchFilePath);

  int result = bspatch_main(4, argv);

  for (int i = 0; i < 4; ++i) {
    free(argv[i]);
  }
  return result;
}
