import { NativeAR, NativeAREventEmitter } from '../NativeAR';
export var EventType;
(function (EventType) {
    EventType[EventType["FrameDidUpdate"] = NativeAR.frameDidUpdate] = "FrameDidUpdate";
    EventType[EventType["DidFailWithError"] = NativeAR.didFailWithError] = "DidFailWithError";
    EventType[EventType["AnchorsDidUpdate"] = NativeAR.anchorsDidUpdate] = "AnchorsDidUpdate";
    EventType[EventType["CameraDidChangeTrackingState"] = NativeAR.cameraDidChangeTrackingState] = "CameraDidChangeTrackingState";
    EventType[EventType["SessionWasInterrupted"] = NativeAR.sessionWasInterrupted] = "SessionWasInterrupted";
    EventType[EventType["SessionInterruptionEnded"] = NativeAR.sessionInterruptionEnded] = "SessionInterruptionEnded";
})(EventType || (EventType = {}));
export function onFrameDidUpdate(listener) {
    return addListener(EventType.FrameDidUpdate, listener);
}
export function onDidFailWithError(listener) {
    return addListener(EventType.DidFailWithError, listener);
}
export var AnchorEventType;
(function (AnchorEventType) {
    AnchorEventType["Add"] = "add";
    AnchorEventType["Update"] = "update";
    AnchorEventType["Remove"] = "remove";
})(AnchorEventType || (AnchorEventType = {}));
export function onAnchorsDidUpdate(listener) {
    return addListener(EventType.AnchorsDidUpdate, listener);
}
export var TrackingState;
(function (TrackingState) {
    /** Tracking is not available. */
    TrackingState["NotAvailable"] = "ARTrackingStateNotAvailable";
    /** Tracking is limited. See tracking reason for details. */
    TrackingState["Limited"] = "ARTrackingStateLimited";
    /** Tracking is Normal. */
    TrackingState["Normal"] = "ARTrackingStateNormal";
})(TrackingState || (TrackingState = {}));
export var TrackingStateReason;
(function (TrackingStateReason) {
    /** Tracking is not limited. */
    TrackingStateReason["None"] = "ARTrackingStateReasonNone";
    /** Tracking is limited due to initialization in progress. */
    TrackingStateReason["Initializing"] = "ARTrackingStateReasonInitializing";
    /** Tracking is limited due to a excessive motion of the camera. */
    TrackingStateReason["ExcessiveMotion"] = "ARTrackingStateReasonExcessiveMotion";
    /** Tracking is limited due to a lack of features visible to the camera. */
    TrackingStateReason["InsufficientFeatures"] = "ARTrackingStateReasonInsufficientFeatures";
    /** Tracking is limited due to a relocalization in progress. */
    TrackingStateReason["Relocalizing"] = "ARTrackingStateReasonRelocalizing";
})(TrackingStateReason || (TrackingStateReason = {}));
export function onCameraDidChangeTrackingState(listener) {
    return addListener(EventType.CameraDidChangeTrackingState, listener);
}
export function onSessionWasInterrupted(listener) {
    return addListener(EventType.SessionWasInterrupted, listener);
}
export function onSessionInterruptionEnded(listener) {
    return addListener(EventType.SessionInterruptionEnded, listener);
}
function addListener(eventType, event) {
    return NativeAREventEmitter.addListener(eventType, event);
}
export function removeAllListeners(eventType) {
    NativeAREventEmitter.removeAllListeners(eventType);
}
//# sourceMappingURL=events.js.map