#pragma once

#import <Foundation/Foundation.h>

int EXUpdatesApplyBSDiffPatch(const char * _Nonnull oldFilePath,
                              const char * _Nonnull newFilePath,
                              const char * _Nonnull patchFilePath);