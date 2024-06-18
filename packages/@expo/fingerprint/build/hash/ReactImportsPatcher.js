"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchChunk = exports.ReactImportsPatchTransform = void 0;
const stream_1 = require("stream");
/**
 * A transform stream that patches React import statements in Objective-C files.
 */
class ReactImportsPatchTransform extends stream_1.Transform {
    readLength = 0;
    lengthOfFilePortionContainingHeadersToTransform;
    transformFn;
    static DEFAULT_LENGTH_OF_FILE_PORTION_CONTAINING_HEADERS_TO_TRANSFORM = 16 * 1024; // 16KB
    constructor(options) {
        super();
        this.lengthOfFilePortionContainingHeadersToTransform =
            options?.lengthOfFilePortionContainingHeadersToTransform ??
                ReactImportsPatchTransform.DEFAULT_LENGTH_OF_FILE_PORTION_CONTAINING_HEADERS_TO_TRANSFORM;
        this.transformFn = options?.transformFn ?? patchChunk;
    }
    _transform(chunk, _encoding, callback) {
        const remainingLength = this.lengthOfFilePortionContainingHeadersToTransform - this.readLength;
        let result;
        if (remainingLength <= 0) {
            result = chunk.toString();
        }
        else if (remainingLength >= chunk.length) {
            result = this.transformFn(chunk.toString());
        }
        else {
            const portionToTransform = chunk.slice(0, remainingLength).toString();
            const portionToLeave = chunk.slice(remainingLength).toString();
            result = this.transformFn(portionToTransform) + portionToLeave;
        }
        this.push(result);
        this.readLength += chunk.length;
        callback();
    }
}
exports.ReactImportsPatchTransform = ReactImportsPatchTransform;
/**
 * Patch imports from a data chunk
 * @param headerSet prebuilt React-Core header set
 * @param chunk target chunk data
 */
