import type {
  configureReanimatedLogger,
  LogData,
  LoggerConfig,
  reanimatedVersion,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import type { ObserveReanimatedIntegrationConfig } from '../../../types';
import type { LoadedReanimated, ReanimatedLogData } from '../reanimated';

// `reanimated.ts` declares its own types for the Reanimated API so that Reanimated stays an
// optional peer dependency. These checks fail to compile if Reanimated's types diverge from them.

type Expect<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

type ReanimatedOnLog = NonNullable<Parameters<typeof configureReanimatedLogger>[1]>;
type OurConfigureLogger = LoadedReanimated['configureReanimatedLogger'];
type OurConfig = Parameters<OurConfigureLogger>[0];
type OurOnLog = NonNullable<Parameters<OurConfigureLogger>[1]>;

export type _VersionFitsOurs = Expect<
  Extends<typeof reanimatedVersion, LoadedReanimated['version']>
>;
export type _ReanimatedLogDataFitsOurs = Expect<Extends<LogData, ReanimatedLogData>>;
export type _OurOnLogFitsReanimated = Expect<Extends<OurOnLog, ReanimatedOnLog>>;
export type _OurConfigFitsReanimated = Expect<Extends<OurConfig, LoggerConfig>>;
export type _IntegrationConfigFitsReanimated = Expect<
  Extends<ObserveReanimatedIntegrationConfig, LoggerConfig>
>;
export type _ConfigureLoggerFitsOurs = Expect<
  Extends<typeof configureReanimatedLogger, OurConfigureLogger>
>;
export type _LogLevelsMatch = Expect<
  Extends<[ReanimatedLogLevel.warn, ReanimatedLogLevel.error], [1, 2]>
>;

describe('react-native-reanimated types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
