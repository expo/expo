  #pragma once
  #include <stddef.h>

  #ifdef __cplusplus
  extern "C" {
  #endif

  int EXUpdatesApplyBSDiffPatch(const char *oldFilePath,
                                const char *newFilePath,
                                const char *patchFilePath,
                                char *errorBuffer,
                                size_t errorBufferSize);

  #ifdef __cplusplus
  }
  #endif