function patchChunk(chunk, headerSet = HEADER_SET) {
    let transformContent = chunk.replace(/(?<=^\s*)#import\s+"(.+)"(?=\s*$)/gm, (match, headerName) => {
        // `#import "RCTBridge.h"` -> `#import <React/RCTBridge.h>`
        if (headerSet.has(headerName)) {
            return `#import <React/${headerName}>`;
        }
        // `#import "React/RCTBridge.h"` -> `#import <React/RCTBridge.h>`
        if (headerName.startsWith('React/')) {
            const name = headerName.substring(6);
            if (headerSet.has(name)) {
                return `#import <React/${name}>`;
            }
        }
        // Otherwise, return original import
        return match;
    });
    transformContent = transformContent.replace(/(?<=^\s*)#(if|elif)\s+__has_include\("(.+)"\)(?=\s*$)/gm, (match, ifPrefix, headerName) => {
        // `#if __has_include("RCTBridge.h")` -> `#if __has_include(<React/RCTBridge.h>)`
        if (headerSet.has(headerName)) {
            return `#${ifPrefix} __has_include(<React/${headerName}>)`;
        }
        // `#if __has_include("React/RCTBridge.h")` -> `#if __has_include(<React/RCTBridge.h>)`
        if (headerName.startsWith('React/')) {
            const name = headerName.substring(6);
            if (headerSet.has(name)) {
                return `#${ifPrefix} __has_include(<React/${name}>)`;
            }
        }
        // Otherwise, return original import
        return match;
    });
    return transformContent;
}
exports.patchChunk = patchChunk;
// Fingerprint doesn't run `pod install` so we have a snapshot of the headers in the React-Core module from react-native 0.74.
const HEADER_SET = new Set([
    'CoreModulesPlugins.h',
    'FBXXHashUtils.h',
    'NSTextStorage+FontScaling.h',
    'RCTAccessibilityManager+Internal.h',
    'RCTAccessibilityManager.h',
    'RCTActionSheetManager.h',
    'RCTActivityIndicatorView.h',
    'RCTActivityIndicatorViewManager.h',
    'RCTAdditionAnimatedNode.h',
    'RCTAlertController.h',
    'RCTAlertManager.h',
    'RCTAnimatedImage.h',
    'RCTAnimatedNode.h',
    'RCTAnimationDriver.h',
    'RCTAnimationPlugins.h',
    'RCTAnimationType.h',
    'RCTAnimationUtils.h',
    'RCTAppState.h',
    'RCTAppearance.h',
    'RCTAssert.h',
    'RCTAutoInsetsProtocol.h',
    'RCTBackedTextInputDelegate.h',
    'RCTBackedTextInputDelegateAdapter.h',
    'RCTBackedTextInputViewProtocol.h',
    'RCTBaseTextInputShadowView.h',
    'RCTBaseTextInputView.h',
    'RCTBaseTextInputViewManager.h',
    'RCTBaseTextShadowView.h',
    'RCTBaseTextViewManager.h',
    'RCTBlobManager.h',
    'RCTBorderCurve.h',
    'RCTBorderDrawing.h',
    'RCTBorderStyle.h',
    'RCTBridge+Inspector.h',
    'RCTBridge+Private.h',
    'RCTBridge.h',
    'RCTBridgeConstants.h',
    'RCTBridgeDelegate.h',
    'RCTBridgeMethod.h',
    'RCTBridgeModule.h',
    'RCTBridgeModuleDecorator.h',
    'RCTBridgeProxy+Cxx.h',
    'RCTBridgeProxy.h',
    'RCTBundleAssetImageLoader.h',
    'RCTBundleManager.h',
    'RCTBundleURLProvider.h',
    'RCTClipboard.h',
    'RCTColorAnimatedNode.h',
    'RCTComponent.h',
    'RCTComponentData.h',
    'RCTComponentEvent.h',
    'RCTConstants.h',
    'RCTConvert+CoreLocation.h',
    'RCTConvert+Text.h',
    'RCTConvert+Transform.h',
    'RCTConvert.h',
    'RCTCursor.h',
    'RCTCxxConvert.h',
    'RCTDataRequestHandler.h',
    'RCTDebuggingOverlay.h',
    'RCTDebuggingOverlayManager.h',
    'RCTDecayAnimation.h',
    'RCTDefines.h',
    'RCTDevLoadingView.h',
    'RCTDevLoadingViewProtocol.h',
    'RCTDevLoadingViewSetEnabled.h',
    'RCTDevMenu.h',
    'RCTDevSettings.h',
    'RCTDeviceInfo.h',
    'RCTDiffClampAnimatedNode.h',
    'RCTDisplayLink.h',
    'RCTDisplayWeakRefreshable.h',
    'RCTDivisionAnimatedNode.h',
    'RCTDynamicTypeRamp.h',
    'RCTErrorCustomizer.h',
    'RCTErrorInfo.h',
    'RCTEventAnimation.h',
    'RCTEventDispatcher.h',
    'RCTEventDispatcherProtocol.h',
    'RCTEventEmitter.h',
    'RCTExceptionsManager.h',
    'RCTFPSGraph.h',
    'RCTFileReaderModule.h',
    'RCTFileRequestHandler.h',
    'RCTFont.h',
    'RCTFrameAnimation.h',
    'RCTFrameUpdate.h',
    'RCTGIFImageDecoder.h',
    'RCTHTTPRequestHandler.h',
    'RCTI18nManager.h',
    'RCTI18nUtil.h',
    'RCTImageBlurUtils.h',
    'RCTImageCache.h',
    'RCTImageDataDecoder.h',
    'RCTImageEditingManager.h',
    'RCTImageLoader.h',
    'RCTImageLoaderLoggable.h',
    'RCTImageLoaderProtocol.h',
    'RCTImageLoaderWithAttributionProtocol.h',
    'RCTImagePlugins.h',
    'RCTImageShadowView.h',
    'RCTImageSource.h',
    'RCTImageStoreManager.h',
    'RCTImageURLLoader.h',
    'RCTImageURLLoaderWithAttribution.h',
    'RCTImageUtils.h',
    'RCTImageView.h',
    'RCTImageViewManager.h',
    'RCTInitializing.h',
    'RCTInputAccessoryShadowView.h',
    'RCTInputAccessoryView.h',
    'RCTInputAccessoryViewContent.h',
    'RCTInputAccessoryViewManager.h',
    'RCTInspector.h',
    'RCTInspectorDevServerHelper.h',
    'RCTInspectorPackagerConnection.h',
    'RCTInterpolationAnimatedNode.h',
    'RCTInvalidating.h',
    'RCTJSStackFrame.h',
    'RCTJSThread.h',
    'RCTJavaScriptExecutor.h',
    'RCTJavaScriptLoader.h',
    'RCTKeyCommands.h',
    'RCTKeyboardObserver.h',
    'RCTLayout.h',
    'RCTLayoutAnimation.h',
    'RCTLayoutAnimationGroup.h',
    'RCTLinkingManager.h',
    'RCTLinkingPlugins.h',
    'RCTLocalAssetImageLoader.h',
    'RCTLocalizedString.h',
    'RCTLog.h',
    'RCTLogBox.h',
    'RCTLogBoxView.h',
    'RCTMacros.h',
    'RCTManagedPointer.h',
    'RCTMockDef.h',
    'RCTModalHostView.h',
    'RCTModalHostViewController.h',
    'RCTModalHostViewManager.h',
    'RCTModalManager.h',
    'RCTModuleData.h',
    'RCTModuleMethod.h',
    'RCTModuloAnimatedNode.h',
    'RCTMultilineTextInputView.h',
    'RCTMultilineTextInputViewManager.h',
    'RCTMultipartDataTask.h',
    'RCTMultipartStreamReader.h',
    'RCTMultiplicationAnimatedNode.h',
    'RCTNativeAnimatedModule.h',
    'RCTNativeAnimatedNodesManager.h',
    'RCTNativeAnimatedTurboModule.h',
    'RCTNetworkPlugins.h',
    'RCTNetworkTask.h',
    'RCTNetworking.h',
    'RCTNullability.h',
    'RCTObjectAnimatedNode.h',
    'RCTPLTag.h',
    'RCTPackagerClient.h',
    'RCTPackagerConnection.h',
    'RCTParserUtils.h',
    'RCTPerformanceLogger.h',
    'RCTPerformanceLoggerLabels.h',
    'RCTPlatform.h',
    'RCTPointerEvents.h',
    'RCTProfile.h',
    'RCTPropsAnimatedNode.h',
    'RCTRawTextShadowView.h',
    'RCTRawTextViewManager.h',
    'RCTReconnectingWebSocket.h',
    'RCTRedBox.h',
    'RCTRedBoxExtraDataViewController.h',
    'RCTRedBoxSetEnabled.h',
    'RCTRefreshControl.h',
    'RCTRefreshControlManager.h',
    'RCTRefreshableProtocol.h',
    'RCTReloadCommand.h',
    'RCTResizeMode.h',
    'RCTRootContentView.h',
    'RCTRootShadowView.h',
    'RCTRootView.h',
    'RCTRootViewDelegate.h',
    'RCTRootViewInternal.h',
    'RCTRuntimeExecutorModule.h',
    'RCTSafeAreaShadowView.h',
    'RCTSafeAreaView.h',
    'RCTSafeAreaViewLocalData.h',
    'RCTSafeAreaViewManager.h',
    'RCTScrollContentShadowView.h',
    'RCTScrollContentView.h',
    'RCTScrollContentViewManager.h',
    'RCTScrollEvent.h',
    'RCTScrollView.h',
    'RCTScrollViewManager.h',
    'RCTScrollableProtocol.h',
    'RCTSegmentedControl.h',
    'RCTSegmentedControlManager.h',
    'RCTSettingsManager.h',
    'RCTSettingsPlugins.h',
    'RCTShadowView+Internal.h',
    'RCTShadowView+Layout.h',
    'RCTShadowView.h',
    'RCTSinglelineTextInputView.h',
    'RCTSinglelineTextInputViewManager.h',
    'RCTSourceCode.h',
    'RCTSpringAnimation.h',
    'RCTStatusBarManager.h',
    'RCTStyleAnimatedNode.h',
    'RCTSubtractionAnimatedNode.h',
    'RCTSurface.h',
    'RCTSurfaceDelegate.h',
    'RCTSurfaceHostingProxyRootView.h',
    'RCTSurfaceHostingView.h',
    'RCTSurfacePresenterStub.h',
    'RCTSurfaceProtocol.h',
    'RCTSurfaceRootShadowView.h',
    'RCTSurfaceRootShadowViewDelegate.h',
    'RCTSurfaceRootView.h',
    'RCTSurfaceSizeMeasureMode.h',
    'RCTSurfaceStage.h',
    'RCTSurfaceView+Internal.h',
    'RCTSurfaceView.h',
    'RCTSwitch.h',
    'RCTSwitchManager.h',
    'RCTTextAttributes.h',
    'RCTTextDecorationLineType.h',
    'RCTTextSelection.h',
    'RCTTextShadowView.h',
    'RCTTextTransform.h',
    'RCTTextView.h',
    'RCTTextViewManager.h',
    'RCTTiming.h',
    'RCTTouchEvent.h',
    'RCTTouchHandler.h',
    'RCTTrackingAnimatedNode.h',
    'RCTTransformAnimatedNode.h',
    'RCTTurboModuleRegistry.h',
    'RCTUIImageViewAnimated.h',
    'RCTUIManager.h',
    'RCTUIManagerObserverCoordinator.h',
    'RCTUIManagerUtils.h',
    'RCTUITextField.h',
    'RCTUITextView.h',
    'RCTUIUtils.h',
    'RCTURLRequestDelegate.h',
    'RCTURLRequestHandler.h',
    'RCTUtils.h',
    'RCTUtilsUIOverride.h',
    'RCTValueAnimatedNode.h',
    'RCTVersion.h',
    'RCTVibration.h',
    'RCTVibrationPlugins.h',
    'RCTView.h',
    'RCTViewManager.h',
    'RCTViewUtils.h',
    'RCTVirtualTextShadowView.h',
    'RCTVirtualTextView.h',
    'RCTVirtualTextViewManager.h',
    'RCTWebSocketExecutor.h',
    'RCTWebSocketModule.h',
    'RCTWrapperViewController.h',
    'React-Core-umbrella.h',
    'React-Core.modulemap',
    'UIView+Private.h',
    'UIView+React.h',
]);
//# sourceMappingURL=ReactImportsPatcher.js.map