#include "pch.h"
#include "WebBridge.h"
#include "WebBridge.g.cpp"

namespace winrt::ReactNativeWebView::implementation
{
    void WebBridge::PostMessage(hstring const& message)
    {
        m_messageEvent(*this, message);
    }
    winrt::event_token WebBridge::MessagePostEvent(Windows::Foundation::EventHandler<hstring> const& handler)
    {
        return m_messageEvent.add(handler);
    }
    void WebBridge::MessagePostEvent(winrt::event_token const& token) noexcept
    {
        m_messageEvent.remove(token);
    }
}
