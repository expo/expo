/**
 * Bundle-derived facts pushed by the package entry point through `setBundleDefaults`.
 */
export type BundleDefaults = { environment: string; isJsDev: boolean };

/**
 * The EAS keys read from `expoConfig.extra`, which is untyped.
 */
export type EasExtra = { projectId?: string; observe?: { endpointUrl?: string } } | undefined;

/**
 * Outcome of one request to the logs endpoint, following the OTLP retry guidance.
 */
export type SendResult =
  | { kind: 'accepted' }
  | { kind: 'retry'; retryAfterMs: number | null }
  | { kind: 'rejected'; reason: string };

/**
 * OTLP `AnyValue`: an object with exactly one of the variant keys.
 */
export type OTAnyValue =
  | { stringValue: string }
  | { intValue: number }
  | { doubleValue: number }
  | { boolValue: boolean }
  | { arrayValue: { values: OTAnyValue[] } }
  | { kvlistValue: { values: OTKeyValue[] } };

export type OTKeyValue = { key: string; value: OTAnyValue };

export type OTLogRecord = {
  timeUnixNano: number;
  observedTimeUnixNano: number;
  severityNumber: number;
  severityText: string;
  body: { stringValue: string };
  attributes: OTKeyValue[];
  droppedAttributesCount?: number;
};

export type OTLogsRequestBody = {
  resourceLogs: {
    resource: { attributes: OTKeyValue[] };
    scopeLogs: { scope: { name: string; version: string }; logRecords: OTLogRecord[] }[];
    schemaUrl: string;
  }[];
};
