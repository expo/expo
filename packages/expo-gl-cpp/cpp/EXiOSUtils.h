#ifndef __EXIOSUTILS_H__
#define __EXIOSUTILS_H__

void EXiOSLog(const char *msg, ...) __attribute__((format(printf, 1, 2)));

typedef struct {
  long majorVersion;
  long minorVersion;
  long patchVersion;
} EXiOSOperatingSystemVersion;

EXiOSOperatingSystemVersion EXiOSGetOperatingSystemVersion(void);

#endif

