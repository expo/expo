#ifndef __EXIOSUTILS_H__
#define __EXIOSUTILS_H__

void EXiOSLog(const char *msg, ...) __attribute__((format(printf, 1, 2)));

struct EXiOSOperatingSystemVersion {
  long majorVersion;
  long minorVersion;
  long patchVersion;
};

EXiOSOperatingSystemVersion EXiOSGetOperatingSystemVersion();

#endif

