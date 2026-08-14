/** Official MSTRMND brand tokens — metallic tetrahedron system */
export const brand = {
  name: 'MSTRMND',
  /** Continuous wordmark — use letterSpacing in UI, not literal spaces */
  wordmark: 'MSTRMND',
  tagline: 'Building intelligent systems. Empowering human potential.',
  pillars: ['Research', 'Technology', 'Systems', 'Future'] as const,
} as const;

export const colors = {
  void: '#000000',
  chassis: '#0A0A0C',
  chassisRaised: '#121214',
  recess: '#070708',
  pad: '#141416',
  padPressed: '#1C1C20',
  bezel: '#2A2A30',
  hairline: 'rgba(255,255,255,0.08)',
  metal: '#A8ADB4',
  chrome: '#D8DCE2',
  chromeHot: '#F4F6F8',
  ink: '#F2F4F6',
  muted: '#7A8088',
  /** Brand signal — silver */
  signal: '#C8CDD4',
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
