import type { LogAttributeValue, LogRecord, LogSeverity } from 'expo-app-metrics';

// TypeScript port of the OTLP JSON encoding in `ios/OpenTelemetry.swift`, limited to
// what web dispatch needs (logs only).

export type OTAnyValue =
  | { stringValue: string }
  | { boolValue: boolean }
  | { intValue: string }
  | { doubleValue: number }
  | { arrayValue: { values: OTAnyValue[] } }
  | { kvlistValue: { values: { key: string; value: OTAnyValue }[] } };

export type OTAttribute = {
  key: string;
  value: OTAnyValue;
};

export type OTLogRecord = {
  timeUnixNano: string;
  observedTimeUnixNano: string;
  severityNumber: number;
  severityText: string;
  body: { stringValue: string };
  attributes: OTAttribute[];
  droppedAttributesCount?: number;
};

export type OTLogsRequestBody = {
  resourceLogs: {
    resource: { attributes: OTAttribute[] };
    scopeLogs: {
      scope: { name: string };
      logRecords: OTLogRecord[];
    }[];
    schemaUrl: string;
  }[];
};

/**
 * OpenTelemetry Semantic Conventions schema URL referenced by the resource on every
 * dispatched payload. Keep in sync with `semConvSchemaUrl` in `ios/OpenTelemetry.swift`.
 */
const SEM_CONV_SCHEMA_URL = 'https://opentelemetry.io/schemas/1.27.0';

const SEVERITY_NUMBER: Record<LogSeverity, number> = {
  trace: 1,
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
  fatal: 21,
};

/**
 * Converts an arbitrary attribute value into an `OTAnyValue`, or `null` for values
 * OTLP JSON cannot represent (non-finite numbers, or containers holding one) —
 * callers should treat these as dropped attributes, mirroring native.
 */
export function toAnyValue(value: LogAttributeValue): OTAnyValue | null {
  switch (typeof value) {
    case 'string':
      return { stringValue: value };
    case 'boolean':
      return { boolValue: value };
    case 'number':
      if (!Number.isFinite(value)) {
        return null;
      }
      // int64 is encoded as a string per the protobuf JSON mapping, which also keeps
      // integers beyond 2^53 exact — unlike the JSON number Swift emits.
      return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value };
    case 'object': {
      if (value === null) {
        return null;
      }
      if (Array.isArray(value)) {
        const values: OTAnyValue[] = [];
        for (const element of value) {
          const mapped = toAnyValue(element);
          if (mapped === null) {
            // One or more elements were unrepresentable — drop the whole array rather
            // than silently shipping a partial list.
            return null;
          }
          values.push(mapped);
        }
        return { arrayValue: { values } };
      }
      const values: { key: string; value: OTAnyValue }[] = [];
      for (const [key, element] of Object.entries(value)) {
        const mapped = toAnyValue(element);
        if (mapped === null) {
          return null;
        }
        values.push({ key, value: mapped });
      }
      return { kvlistValue: { values } };
    }
    default:
      return null;
  }
}

function toLogRecord(record: LogRecord, sessionId: string): OTLogRecord {
  const attributes: OTAttribute[] = [
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

  const milliseconds = Date.parse(record.timestamp);
  // Nanoseconds exceed 2^53, so build the value by string concatenation — `ms * 1e6`
  // as a JS number would lose precision.
  const timeUnixNano = `${Number.isFinite(milliseconds) ? milliseconds : Date.now()}000000`;
  return {
    timeUnixNano,
    observedTimeUnixNano: timeUnixNano,
    severityNumber: SEVERITY_NUMBER[record.severity],
    severityText: record.severity.toUpperCase(),
    body: { stringValue: record.body ?? '' },
    attributes,
    ...(droppedAttributesCount > 0 ? { droppedAttributesCount } : null),
  };
}

/**
 * Builds the request body for `POST /{projectId}/v1/logs` from the given records,
 * which on web all belong to the single page-load session.
 */
export function toLogsRequest(
  records: LogRecord[],
  sessionId: string,
  resourceAttributes: OTAttribute[]
): OTLogsRequestBody {
  return {
    resourceLogs: [
      {
        resource: { attributes: resourceAttributes },
        scopeLogs: [
          {
            // ponytail: scope version omitted — native injects the package version at
            // build time; wire it through here if the backend starts keying on it.
            scope: { name: 'expo-observe' },
            logRecords: records.map((record) => toLogRecord(record, sessionId)),
          },
        ],
        schemaUrl: SEM_CONV_SCHEMA_URL,
      },
    ],
  };
}
