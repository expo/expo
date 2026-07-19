#include "pch.h"
#include "ReactWebView2Manager.h"

#if HAS_WEBVIEW2
#include "NativeModules.h"
#include "ReactWebView2.h"
#include "JSValueXaml.h"

namespace mux {
    using namespace winrt::Microsoft::UI::Xaml::Controls;
}

namespace winrt {
    using namespace Microsoft::ReactNative;
    using namespace Windows::Foundation;
    using namespace Windows::Foundation::Collections;
    using namespace Windows::Web::Http;
    using namespace Windows::Web::Http::Headers;
    using namespace xaml;
    using namespace xaml::Controls;
    using namespace xaml::Input;
}

namespace winrt::ReactNativeWebView::implementation {

    ReactWebView2Manager::ReactWebView2Manager() {}

    // IViewManager
    winrt::hstring ReactWebView2Manager::Name() noexcept {
        return L"RCTWebView2";
    }

    winrt::FrameworkElement ReactWebView2Manager::CreateView() noexcept {
        auto view = winrt::ReactNativeWebView::ReactWebView2(m_reactContext);
        return view;
    }

    // IViewManagerWithReactContext
    winrt::IReactContext ReactWebView2Manager::ReactContext() noexcept {
        return m_reactContext;
    }

    void ReactWebView2Manager::ReactContext(IReactContext reactContext) noexcept {
        m_reactContext = reactContext;
    }

    // IViewManagerWithNativeProperties
    IMapView<hstring, ViewManagerPropertyType> ReactWebView2Manager::NativeProps() noexcept {
        auto nativeProps = winrt::single_threaded_map<hstring, ViewManagerPropertyType>();
        nativeProps.Insert(L"source", ViewManagerPropertyType::Map);
        nativeProps.Insert(L"messagingEnabled", ViewManagerPropertyType::Boolean);
        nativeProps.Insert(L"injectedJavaScript", ViewManagerPropertyType::String);
        nativeProps.Insert(L"linkHandlingEnabled", ViewManagerPropertyType::String);
        return nativeProps.GetView();
    }

    void ReactWebView2Manager::UpdateProperties(
        FrameworkElement const& view,
        IJSValueReader const& propertyMapReader) noexcept {
        auto control = view.as<winrt::ContentPresenter>();
        auto content = control.Content();
        auto webView = content.as<mux::WebView2>();
        const JSValueObject& propertyMap = JSValueObject::ReadFrom(propertyMapReader);

        for (auto const& pair : propertyMap) {
            auto const& propertyName = pair.first;
            auto const& propertyValue = pair.second;
            if (propertyValue.IsNull()) continue;

            if (propertyName == "source") {
                auto const& srcMap = propertyValue.AsObject();
                auto reactWebView2 = view.as<winrt::ReactNativeWebView::ReactWebView2>();
                std::string const fileScheme = "file://";
                if (srcMap.find("uri") != srcMap.end()) {
                    auto uriString = srcMap.at("uri").AsString();
                    if (uriString.length() == 0) {
                        continue;
                    }

                    bool isPackagerAsset = false;
                    if (srcMap.find("__packager_asset") != srcMap.end()) {
                        isPackagerAsset = srcMap.at("__packager_asset").AsBoolean();
                    }
                    if (isPackagerAsset && uriString.find(fileScheme) == 0) {
                        auto bundleRootPath = winrt::to_string(ReactNativeHost().InstanceSettings().BundleRootPath());
                        uriString.replace(0, std::size(fileScheme), bundleRootPath.empty() ? "ms-appx-web:///Bundle/" : bundleRootPath);
                    }
                    if (uriString.find("ms-appdata://") == 0 || uriString.find("ms-appx-web://") == 0) {
                        reactWebView2.NavigateToHtml(to_hstring(uriString));
                    } else {
                        reactWebView2.NavigateWithWebResourceRequest(MakeJSValueTreeReader(JSValue(srcMap.Copy())));
                    }
                }
                else if (srcMap.find("html") != srcMap.end()) {
                    auto htmlString = srcMap.at("html").AsString();
                    reactWebView2.NavigateToHtml(to_hstring(htmlString));
                }
            }
            else if (propertyName == "messagingEnabled") {
                auto messagingEnabled = propertyValue.To<bool>();
                auto reactWebView2 = view.as<ReactNativeWebView::ReactWebView2>();
                reactWebView2.MessagingEnabled(messagingEnabled);
            }
            else if (propertyName == "injectedJavaScript")
            {
                auto injectedJavascript = propertyValue.AsString();
                auto reactWebView2 = view.as<ReactNativeWebView::ReactWebView2>();
                reactWebView2.InjectedJavascript(to_hstring(injectedJavascript));
            }
            else if (propertyName == "linkHandlingEnabled") {
                auto linkHandlingEnabled = propertyValue.To<bool>();
                auto reactWebView2 = view.as<ReactNativeWebView::ReactWebView2>();
                reactWebView2.LinkHandlingEnabled(linkHandlingEnabled);
            }
        }
    }

