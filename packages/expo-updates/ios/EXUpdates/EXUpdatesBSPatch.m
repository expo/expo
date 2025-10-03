#include "EXUpdatesBSPatch.h"

#include <errno.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char *gErrorBuffer = NULL;
static size_t gErrorBufferSize = 0;

static int EXUpdatesStoreError(int exitCode, const char *format, ...) {
  if (gErrorBuffer && gErrorBufferSize > 0 && format) {
    va_list args;
    va_start(args, format);
    vsnprintf(gErrorBuffer, gErrorBufferSize, format, args);
    va_end(args);
  }
  return exitCode;
}

#define err(exitcode, fmt, ...) \
  return EXUpdatesStoreError(exitcode, fmt, ##__VA_ARGS__)

#define errx(exitcode, fmt, ...) \
  return EXUpdatesStoreError(exitcode, fmt, ##__VA_ARGS__)

#define main EXUpdatesBSPatchInternalMain
#include "bspatch.c"
#undef main
#undef err
#undef errx

static void writeError(char *buffer, size_t size, const char *message) {
  if (!buffer || size == 0) {
    return;
  }
  strncpy(buffer, message, size - 1);
  buffer[size - 1] = '\0';
}

int EXUpdatesApplyBSDiffPatch(const char *oldFilePath,
                              const char *newFilePath,
                              const char *patchFilePath,
                              char *errorBuffer,
                              size_t errorBufferSize) {
  gErrorBuffer = errorBuffer;
  gErrorBufferSize = errorBufferSize;

  char *argv[5] = { NULL, NULL, NULL, NULL, NULL };
  argv[0] = strdup("bspatch");
  argv[1] = strdup(oldFilePath);
  argv[2] = strdup(newFilePath);
  argv[3] = strdup(patchFilePath);

  int result = EXUpdatesBSPatchInternalMain(4, argv);

  for (int i = 0; i < 4; ++i) {
    free(argv[i]);
  }
  return result;
}
