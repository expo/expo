import { EmitterSubscription } from 'react-native';
import { Anchor } from '../commons';
export declare enum EventType {
    FrameDidUpdate,
    DidFailWithError,
    AnchorsDidUpdate,
    CameraDidChangeTrackingState,
    SessionWasInterrupted,
    SessionInterruptionEnded
}
export declare function onFrameDidUpdate(listener: (event: {}) => void): EmitterSubscription;
export declare function onDidFailWithError(listener: (event: {
    error: Error;
}) => void): EmitterSubscription;
export declare enum AnchorEventType {
    Add = "add",
    Update = "update",
    Remove = "remove"
}
export declare function onAnchorsDidUpdate(listener: (event: {
    eventType: AnchorEventType;
    anchors: Anchor[];
}) => void): EmitterSubscription;
export declare enum TrackingState {
    /** Tracking is not available. */
    NotAvailable = "ARTrackingStateNotAvailable",
    /** Tracking is limited. See tracking reason for details. */
    Limited = "ARTrackingStateLimited",
    /** Tracking is Normal. */
    Normal = "ARTrackingStateNormal"
}
export declare enum TrackingStateReason {
    /** Tracking is not limited. */
    None = "ARTrackingStateReasonNone",
    /** Tracking is limited due to initialization in progress. */
    Initializing = "ARTrackingStateReasonInitializing",
    /** Tracking is limited due to a excessive motion of the camera. */
    ExcessiveMotion = "ARTrackingStateReasonExcessiveMotion",
    /** Tracking is limited due to a lack of features visible to the camera. */
    InsufficientFeatures = "ARTrackingStateReasonInsufficientFeatures",
    /** Tracking is limited due to a relocalization in progress. */
    Relocalizing = "ARTrackingStateReasonRelocalizing"
}
export declare function onCameraDidChangeTrackingState(listener: (event: {
    trackingState: TrackingState;
    trackingStateReason: TrackingStateReason;
}) => void): EmitterSubscription;
export declare function onSessionWasInterrupted(listener: (event: {}) => void): EmitterSubscription;
export declare function onSessionInterruptionEnded(listener: (event: {}) => void): EmitterSubscription;
export declare function removeAllListeners(eventType?: EventType): void;
