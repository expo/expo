import type { LogRecord, LogSeverity } from 'expo-app-metrics';

import { toAnyValue, toLogsRequest } from '../web/otlp';

function makeRecord(overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    timestamp: '2025-01-01T00:00:00.000Z',
    name: 'checkout',
    severity: 'info',
    ...overrides,
  };
}

describe(toAnyValue, () => {
  it('encodes primitives as single-key OTLP objects', () => {
    expect(toAnyValue('a')).toEqual({ stringValue: 'a' });
    expect(toAnyValue(true)).toEqual({ boolValue: true });
    expect(toAnyValue(2)).toEqual({ intValue: '2' });
    expect(toAnyValue(-7)).toEqual({ intValue: '-7' });
    expect(toAnyValue(1.5)).toEqual({ doubleValue: 1.5 });
  });

  it('encodes arrays and nested maps', () => {
    expect(toAnyValue(['a', 1])).toEqual({
      arrayValue: { values: [{ stringValue: 'a' }, { intValue: '1' }] },
    });
    expect(toAnyValue({ inner: { deep: true } })).toEqual({
      kvlistValue: {
        values: [{ key: 'inner', value: { kvlistValue: { values: [{ key: 'deep', value: { boolValue: true } }] } } }],
      },
    });
  });

  it('drops non-finite numbers and containers holding unrepresentable values', () => {
    expect(toAnyValue(NaN)).toBeNull();
    expect(toAnyValue(Infinity)).toBeNull();
    expect(toAnyValue(['ok', NaN])).toBeNull();
    expect(toAnyValue({ ok: 'yes', bad: NaN })).toBeNull();
  });
});

describe(toLogsRequest, () => {
  it('builds the OTLP envelope', () => {
    const resource = [{ key: 'telemetry.sdk.name', value: { stringValue: 'expo-observe' } }];
    const request = toLogsRequest([makeRecord()], 'session-1', resource);
    expect(request).toEqual({
      resourceLogs: [
        {
          resource: { attributes: resource },
          scopeLogs: [
            {
              scope: { name: 'expo-observe' },
              logRecords: [
                {
                  timeUnixNano: '1735689600000000000',
                  observedTimeUnixNano: '1735689600000000000',
                  severityNumber: 9,
                  severityText: 'INFO',
                  body: { stringValue: '' },
                  attributes: [
                    { key: 'session.id', value: { stringValue: 'session-1' } },
                    { key: 'event.name', value: { stringValue: 'checkout' } },
                  ],
                },
              ],
            },
          ],
          schemaUrl: 'https://opentelemetry.io/schemas/1.27.0',
        },
      ],
    });
  });

  it('maps every severity to its OTel number and uppercase text', () => {
    const expected: Record<LogSeverity, number> = {
      trace: 1,
      debug: 5,
      info: 9,
      warn: 13,
      error: 17,
      fatal: 21,
    };
    for (const [severity, severityNumber] of Object.entries(expected)) {
      const request = toLogsRequest([makeRecord({ severity: severity as LogSeverity })], 's', []);
      const logRecord = request.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
      expect(logRecord.severityNumber).toBe(severityNumber);
      expect(logRecord.severityText).toBe(severity.toUpperCase());
    }
  });

  it('encodes body and user attributes after the SDK-set attributes', () => {
    const request = toLogsRequest(
      [makeRecord({ body: 'card declined', attributes: { sku: 'abc', retries: 2 } })],
      's',
      []
    );
    const logRecord = request.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
    expect(logRecord.body).toEqual({ stringValue: 'card declined' });
    expect(logRecord.attributes).toEqual([
      { key: 'session.id', value: { stringValue: 's' } },
      { key: 'event.name', value: { stringValue: 'checkout' } },
      { key: 'sku', value: { stringValue: 'abc' } },
      { key: 'retries', value: { intValue: '2' } },
    ]);
  });

  it('counts attributes dropped at encode time', () => {
    const request = toLogsRequest(
      [makeRecord({ attributes: { kept: 'yes', bad: NaN, worse: Infinity } })],
      's',
      []
    );
    const logRecord = request.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
    expect(logRecord.attributes).toHaveLength(3); // session.id, event.name, kept
    expect(logRecord.droppedAttributesCount).toBe(2);
  });

  it('omits droppedAttributesCount when nothing was dropped', () => {
    const request = toLogsRequest([makeRecord()], 's', []);
    expect(request.resourceLogs[0]!.scopeLogs[0]!.logRecords[0]).not.toHaveProperty(
      'droppedAttributesCount'
    );
  });
});
