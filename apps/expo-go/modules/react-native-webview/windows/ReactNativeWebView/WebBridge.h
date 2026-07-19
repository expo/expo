#pragma once
#include "WebBridge.g.h"


namespace winrt::ReactNativeWebView::implementation
{
    struct WebBridge : WebBridgeT<WebBridge>
    {
        WebBridge() = default;

        void PostMessage(hstring const& message);
        winrt::event_token MessagePostEvent(Windows::Foundation::EventHandler<hstring> const& handler);
        void MessagePostEvent(winrt::event_token const& token) noexcept;

    private:
      winrt::event<Windows::Foundation::EventHandler<winrt::hstring>> m_messageEvent;
    };
}
namespace winrt::ReactNativeWebView::factory_implementation
{
    struct WebBridge : WebBridgeT<WebBridge, implementation::WebBridge>
    {
    };
}
