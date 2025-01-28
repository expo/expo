// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
#pragma once

#include "ReactPackageProvider.g.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeAsyncStorage::implementation
{
    struct ReactPackageProvider : ReactPackageProviderT<ReactPackageProvider> {
        ReactPackageProvider() = default;

        void CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept;
    };
}  // namespace winrt::ReactNativeAsyncStorage::implementation

namespace winrt::ReactNativeAsyncStorage::factory_implementation
{
    struct ReactPackageProvider
        : ReactPackageProviderT<ReactPackageProvider, implementation::ReactPackageProvider> {
    };
}  // namespace winrt::ReactNativeAsyncStorage::factory_implementation
