/* eslint-disable @typescript-eslint/no-empty-object-type */

type obj<T> = T extends { [key: string | number]: any } ? { [K in keyof T]: T[K] } : never;

export type EmptyPayload = {
  [key: string]: never;
  key: never;
};

type AbstractPayload = Record<string, any> & {
  key?: never;
};

export type Event<
  Name extends string = string,
  Payload extends AbstractPayload = EmptyPayload,
> = obj<{ key: Name } & Payload>;

export type EventShape<Name extends string, Payload = any> = Name & {
  __payload: Payload;
};

type getEventPayloadOfShape<Shape> =
  Shape extends EventShape<infer Name, infer Payload>
    ? Payload extends AbstractPayload
      ? { [K in Name]: Payload }
      : never
    : never;

type getEventsOfShapesRec<Shapes, Out = {}> = Shapes extends readonly [infer Shape, ...infer Rest]
  ? getEventsOfShapesRec<Rest, Out & getEventPayloadOfShape<Shape>>
  : obj<Out>;

type reduceEventLoggerEvents<EventLogger> =
  EventLogger extends EventLoggerType<infer Category, infer Events>
    ? Category extends string
      ? {
          [K in keyof Events]: K extends string
            ? obj<{ key: `${Category}:${K}` } & Events[K]>
            : never;
        }[keyof Events]
      : never
    : never;

type reduceEventLoggersRec<EventLoggers, Out = never> = EventLoggers extends readonly [
  infer EventLogger,
  ...infer Rest,
]
  ? reduceEventLoggersRec<Rest, Out | reduceEventLoggerEvents<EventLogger>>
  : obj<Out>;

interface EventLoggerType<Category, Events> {
  category: Category;
  __eventTypes?: () => Events;
}

export interface EventLogger<Category, Events> extends EventLoggerType<Category, Events> {
  <EventName extends keyof Events>(event: EventName, data: Events[EventName]): void;
}

export interface EventBuilder {
  event<const Name extends string, const Payload extends AbstractPayload>(): EventShape<
    Name,
    Payload
  >;
}

export interface EventLoggerBuilder {
  <const Category extends string, const Shapes extends readonly EventShape<string>[]>(
    category: Category,
    _fn: (builder: EventBuilder) => Shapes
  ): EventLogger<Category, getEventsOfShapesRec<Shapes>>;
}

export type collectEventLoggers<EventLoggers extends [...EventLoggerType<any, any>[]]> =
  reduceEventLoggersRec<EventLoggers>;
