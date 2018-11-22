import { EmitterSubscription } from 'react-native';

import { NativeAR, NativeAREventEmitter } from '../NativeAR';
import { Anchor } from '../commons';

export enum EventType {
  FrameDidUpdate = NativeAR.frameDidUpdate,
  DidFailWithError = NativeAR.didFailWithError,
  AnchorsDidUpdate = NativeAR.anchorsDidUpdate,
  CameraDidChangeTrackingState = NativeAR.cameraDidChangeTrackingState,
  SessionWasInterrupted = NativeAR.sessionWasInterrupted,
  SessionInterruptionEnded = NativeAR.sessionInterruptionEnded,
}

export function onFrameDidUpdate(listener: (event: {}) => void): EmitterSubscription {
  return addListener(EventType.FrameDidUpdate, listener);
}

export function onDidFailWithError(listener: (event: { error: Error }) => void): EmitterSubscription {
  return addListener(EventType.DidFailWithError, listener);
}

export enum AnchorEventType {
  Add = 'add',
  Update = 'update',
  Remove = 'remove',
}

export function onAnchorsDidUpdate(listener: (event: { eventType: AnchorEventType; anchors: Anchor[] }) => void): EmitterSubscription {
  return addListener(EventType.AnchorsDidUpdate, listener);
}

export enum TrackingState {
  /** Tracking is not available. */
  NotAvailable = 'ARTrackingStateNotAvailable',
  /** Tracking is limited. See tracking reason for details. */
  Limited = 'ARTrackingStateLimited',
  /** Tracking is Normal. */
  Normal = 'ARTrackingStateNormal',
}

export enum TrackingStateReason {
  /** Tracking is not limited. */
  None = 'ARTrackingStateReasonNone',

  /** Tracking is limited due to initialization in progress. */
  Initializing = 'ARTrackingStateReasonInitializing',

  /** Tracking is limited due to a excessive motion of the camera. */
  ExcessiveMotion = 'ARTrackingStateReasonExcessiveMotion',

  /** Tracking is limited due to a lack of features visible to the camera. */
  InsufficientFeatures = 'ARTrackingStateReasonInsufficientFeatures',

  /** Tracking is limited due to a relocalization in progress. */
  Relocalizing = 'ARTrackingStateReasonRelocalizing',
}

export function onCameraDidChangeTrackingState(listener: (event: { trackingState: TrackingState, trackingStateReason: TrackingStateReason }) => void): EmitterSubscription {
  return addListener(EventType.CameraDidChangeTrackingState, listener);
}

export function onSessionWasInterrupted(listener: (event: {}) => void): EmitterSubscription {
  return addListener(EventType.SessionWasInterrupted, listener);
}

export function onSessionInterruptionEnded(listener: (event: {}) => void): EmitterSubscription {
  return addListener(EventType.SessionInterruptionEnded, listener);
}

function addListener(eventType: EventType, event: (...args: any[]) => void): EmitterSubscription {
  return NativeAREventEmitter.addListener(eventType as any, event);
}

export function removeAllListeners(eventType?: EventType): void {
  NativeAREventEmitter.removeAllListeners(eventType as any);
}
