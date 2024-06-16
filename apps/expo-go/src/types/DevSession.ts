export type DevSession = {
  description: string;
  hostname?: string;
  config?: object;
  url: string;
  platform?: 'native' | 'web';
  source: 'desktop' | 'snack';
};
