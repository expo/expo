#pragma once

#define NOMINMAX

#if __has_include(<VersionMacros.h>)
#include <VersionMacros.h>
#else
#define RNW_VERSION_AT_LEAST(x,y,z) false
#endif

#if RNW_VERSION_AT_LEAST(0,68,0) && (defined(WINUI2_HAS_WEBVIEW2) || defined(USE_WINUI3))
#define HAS_WEBVIEW2 1
#else
#define HAS_WEBVIEW2 0
#endif

#include <unknwn.h>

#include <CppWinRTIncludes.h>
#include <UI.Xaml.Controls.h>
#include <UI.Xaml.Input.h>
#include <UI.Xaml.Markup.h>
#include <UI.Xaml.Navigation.h>

#include <winrt/Windows.Data.Json.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Foundation.Collections.h>
#include <winrt/Windows.UI.Popups.h>
#include <winrt/Windows.Web.Http.h>
#include <winrt/Windows.Web.Http.Headers.h>
#include <winrt/Microsoft.ReactNative.h>
#include <winrt/Microsoft.UI.Xaml.Controls.h>
#include <winrt/Windows.Security.Cryptography.h>
#include <winrt/Windows.Storage.Streams.h>
#if HAS_WEBVIEW2
#include <winrt/Microsoft.Web.WebView2.Core.h>
#endif
