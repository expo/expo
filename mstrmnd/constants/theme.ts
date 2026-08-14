/** mstrmnd visual system — MIDI chassis meets living agents */
export const colors = {
  void: '#050607',
  chassis: '#0B0D10',
  chassisRaised: '#12151A',
  recess: '#080A0C',
  pad: '#151A21',
  padPressed: '#1C2430',
  bezel: '#1E252F',
  hairline: 'rgba(255,255,255,0.06)',
  metal: '#8B949E',
  ink: '#E8EDF2',
  muted: '#6B7580',
  signal: '#C8F542',
  amber: '#FFB020',
  cyan: '#3DDCFF',
  coral: '#FF6B4A',
  mint: '#5EF2C0',
  danger: '#FF4D6A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radii = {
  pad: 10,
  window: 14,
  pill: 999,
} as const;
