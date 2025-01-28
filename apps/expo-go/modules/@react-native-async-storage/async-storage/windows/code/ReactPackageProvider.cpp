// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
#include "pch.h"

#include "ReactPackageProvider.h"

#include "RNCAsyncStorage.h"
#include "ReactPackageProvider.g.cpp"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeAsyncStorage::implementation
{

    void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
    {
        AddAttributedModules(packageBuilder);
    }

}  // namespace winrt::ReactNativeAsyncStorage::implementation
