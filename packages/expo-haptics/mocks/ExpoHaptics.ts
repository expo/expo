/**
 * This file provides a mock for the native Expo module,
 * and works out of the box with the expo jest preset.
 *  */

export type NotificationType = any;

export type ImpactStyle = any;

export type HapticType = any;

export async function notificationAsync(notificationType: NotificationType): Promise<void> {}

export function notification(notificationType: NotificationType): void {}

export async function impactAsync(style: ImpactStyle): Promise<void> {}

export function impact(style: ImpactStyle): void {}

export async function selectionAsync(): Promise<void> {}

export function selection(): void {}

export async function performHapticsAsync(type: HapticType): Promise<void> {}

export function performHaptics(type: HapticType): void {}
