import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';
/**
 * Triggers notification feedback.
 */
export declare function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
/**
 * Triggers impact feedback.
 */
export declare function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
/**
 * Triggers selection feedback.
 */
export declare function selectionAsync(): Promise<void>;
export { NotificationFeedbackType, ImpactFeedbackStyle };
