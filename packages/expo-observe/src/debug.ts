// Debug-only API for test and debug apps. It reads the data that the library stores on the device.
export { useNetworkRequestObserver } from 'expo-app-metrics';
export type {
  CallStackFrame,
  CallStackTree,
  CrashReport,
  DebugSession,
  LogRecord,
  Metric,
  NetworkRequestCompletedEvent,
  NetworkRequestFilter,
  NetworkRequestObserver,
  NetworkRequestRedirect,
  NetworkRequestStartedEvent,
  Session,
  SessionType,
} from 'expo-app-metrics';
