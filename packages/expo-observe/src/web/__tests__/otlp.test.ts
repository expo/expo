import type { LogRecord } from 'expo-app-metrics';

import { buildLogsRequestBody } from '../otlp';

const record: LogRecord = {
  timestamp: '2026-09-18T10:00:00.250Z',
  name: 'checkout_started',
  body: 'Cart had 3 items',
  attributes: { items: 3 },
  severity: 'warn',
};

function build(logs: LogRecord[], resourceAttributes: Record<string, string | undefined> = {}) {
  return buildLogsRequestBody({
    sessionId: 'session-1',
    sdkVersion: '58.0.5',
    resourceAttributes,
    logs,
  });
}

function firstLogRecord(logs: LogRecord[]) {
  return build(logs).resourceLogs[0]!.scopeLogs[0]!.logRecords[0]!;
}

describe('buildLogsRequestBody', () => {
  it('wraps the records in one resource and one expo-observe scope', () => {
    const body = build([record], { 'service.name': 'my-app', 'service.version': undefined });

    expect(body).toEqual({
      resourceLogs: [
        {
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'my-app' } }],
          },
          scopeLogs: [
            {
              scope: { name: 'expo-observe', version: '58.0.5' },
              logRecords: [
                {
                  timeUnixNano: Date.parse(record.timestamp) * 1_000_000,
                  observedTimeUnixNano: Date.parse(record.timestamp) * 1_000_000,
                  severityNumber: 13,
                  severityText: 'WARN',
                  body: { stringValue: 'Cart had 3 items' },
                  attributes: [
                    { key: 'session.id', value: { stringValue: 'session-1' } },
                    { key: 'event.name', value: { stringValue: 'checkout_started' } },
                    { key: 'items', value: { intValue: 3 } },
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

  it.each([
    ['trace', 1],
    ['debug', 5],
    ['info', 9],
    ['warn', 13],
    ['error', 17],
    ['fatal', 21],
  ] as const)('maps %s to OpenTelemetry severity number %i', (severity, severityNumber) => {
    const otRecord = firstLogRecord([{ ...record, severity }]);
    expect(otRecord.severityNumber).toBe(severityNumber);
    expect(otRecord.severityText).toBe(severity.toUpperCase());
  });

  it('sends an empty body when the record has none', () => {
    expect(firstLogRecord([{ ...record, body: null }]).body).toEqual({ stringValue: '' });
    expect(firstLogRecord([{ ...record, body: undefined }]).body).toEqual({ stringValue: '' });
  });

  it('types attribute values like the native encoder', () => {
    const otRecord = firstLogRecord([
      {
        ...record,
        attributes: {
          text: 'a',
          whole: 2,
          fraction: 2.5,
          flag: true,
          list: ['x', 1],
          nested: { inner: false },
        },
      },
    ]);

    expect(otRecord.attributes.slice(2)).toEqual([
      { key: 'text', value: { stringValue: 'a' } },
      { key: 'whole', value: { intValue: 2 } },
      { key: 'fraction', value: { doubleValue: 2.5 } },
      { key: 'flag', value: { boolValue: true } },
      { key: 'list', value: { arrayValue: { values: [{ stringValue: 'x' }, { intValue: 1 }] } } },
      {
        key: 'nested',
        value: { kvlistValue: { values: [{ key: 'inner', value: { boolValue: false } }] } },
      },
    ]);
    expect(otRecord.droppedAttributesCount).toBeUndefined();
  });

  it('drops values JSON cannot carry and reports them as dropped attributes', () => {
    const otRecord = firstLogRecord([
      {
        ...record,
        attributes: {
          kept: 'a',
          notANumber: Number.NaN,
          listWithInfinity: [1, Number.POSITIVE_INFINITY],
          nestedWithInfinity: { inner: Number.NEGATIVE_INFINITY },
        },
      },
    ]);

    expect(otRecord.attributes.slice(2)).toEqual([{ key: 'kept', value: { stringValue: 'a' } }]);
    expect(otRecord.droppedAttributesCount).toBe(3);
  });

  it('falls back to the current time for an unparsable timestamp', () => {
    const before = Date.now() * 1_000_000;
    const otRecord = firstLogRecord([{ ...record, timestamp: 'not-a-date' }]);
    const after = Date.now() * 1_000_000;

    expect(otRecord.timeUnixNano).toBeGreaterThanOrEqual(before);
    expect(otRecord.timeUnixNano).toBeLessThanOrEqual(after);
  });
});
