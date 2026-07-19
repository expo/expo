// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"
#include "ReactWebView2.h"
#include "ReactWebViewHelpers.h"

#if HAS_WEBVIEW2
#include "JSValueXaml.h"
#include "ReactWebView2.g.cpp"
#include <winrt/Windows.Foundation.Metadata.h>
#include <winrt/Windows.System.h>
#include <optional>

namespace mux {
    using namespace winrt::Microsoft::UI::Xaml::Controls;
}

namespace winrt {
    using namespace Microsoft::ReactNative;
    using namespace Windows::Foundation;
    using namespace Microsoft::Web::WebView2::Core;
    using namespace Windows::Data::Json;
    using namespace Windows::UI::Popups;
    using namespace Windows::Web::Http;
    using namespace Windows::Storage::Streams;
    using namespace Windows::Security::Cryptography;
    using namespace xaml;
    using namespace xaml::Controls;
    using namespace xaml::Input;
    using namespace xaml::Media;
} // namespace winrt

namespace winrt::ReactNativeWebView::implementation {

    ReactWebView2::ReactWebView2(winrt::IReactContext const& reactContext) : m_reactContext(reactContext) {
        m_webView = mux::WebView2();
        this->Content(m_webView);
        RegisterEvents();
    }

    ReactWebView2::~ReactWebView2() {}

    void ReactWebView2::RegisterEvents() {
        m_navigationStartingRevoker = m_webView.NavigationStarting(
            winrt::auto_revoke, [ref = get_weak()](auto const& sender, auto const& args) {
                if (auto self = ref.get()) {
                    self->OnNavigationStarting(sender, args);
                }

            });

        m_navigationCompletedRevoker = m_webView.NavigationCompleted(
            winrt::auto_revoke, [ref = get_weak()](auto const& sender, auto const& args) {
                if (auto self = ref.get()) {
                    self->OnNavigationCompleted(sender, args);
                }
            });

        m_CoreWebView2InitializedRevoker = m_webView.CoreWebView2Initialized(
            winrt::auto_revoke, [ref = get_weak()](auto const& sender, auto const& args){
            if (auto self = ref.get()) {
                self->OnCoreWebView2Initialized(sender, args);
            }
        });
    }

