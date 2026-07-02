import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

// Each trigger captures a different built-in (or custom) error type so the recorded `exception`
// event carries a distinct `exception.type`. Some are reported non-fatally (recorded into the
// current session right away) and some are thrown uncaught (fatal in dev -> on-disk pending store,
// ingested on the next launch); see `ERROR_KINDS` for which is which.
//
// The named nested functions give the captured stacktrace several distinct, recognizable frames.

// MARK: - Builders, one per error type, each failing a few named frames deep

function buildPlainError(): Error {
  function inner(): never {
    throw new Error('Plain Error thrown a few frames down');
  }
  function middle() {
    return inner();
  }
  return captured(middle);
}

function buildTypeError(): Error {
  type Config = { server?: { endpoints?: { metrics?: string } } };
  function resolveEndpoint(config: Config): string {
    // `endpoints` is undefined, so reading `.metrics` throws a real engine `TypeError`.
    return config.server!.endpoints!.metrics!.toUpperCase();
  }
  function readMetricsEndpoint(config: Config) {
    return resolveEndpoint(config);
  }
  return captured(() => readMetricsEndpoint({ server: {} }));
}

function buildRangeError(): Error {
  function allocate(size: number): unknown[] {
    // A negative length is a `RangeError` straight from the engine.
    return new Array(size);
  }
  function reserveBuffer(count: number) {
    return allocate(count);
  }
  return captured(() => reserveBuffer(-1));
}

function buildReferenceError(): Error {
  function readUndeclared(): number {
    // @ts-expect-error referencing an undeclared binding throws a `ReferenceError` at runtime.
    return missingBinding + 1;
  }
  function compute() {
    return readUndeclared();
  }
  return captured(compute);
}

function buildSyntaxError(): Error {
  function parsePayload(raw: string): unknown {
    // Malformed JSON is the most common real-world `SyntaxError`.
    return JSON.parse(raw);
  }
  function loadConfig() {
    return parsePayload('{ "endpoint": }');
  }
  return captured(loadConfig);
}

class SchemaMigrationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    // Without setting `name`, the captured `exception.type` would be the generic `Error`.
    this.name = 'SchemaMigrationError';
  }
}

function buildCustomError(): Error {
  function openDatabase(): never {
    throw new Error('SQLITE_CANTOPEN: unable to open database file');
  }
  function migrateSchema(): never {
    try {
      openDatabase();
    } catch (cause) {
      // Custom subclass + a wrapped `cause`, to verify the custom `name` survives to `exception.type`.
      throw new SchemaMigrationError('Schema migration failed', { cause });
    }
  }
  return captured(migrateSchema);
}

// Runs `produce` (which is expected to throw) and returns the thrown error so a trigger can either
// hand it to the global handler live or re-throw it uncaught. Falls back to a generic error if the
// builder somehow doesn't throw, so a trigger always has something to report.
function captured(produce: () => unknown): Error {
  try {
    produce();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  return new Error('Expected an error but none was thrown');
}

type ErrorKind = {
  key: string;
  title: string;
  build: () => Error;
  // Fatal triggers throw uncaught (the global handler flags them fatal in dev, so they go to the
  // on-disk pending store and surface on the next launch). Non-fatal triggers report into the
  // current session immediately.
  fatal: boolean;
};

const ERROR_KINDS: ErrorKind[] = [
  { key: 'type', title: 'TypeError', build: buildTypeError, fatal: false },
  { key: 'range', title: 'RangeError', build: buildRangeError, fatal: false },
  { key: 'syntax', title: 'SyntaxError', build: buildSyntaxError, fatal: false },
  { key: 'error', title: 'Error', build: buildPlainError, fatal: true },
  { key: 'reference', title: 'ReferenceError', build: buildReferenceError, fatal: true },
  { key: 'custom', title: 'Custom error (cause)', build: buildCustomError, fatal: true },
];

// `ErrorUtils.reportError` exists at runtime (it's how non-fatal errors are surfaced, e.g. from
// React error boundaries) but isn't in the public type, so reach it through a typed view.
const errorUtils = ErrorUtils as typeof ErrorUtils & { reportError: (error: unknown) => void };

// Reports the error as non-fatal, the same call real code uses, so it records into the current
// session right away and keeps its real `exception.type`.
function reportNonFatal(build: () => Error) {
  errorUtils.reportError(build());
}

// Throws from a timer so the error is genuinely uncaught (fatal in dev -> pending store).
function throwFatal(build: () => Error) {
  const error = build();
  setTimeout(() => {
    throw error;
  }, 0);
}

export function JSErrorsSection() {
  const theme = useTheme();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>JavaScript errors</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Capture different error types and inspect their stacktraces. Non-fatal errors record into
        the current session right away; fatal ones (⚠️) throw uncaught (RedBox in dev) and surface
        on the next launch in the prior session.
      </Text>
      {ERROR_KINDS.map(({ key, title, build, fatal }) => (
        <Button
          key={key}
          title={fatal ? `${title}  ⚠️ fatal` : title}
          description={
            fatal
              ? 'Uncaught throw, fatal in dev (next launch)'
              : 'Non-fatal, records into the current session'
          }
          onPress={() => (fatal ? throwFatal(build) : reportNonFatal(build))}
          theme="secondary"
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
});
