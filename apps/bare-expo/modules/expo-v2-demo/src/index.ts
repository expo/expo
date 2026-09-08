export type Point = { x: number; y: number };

export type ExpoV2DemoModule = {
  add(a: number, b: number): number;
  greet(name: string): string;
  translate(point: Point, dx: number, dy: number): Point;
};

export function getExpoV2Demo(): ExpoV2DemoModule | null {
  return (globalThis as any).expoV2?.modules?.ExpoV2Demo ?? null;
}
