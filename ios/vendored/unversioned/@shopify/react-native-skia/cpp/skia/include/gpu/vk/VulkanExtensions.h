/*
 * Copyright 2022 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef skgpu_VulkanExtensions_DEFINED
#define skgpu_VulkanExtensions_DEFINED

#include "include/core/SkString.h"
#include "include/gpu/vk/VulkanTypes.h"
#include "include/private/SkTArray.h"

namespace skgpu {

/**
 * Helper class that eats in an array of extensions strings for instance and device and allows for
 * quicker querying if an extension is present.
 */
class SK_API VulkanExtensions {
public:
    VulkanExtensions() {}

    void init(VulkanGetProc, VkInstance, VkPhysicalDevice,
              uint32_t instanceExtensionCount, const char* const* instanceExtensions,
              uint32_t deviceExtensionCount, const char* const* deviceExtensions);

    bool hasExtension(const char[], uint32_t minVersion) const;

    struct Info {
        Info() {}
        Info(const char* name) : fName(name), fSpecVersion(0) {}

        SkString fName;
        uint32_t fSpecVersion;

        struct Less {
            bool operator()(const Info& a, const SkString& b) const {
                return strcmp(a.fName.c_str(), b.c_str()) < 0;
            }
            bool operator()(const SkString& a, const VulkanExtensions::Info& b) const {
                return strcmp(a.c_str(), b.fName.c_str()) < 0;
            }
        };
    };

#ifdef SK_DEBUG
    void dump() const {
        SkDebugf("**Vulkan Extensions**\n");
        for (int i = 0; i < fExtensions.count(); ++i) {
            SkDebugf("%s. Version: %d\n",
                     fExtensions[i].fName.c_str(), fExtensions[i].fSpecVersion);
        }
        SkDebugf("**End Vulkan Extensions**\n");
    }
#endif

private:
    void getSpecVersions(VulkanGetProc getProc, VkInstance, VkPhysicalDevice);

    SkTArray<Info> fExtensions;
};

} // namespace skgpu

#endif // skgpu_VulkanExtensions_DEFINED
