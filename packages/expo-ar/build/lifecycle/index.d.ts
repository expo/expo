import { TrackingConfiguration } from '../commons';
/**
 * Starts AR session
 *
 * @param node Handler for GLView component
 * @param configuration {@only iOS}. Defines motion and scene tracking behaviors for the session. {@link https://developer.apple.com/documentation/arkit/arsession/2865608-runwithconfiguration}
 */
export declare function startAsync(node: number | React.Component, configuration: TrackingConfiguration): Promise<{
    capturedImageTexture: number;
}>;
/**
 * Pauses native session. No new AR data would be provided. Preview would be stopped as well.
 */
export declare function pauseAsync(): Promise<void>;
/**
 * Resumes previously paused session. That would restore any AR data provision. Preview would be restored as well.
 */
export declare function resumeAsync(): Promise<void>;
/**
 * Tears down current session and starts it up again with previous configuration.
 */
export declare function resetAsync(): Promise<void>;
/**
 * Stops current session. That would clean up native side. You can start another session after calling this.
 */
export declare function stopAsync(): Promise<void>;
