import type { LogRecord, LogSeverity } from 'expo-app-metrics';

// Bumping this signals that the attribute keys follow a newer revision of the OpenTelemetry
// semantic conventions; audit the keys used here and in `module.web.ts` against the SemConv
// changelog first.
const semConvSchemaUrl = 'https://opentelemetry.io/schemas/1.27.0';

// https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber
const severityNumbers: Record<LogSeverity, number> = {
  trace: 1,
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
  fatal: 21,
};

type OTAnyValue =
  | { stringValue: string }
  | { intValue: number }
  | { doubleValue: number }
  | { boolValue: boolean }
  | { arrayValue: { values: OTAnyValue[] } }
  | { kvlistValue: { values: OTKeyValue[] } };

type OTKeyValue = { key: string; value: OTAnyValue };

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

/**
 * Maps a JS attribute value onto the OTLP `AnyValue` shape, or `null` when JSON cannot carry it.
 * A list or map with any unrepresentable entry is dropped whole rather than shipped partially.
 */
function toAnyValue(value: unknown): OTAnyValue | null {
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'boolean') {
    return { boolValue: value };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Number.isInteger(value) ? { intValue: value } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    const values: OTAnyValue[] = [];
    for (const entry of value) {
      const mapped = toAnyValue(entry);
      if (mapped === null) {
        return null;
      }
      values.push(mapped);
    }
    return { arrayValue: { values } };
  }
  if (value !== null && typeof value === 'object') {
    const values: OTKeyValue[] = [];
    for (const [key, entry] of Object.entries(value)) {
      const mapped = toAnyValue(entry);
      if (mapped === null) {
        return null;
      }
      values.push({ key, value: mapped });
    }
    return { kvlistValue: { values } };
  }
  return null;
}

function stringAttributes(attributes: Record<string, string | undefined>): OTKeyValue[] {
  return Object.entries(attributes).flatMap(([key, value]) =>
    value == null ? [] : [{ key, value: { stringValue: value } }]
  );
}

// The product can exceed 2^53, so the lowest nanosecond digits round; the backend stores
// millisecond precision anyway.
function nanosecondsFromISOString(timestamp: string): number {
  const milliseconds = Date.parse(timestamp);
  return (Number.isNaN(milliseconds) ? Date.now() : milliseconds) * 1_000_000;
}

function toOTLogRecord(record: LogRecord, sessionId: string): OTLogRecord {
  const attributes: OTKeyValue[] = [
    { key: 'session.id', value: { stringValue: sessionId } },
    { key: 'event.name', value: { stringValue: record.name } },
  ];
  let droppedAttributesCount = 0;
  for (const [key, value] of Object.entries(record.attributes ?? {})) {
    const mapped = toAnyValue(value);
    if (mapped === null) {
      droppedAttributesCount++;
    } else {
      attributes.push({ key, value: mapped });
    }
  }
  const timeUnixNano = nanosecondsFromISOString(record.timestamp);
  return {
    timeUnixNano,
    observedTimeUnixNano: timeUnixNano,
    severityNumber: severityNumbers[record.severity],
    severityText: record.severity.toUpperCase(),
    body: { stringValue: record.body ?? '' },
    attributes,
    ...(droppedAttributesCount > 0 ? { droppedAttributesCount } : {}),
  };
}

/**
 * Builds the OTLP/JSON body for the `/v1/logs` endpoint, in the same shape the native dispatchers
 * send. Resource attributes with an `undefined` value are left out.
 */
export function buildLogsRequestBody(args: {
  sessionId: string;
  sdkVersion: string;
  resourceAttributes: Record<string, string | undefined>;
  logs: LogRecord[];
}): OTLogsRequestBody {
  return {
    resourceLogs: [
      {
        resource: { attributes: stringAttributes(args.resourceAttributes) },
        scopeLogs: [
          {
            scope: { name: 'expo-observe', version: args.sdkVersion },
            logRecords: args.logs.map((record) => toOTLogRecord(record, args.sessionId)),
          },
        ],
        schemaUrl: semConvSchemaUrl,
      },
    ],
  };
}
