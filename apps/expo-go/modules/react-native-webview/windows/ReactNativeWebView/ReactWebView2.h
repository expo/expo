// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma once

#if HAS_WEBVIEW2
#include "winrt/Microsoft.ReactNative.h"
#include "NativeModules.h"
#include "ReactWebView2.g.h"

#include "winrt/ReactNativeWebView.h"

using namespace winrt::ReactNativeWebView;

namespace winrt::ReactNativeWebView::implementation {

    class ReactWebView2 : public ReactWebView2T<ReactWebView2> {
    public:
        ReactWebView2(Microsoft::ReactNative::IReactContext const& reactContext);
        void MessagingEnabled(bool enabled) noexcept;
        bool MessagingEnabled() const noexcept;
        void LinkHandlingEnabled(bool enabled) noexcept;
        bool LinkHandlingEnabled() const noexcept;
        void WebResourceRequestSource(Microsoft::ReactNative::JSValueObject const& source) noexcept;
        Microsoft::ReactNative::JSValueObject WebResourceRequestSource() const noexcept;
        void InjectedJavascript(winrt::hstring const& injectedJavascript) noexcept;
        winrt::hstring InjectedJavascript() const noexcept;
        void NavigateToHtml(winrt::hstring const& html);
        winrt::fire_and_forget NavigateWithWebResourceRequest(Microsoft::ReactNative::IJSValueReader const& source);
        ~ReactWebView2();

    private:
        winrt::hstring m_navigateToHtml = L"";
        winrt::Microsoft::ReactNative::JSValueObject m_request{};
        bool m_messagingEnabled{ true };
        bool m_linkHandlingEnabled{ true };
        winrt::hstring m_injectedJavascript = L"";


        winrt::Microsoft::UI::Xaml::Controls::WebView2 m_webView{ nullptr };
        Microsoft::ReactNative::IReactContext m_reactContext{ nullptr };
        winrt::event_token m_messageToken;
        winrt::Microsoft::UI::Xaml::Controls::WebView2::NavigationStarting_revoker m_navigationStartingRevoker{};
        winrt::Microsoft::UI::Xaml::Controls::WebView2::NavigationCompleted_revoker m_navigationCompletedRevoker{};
        winrt::Microsoft::UI::Xaml::Controls::WebView2::CoreWebView2Initialized_revoker m_CoreWebView2InitializedRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::WebResourceRequested_revoker
            m_webResourceRequestedRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::DOMContentLoaded_revoker
            m_CoreWebView2DOMContentLoadedRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::FrameNavigationStarting_revoker m_frameNavigationStartingRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::FrameNavigationCompleted_revoker m_frameNavigationCompletedRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::SourceChanged_revoker m_sourceChangedRevoker{};
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2::NewWindowRequested_revoker m_newWindowRequestedRevoker{};
        void HandleMessageFromJS(winrt::hstring const& message);
        void RegisterEvents();
        void RegisterCoreWebView2Events();
        void WriteWebViewNavigationEventArg(winrt::Microsoft::UI::Xaml::Controls::WebView2 const& sender, winrt::Microsoft::ReactNative::IJSValueWriter const& eventDataWriter);
        void OnNavigationStarting(winrt::Microsoft::UI::Xaml::Controls::WebView2 const& sender, winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationStartingEventArgs const& args);
        void OnNavigationCompleted(winrt::Microsoft::UI::Xaml::Controls::WebView2 const& sender, winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationCompletedEventArgs const& args);
        void OnCoreWebView2Initialized(winrt::Microsoft::UI::Xaml::Controls::WebView2 const& sender, winrt::Microsoft::UI::Xaml::Controls::CoreWebView2InitializedEventArgs const& args);
        void OnCoreWebView2ResourceRequseted(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2WebResourceRequestedEventArgs const& args);
        void OnCoreWebView2DOMContentLoaded(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2DOMContentLoadedEventArgs const& args);
        void OnCoreWebView2FrameNavigationStarted(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationStartingEventArgs const& args);
        void OnCoreWebView2FrameNavigationCompleted(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationCompletedEventArgs const& args);
        void OnCoreWebView2SourceChanged(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2SourceChangedEventArgs const& args);
        void OnCoreWebView2NewWindowRequested(
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
            winrt::Microsoft::Web::WebView2::Core::CoreWebView2NewWindowRequestedEventArgs const& args);

        void OnMessagePosted(hstring const& message);
        bool Is17763OrHigher();
        void WriteCookiesToWebView2(std::string const& cookies);
        void SetupRequest(Microsoft::ReactNative::JSValueObject const& srcMap, winrt::Microsoft::Web::WebView2::Core::CoreWebView2WebResourceRequest const& request);
    };
} // namespace winrt::ReactNativeWebView2::implementation

namespace winrt::ReactNativeWebView::factory_implementation {
    struct ReactWebView2 : ReactWebView2T<ReactWebView2, implementation::ReactWebView2> {};
} // namespace winrt::ReactNativeWebView2::factory_implementation

#endif // HAS_WEBVIEW2