    // IViewManagerWithExportedEventTypeConstants
    ConstantProviderDelegate ReactWebView2Manager::ExportedCustomBubblingEventTypeConstants() noexcept {
        return nullptr;
    }

    ConstantProviderDelegate ReactWebView2Manager::ExportedCustomDirectEventTypeConstants() noexcept {
        return [](winrt::IJSValueWriter const& constantWriter) {
            WriteCustomDirectEventTypeConstant(constantWriter, "DOMContentLoaded");
            WriteCustomDirectEventTypeConstant(constantWriter, "LoadingStart");
            WriteCustomDirectEventTypeConstant(constantWriter, "LoadingFinish");
            WriteCustomDirectEventTypeConstant(constantWriter, "LoadingError");
            WriteCustomDirectEventTypeConstant(constantWriter, "Message");
            WriteCustomDirectEventTypeConstant(constantWriter, "FrameNavigationStart");
            WriteCustomDirectEventTypeConstant(constantWriter, "FrameNavigationFinish");
            WriteCustomDirectEventTypeConstant(constantWriter, "OpenWindow");
            WriteCustomDirectEventTypeConstant(constantWriter, "SourceChanged");
        };
    }

    // IViewManagerWithCommands
    IVectorView<hstring> ReactWebView2Manager::Commands() noexcept {
        auto commands = winrt::single_threaded_vector<hstring>();
        commands.Append(L"goForward");
        commands.Append(L"goBack");
        commands.Append(L"reload");
        commands.Append(L"stopLoading");
        commands.Append(L"injectJavaScript");
        commands.Append(L"requestFocus");
        commands.Append(L"clearCache");
        commands.Append(L"postMessage");
        commands.Append(L"loadUrl");
        return commands.GetView();
    }

    void ReactWebView2Manager::DispatchCommand(
        FrameworkElement const& view,
        winrt::hstring const& commandId,
        winrt::IJSValueReader const& commandArgsReader) noexcept {
        auto control = view.as<winrt::ContentPresenter>();
        auto content = control.Content();
        auto webView = content.as<mux::WebView2>();
        auto commandArgs = JSValue::ReadArrayFrom(commandArgsReader);

        if (commandId == L"goForward") {
            if (webView.CanGoForward()) {
                webView.GoForward();
            }
        }
        else if (commandId == L"goBack") {
            if (webView.CanGoBack()) {
                webView.GoBack();
            }
        }
        else if (commandId == L"reload") {
            webView.Reload();
        }
        else if (commandId == L"stopLoading") {
            if (webView.CoreWebView2() != nullptr) {
                webView.CoreWebView2().Stop();
            }
        }
        else if (commandId == L"injectJavaScript") {
            webView.ExecuteScriptAsync(winrt::to_hstring(commandArgs[0].AsString()));
        }
        else if (commandId == L"requestFocus") {
            FocusManager::TryFocusAsync(webView, FocusState::Programmatic);
        }
        else if (commandId == L"clearCache") {
            // There is no way to clear the cache in WebView2 because it is shared with Edge.
            // The best we can do is clear the cookies, because we cannot access history or local storage.
            auto cookieManager = webView.CoreWebView2().CookieManager();
            cookieManager.DeleteAllCookies();
        }
        else if (commandId == L"loadUrl") {
            auto uri = winrt::Uri(to_hstring(commandArgs[0].AsString()));
            webView.Source(uri);
        }
        else if (commandId == L"postMessage") {
            if (webView.CoreWebView2() != nullptr) {
                auto message = commandArgs[0].AsString();
                webView.CoreWebView2().PostWebMessageAsString(to_hstring(message));
            }
        }
    }

} // namespace winrt::ReactNativeWebView::implementation

#endif // HAS_WEBVIEW2
