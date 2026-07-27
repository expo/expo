import type { ServerFontResourceDescriptor } from './Font.types';

type ServerFontEntry = { name: string; css: string; resourceId: string };

export function withServerContext<T>(callback: () => T): T {
  return callback();
}

export function addServerFont(_entry: ServerFontEntry): void {}

export function getServerResourceDescriptors(): ServerFontResourceDescriptor[] {
  return [];
}

export function getLoadedServerFonts(): string[] {
  return [];
}

export function isServerFontLoaded(_name: string): boolean {
  return false;
}
