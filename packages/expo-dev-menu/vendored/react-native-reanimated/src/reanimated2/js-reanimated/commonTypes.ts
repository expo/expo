import { Timestamp, NestedObjectValues } from '../commonTypes';
import MutableValue from './MutableValue';

export interface Mapper<T> {
  MAPPER_ID?: number;
  id: number;
  inputs: MutableValue<T>[];
  outputs: MutableValue<T>[];
  mapper: () => void;
  dirty: boolean;
  execute(): void;
  extractMutablesFromArray<T>(
    array: NestedObjectValues<MutableValue<T>>
  ): MutableValue<T>[];
}

export interface MapperRegistry<T> {
  sortedMappers: Mapper<T>[];
  mappers: Map<number, Mapper<T>>;
  _module: JSReanimated;
  updatedSinceLastExecute: boolean;
  startMapper(mapper: Mapper<T>): number;
  stopMapper(id: number): void;
  execute(): void;
  updateOrder(): void;
}

export interface JSReanimated {
  _valueSetter?: <T>(value: T) => void;
  _renderRequested: boolean;
  _mapperRegistry: MapperRegistry<any>;
  _frames: ((timestamp: Timestamp) => void)[];
  timeProvider: { now: () => number };
  pushFrame(frame: (timestamp: Timestamp) => void): void;
  getTimestamp(): number;
  maybeRequestRender(): void;
  _onRender(timestampMs: number): void;
  installCoreFunctions(valueSetter: <T>(value: T) => void): void;
  makeShareable<T>(value: T): T;
  makeMutable<T>(value: T): MutableValue<T>;
  makeRemote<T>(object: Record<string, any>): T;
  startMapper(
    mapper: () => void,
    inputs: NestedObjectValues<MutableValue<unknown>>[],
    outputs: NestedObjectValues<MutableValue<unknown>>[]
  ): number;
  stopMapper(mapperId: number): void;
  registerEventHandler<T>(_: string, __: (event: T) => void): string;
  unregisterEventHandler(_: string): void;
  enableLayoutAnimations(): void;
}
