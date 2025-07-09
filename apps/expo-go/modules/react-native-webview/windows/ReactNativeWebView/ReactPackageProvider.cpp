#include "pch.h"
#include "ReactPackageProvider.h"
#if __has_include("ReactPackageProvider.g.cpp")
#include "ReactPackageProvider.g.cpp"
#endif

#include "ReactWebView2Manager.h"
#ifndef USE_WINUI3
#include "ReactWebViewManager.h"
#endif

using namespace winrt::Microsoft::ReactNative;

namespace winrt::ReactNativeWebView::implementation {

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept {
#ifndef USE_WINUI3
  packageBuilder.AddViewManager(L"ReactWebViewManager", []() { return winrt::make<ReactWebViewManager>(); });
#endif

#if HAS_WEBVIEW2
  packageBuilder.AddViewManager(L"ReactWebView2Manager", []() { return winrt::make<ReactWebView2Manager>(); });
#endif
}

} // namespace winrt::ReactNativeWebView::implementation
