import type { EventEmitter } from 'expo-modules-core/types';
type AnyEventListener = (...args: any[]) => any;
/**
 * Type helper that infers the event name from the emitter's events map.
 */
type InferEventName<TEventsMap> = TEventsMap extends Record<infer TEventName extends keyof TEventsMap, AnyEventListener> ? TEventName : never;
/**
 * Type helper that infers the event listener from the emitter's events map.
 */
type InferEventListener<TEventsMap, TEventName extends keyof TEventsMap> = TEventsMap extends Record<TEventName, infer TEventListener extends AnyEventListener> ? TEventListener : never;
/**
 * Type helper that infers the first parameter of the event listener.
 */
type InferEventParameter<TEventListener extends AnyEventListener, TInitialValue> = TInitialValue extends Parameters<TEventListener>[0] ? Parameters<TEventListener>[0] : Parameters<TEventListener>[0] | TInitialValue | null;
/**
 * React hook that listens to events emitted by the given object. The returned value is an event parameter
 * that gets updated whenever a new event is dispatched.
 * @param eventEmitter An object that emits events. For example, a native module or shared object or an instance of [`EventEmitter`](#eventemitter).
 * @param eventName Name of the event to listen to.
 * @param initialValue An event parameter to use until the event is called for the first time.
 * @returns A parameter of the event listener.
 * @example
 * ```tsx
 * import { useEvent } from 'expo';
 * import { VideoPlayer } from 'expo-video';
 *
 * export function PlayerStatus({ videoPlayer }: { videoPlayer: VideoPlayer }) {
 *   const { status } = useEvent(videoPlayer, 'statusChange', { status: videoPlayer.status });
 *
 *   return <Text>{`Player status: ${status}`}</Text>;
 * }
 * ```
 */
export declare function useEvent<TEventsMap extends Record<string, AnyEventListener>, TEventName extends InferEventName<TEventsMap>, TEventListener extends InferEventListener<TEventsMap, TEventName>, TInitialValue extends Parameters<TEventListener>[0] | null>(eventEmitter: EventEmitter<TEventsMap>, eventName: TEventName, initialValue?: TInitialValue | null): InferEventParameter<TEventListener, TInitialValue>;
/**
 * React hook that listens to events emitted by the given object and calls the listener function whenever a new event is dispatched.
 * The event listener is automatically added during the first render and removed when the component unmounts.
 * @param eventEmitter An object that emits events. For example, a native module or shared object or an instance of [`EventEmitter`](#eventemitter).
 * @param eventName Name of the event to listen to.
 * @param listener A function to call when the event is dispatched.
 * @example
 * ```tsx
 * import { useEventListener } from 'expo';
 * import { useVideoPlayer, VideoView } from 'expo-video';
 *
 * export function VideoPlayerView() {
 *   const player = useVideoPlayer(videoSource);
 *
 *   useEventListener(player, 'playingChange', ({ isPlaying }) => {
 *     console.log('Player is playing:', isPlaying);
 *   });
 *
 *   return <VideoView player={player} />;
 * }
 * ```
 */
export declare function useEventListener<TEventsMap extends Record<string, AnyEventListener>, TEventName extends InferEventName<TEventsMap>, TEventListener extends InferEventListener<TEventsMap, TEventName>>(eventEmitter: EventEmitter<TEventsMap>, eventName: TEventName, listener: TEventListener): void;
export {};
//# sourceMappingURL=useEvent.d.ts.map