import { requireOptionalNativeModule } from 'expo';

export type Point = { x: number; y: number };

export type ExpoV2DemoModule = {
  add(a: number, b: number): number;
  greet(name: string): string;
  translate(point: Point, dx: number, dy: number): Point;
};

export function getExpoV2Demo(): ExpoV2DemoModule | null {
  return requireOptionalNativeModule<ExpoV2DemoModule>('ExpoV2Demo');
}