    void ReactWebView2::RegisterCoreWebView2Events()
    {
        // We need to wait for the CoreWebView component to be initialized before registering its event listeners
        assert(m_webView.CoreWebView2());
        m_webResourceRequestedRevoker = m_webView.CoreWebView2().WebResourceRequested(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2ResourceRequseted(sender, args);
                }
            });

        m_CoreWebView2DOMContentLoadedRevoker = m_webView.CoreWebView2().DOMContentLoaded(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2DOMContentLoaded(sender, args);
                }
            });

        m_frameNavigationStartingRevoker = m_webView.CoreWebView2().FrameNavigationStarting(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2FrameNavigationStarted(sender, args);
                }
            });

        m_frameNavigationCompletedRevoker = m_webView.CoreWebView2().FrameNavigationCompleted(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2FrameNavigationCompleted(sender, args);
                }
            });

        m_sourceChangedRevoker = m_webView.CoreWebView2().SourceChanged(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2SourceChanged(sender, args);
                }
            });

        m_newWindowRequestedRevoker = m_webView.CoreWebView2().NewWindowRequested(
            winrt::auto_revoke,
            [ref = get_weak()](auto const& sender, auto const& args)
            {
                if (auto self = ref.get())
                {
                    self->OnCoreWebView2NewWindowRequested(sender, args);
                }
            });
    }

    bool ReactWebView2::Is17763OrHigher() {
        static std::optional<bool> hasUniversalAPIContract_v7;

        if (!hasUniversalAPIContract_v7.has_value()) {
            hasUniversalAPIContract_v7 = winrt::Windows::Foundation::Metadata::ApiInformation::IsApiContractPresent(L"Windows.Foundation.UniversalApiContract", 7);
        }
        return hasUniversalAPIContract_v7.value();
    }

    void ReactWebView2::WriteWebViewNavigationEventArg(mux::WebView2 const& sender, winrt::IJSValueWriter const& eventDataWriter) {
        auto tag = this->GetValue(winrt::FrameworkElement::TagProperty()).as<winrt::IPropertyValue>().GetInt64();
        WriteProperty(eventDataWriter, L"canGoBack", sender.CanGoBack());
        WriteProperty(eventDataWriter, L"canGoForward", sender.CanGoForward());
        if (Is17763OrHigher()) {
            WriteProperty(eventDataWriter, L"loading", !sender.IsLoaded());
        }
        WriteProperty(eventDataWriter, L"target", tag);
        if (auto uri = sender.Source()) {
            WriteProperty(eventDataWriter, L"url", uri.AbsoluteCanonicalUri());
        }
    }

    void ReactWebView2::OnNavigationStarting(mux::WebView2 const& webView, winrt::CoreWebView2NavigationStartingEventArgs const& /* args */) {
        m_reactContext.DispatchEvent(
            *this,
            L"topLoadingStart",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });


        if (m_messagingEnabled) {
            if (m_messageToken)
            {
                // In case the webview has a new navigation, we need to clean up the old WebMessageReceived handler
                webView.WebMessageReceived(m_messageToken);
            }
            m_messageToken = webView.WebMessageReceived([this](auto const& /* sender */ , winrt::CoreWebView2WebMessageReceivedEventArgs const& messageArgs)
                {
                    try {
                        auto message = messageArgs.TryGetWebMessageAsString();
                        this->OnMessagePosted(message);
                    }
                    catch (...) {
                        return;
                    }
                });
        }
    }

    void ReactWebView2::OnMessagePosted(hstring const& message)
    {
        HandleMessageFromJS(message);
    }

    void ReactWebView2::OnNavigationCompleted(mux::WebView2 const& webView, winrt::CoreWebView2NavigationCompletedEventArgs const& /* args */) {
        m_reactContext.DispatchEvent(
            *this,
            L"topLoadingFinish",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });

        if (m_messagingEnabled) {
            winrt::hstring message = LR"(window.alert = function (msg) {window.chrome.webview.postMessage(`{"type":"__alert","message":"${msg}"}`)};
                window.ReactNativeWebView = {postMessage: function (data) {window.chrome.webview.postMessage(String(data))}};
                const originalPostMessage = globalThis.postMessage;
                globalThis.postMessage = function (data) { originalPostMessage(data); globalThis.ReactNativeWebView.postMessage(typeof data == 'string' ? data : JSON.stringify(data));};)";
            webView.ExecuteScriptAsync(message);
        }
    }

    void ReactWebView2::OnCoreWebView2Initialized(mux::WebView2 const& sender, mux::CoreWebView2InitializedEventArgs const& /* args */) {
        assert(sender.CoreWebView2());

        RegisterCoreWebView2Events();

        if (m_navigateToHtml != L"") {
            m_webView.NavigateToString(m_navigateToHtml);
            m_navigateToHtml = L"";
        }
        if (!m_request.empty())
        {
            auto uriString = winrt::to_hstring(m_request.at("uri").AsString());
            sender.CoreWebView2().AddWebResourceRequestedFilter(
                uriString, winrt::CoreWebView2WebResourceContext::All);
        }
    }

    void ReactWebView2::OnCoreWebView2ResourceRequseted(
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
        winrt::CoreWebView2WebResourceRequestedEventArgs const& args)
    {
        assert(sender);
        if (!m_request.empty()) {
            auto uriString = winrt::to_hstring(m_request.at("uri").AsString());
            if (args.Request().Uri() == uriString) {
                SetupRequest(m_request, args.Request());
            }
        }
    }

    void ReactWebView2::OnCoreWebView2DOMContentLoaded(
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2DOMContentLoadedEventArgs const& /* args */)
    {
        m_reactContext.DispatchEvent(
            *this,
            L"topDOMContentLoaded",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept
            {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(m_webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });
        if (!m_injectedJavascript.empty())
        {
            sender.ExecuteScriptAsync(m_injectedJavascript);
        }
    }

    void ReactWebView2::OnCoreWebView2FrameNavigationStarted(
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& /* sender */,
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationStartingEventArgs const& /* args */)
    {
        m_reactContext.DispatchEvent(
            *this,
            L"topFrameNavigationStart",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept
            {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(m_webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });
    }

    void ReactWebView2::OnCoreWebView2FrameNavigationCompleted(
    winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& /* sender */,
    winrt::Microsoft::Web::WebView2::Core::CoreWebView2NavigationCompletedEventArgs const& /* args */)
    {
        m_reactContext.DispatchEvent(
            *this,
            L"topFrameNavigationFinish",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept
            {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(m_webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });
    }

    void ReactWebView2::OnCoreWebView2SourceChanged(
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& /* sender */,
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2SourceChangedEventArgs const& /* args */)
    {
        m_reactContext.DispatchEvent(
            *this,
            L"topSourceChanged",
            [&](winrt::IJSValueWriter const& eventDataWriter) noexcept
            {
                eventDataWriter.WriteObjectBegin();
                WriteWebViewNavigationEventArg(m_webView, eventDataWriter);
                eventDataWriter.WriteObjectEnd();
            });
    }

    void ReactWebView2::OnCoreWebView2NewWindowRequested(
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2 const& sender,
        winrt::Microsoft::Web::WebView2::Core::CoreWebView2NewWindowRequestedEventArgs const& args)
    {
        if (m_linkHandlingEnabled) {
            m_reactContext.DispatchEvent(
                *this,
                L"topOpenWindow",
                [&](winrt::IJSValueWriter const& eventDataWriter) noexcept
                {
                    eventDataWriter.WriteObjectBegin();
                    WriteProperty(eventDataWriter, L"targetUrl", args.Uri());
                    eventDataWriter.WriteObjectEnd();
                });
            args.Handled(true);
        } else {
            try
            {
                winrt::Windows::Foundation::Uri uri(args.Uri());
                winrt::Windows::System::Launcher::LaunchUriAsync(uri);
                args.Handled(true);
            }
            catch (winrt::hresult_error& e)
            {
                // Do Nothing
            }
        }
    }

    void ReactWebView2::HandleMessageFromJS(winrt::hstring const& message) {
        winrt::JsonObject jsonObject;
        if (winrt::JsonObject::TryParse(message, jsonObject) && jsonObject.HasKey(L"type"))
        {
            if (auto v = jsonObject.Lookup(L"type"); v && v.ValueType() == JsonValueType::String) {
                auto type = v.GetString();
                if (type == L"__alert") {
                    auto dialog = winrt::MessageDialog(jsonObject.GetNamedString(L"message"));
                    dialog.Commands().Append(winrt::UICommand(L"OK"));
                    dialog.ShowAsync();
                    return;
                }
            }
        }

        m_reactContext.DispatchEvent(
            *this,
            L"topMessage",
            [&](winrt::Microsoft::ReactNative::IJSValueWriter const& eventDataWriter) noexcept {
                eventDataWriter.WriteObjectBegin();
                WriteProperty(eventDataWriter, L"data", message);
                eventDataWriter.WriteObjectEnd();
            });
    }

    void ReactWebView2::MessagingEnabled(bool enabled) noexcept{
        m_messagingEnabled = enabled;
    }

    bool ReactWebView2::MessagingEnabled() const noexcept{
        return m_messagingEnabled;
    }

    void ReactWebView2::LinkHandlingEnabled(bool enabled) noexcept {
        m_linkHandlingEnabled = enabled;
    }

    bool ReactWebView2::LinkHandlingEnabled() const noexcept {
        return m_linkHandlingEnabled;
    }

    void ReactWebView2::WebResourceRequestSource(Microsoft::ReactNative::JSValueObject const& source) noexcept
    {
        m_request = std::move(source.Copy());
    }

    JSValueObject ReactWebView2::WebResourceRequestSource() const noexcept
    {
        return m_request.Copy();
    }

    void ReactWebView2::InjectedJavascript(winrt::hstring const& injectedJavascript) noexcept {
        m_injectedJavascript = injectedJavascript;
    }

    winrt::hstring ReactWebView2::InjectedJavascript() const noexcept
    {
        return m_injectedJavascript;
    }

    void ReactWebView2::NavigateToHtml(winrt::hstring const& html) {
        if (m_webView.CoreWebView2()) {
            m_webView.NavigateToString(html);
        }
        else {
            m_webView.EnsureCoreWebView2Async();
            m_navigateToHtml = html;
        }
    }

    winrt::fire_and_forget ReactWebView2::NavigateWithWebResourceRequest(Microsoft::ReactNative::IJSValueReader const& source)
    {
        m_request = JSValueObject::ReadFrom(source);
        co_await m_webView.EnsureCoreWebView2Async();
        assert(m_webView.CoreWebView2());
        if (m_webView.CoreWebView2())
        {
            auto uri = winrt::Uri(winrt::to_hstring(m_request.at("uri").AsString()));
            auto method = (m_request.find("method") != m_request.end()) ? m_request.at("method").AsString() : "GET";
            auto webResourceRequest = m_webView.CoreWebView2().Environment().CreateWebResourceRequest(
                uri.ToString(), winrt::to_hstring(method), nullptr, L"");

            SetupRequest(m_request.Copy(), webResourceRequest);

            m_webView.CoreWebView2().NavigateWithWebResourceRequest(webResourceRequest);
        }
    }

    void ReactWebView2::WriteCookiesToWebView2(std::string const& cookies) {
        // Persisting cookies passed from JS
        // Cookies are separated by ;, and adheres to the Set-Cookie HTTP header format of RFC-6265.

        auto cookieManager = m_webView.CoreWebView2().CookieManager();
        auto cookiesList = ReactWebViewHelpers::SplitString(cookies, ";,");
        for (const auto& cookie_str : cookiesList) {
            auto cookieData = ReactWebViewHelpers::ParseSetCookieHeader(ReactWebViewHelpers::TrimString(cookie_str));

            if (!cookieData.count("Name") || !cookieData.count("Value")) {
                continue;
            }

            auto cookie = cookieManager.CreateCookie(
                winrt::to_hstring(cookieData["Name"]),
                winrt::to_hstring(cookieData["Value"]),
                cookieData.count("Domain") ? winrt::to_hstring(cookieData["Domain"]) : L"",
                cookieData.count("Path") ? winrt::to_hstring(cookieData["Path"]) : L"");
            cookieManager.AddOrUpdateCookie(cookie);
        }
    }

    void ReactWebView2::SetupRequest(Microsoft::ReactNative::JSValueObject const& srcMap, winrt::Microsoft::Web::WebView2::Core::CoreWebView2WebResourceRequest const& request) {
        bool hasHeaders = srcMap.find("headers") != srcMap.end();
        auto method = srcMap.find("method") != srcMap.end() ? srcMap.at("method").AsString() : "GET";
        request.Method(winrt::to_hstring(method));
        if (method == "POST")
        {
            auto formBody = srcMap.at("body").AsString();
            winrt::InMemoryRandomAccessStream formContent;
            winrt::IBuffer buffer{winrt::CryptographicBuffer::ConvertStringToBinary(
                winrt::to_hstring(formBody), winrt::BinaryStringEncoding::Utf8)};
            formContent.ReadAsync(buffer, buffer.Length(), InputStreamOptions::None);
            request.Content(formContent);
        }
        if (hasHeaders)
        {
            for (auto const& header : srcMap.at("headers").AsObject())
            {
                auto const& headerKey = header.first;
                auto const& headerValue = header.second;
                if (headerValue.IsNull())
                    continue;
                if (headerKey == "Cookie") {
                    WriteCookiesToWebView2(headerValue.AsString());
                } else {
                    request.Headers().SetHeader(winrt::to_hstring(headerKey), winrt::to_hstring(headerValue.AsString()));
                }
            }
        }
    }
} // namespace winrt::ReactNativeWebView::implementation

#endif // HAS_WEBVIEW2
