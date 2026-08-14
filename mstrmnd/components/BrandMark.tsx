import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  size?: number;
  glow?: boolean;
};

/** Top-down tetrahedron mark — official MSTRMND geometry */
export function BrandMark({ size = 72, glow = true }: Props) {
  const stroke = size * 0.07;
  // Equilateral triangle vertices + center
  const cx = 50;
  const cy = 52;
  const r = 38;
  const top = { x: cx, y: cy - r };
  const bl = { x: cx - r * 0.866, y: cy + r * 0.5 };
  const br = { x: cx + r * 0.866, y: cy + r * 0.5 };
  const mid = { x: cx, y: cy + 2 };

  const outer = `M ${top.x} ${top.y} L ${br.x} ${br.y} L ${bl.x} ${bl.y} Z`;
  const spokes = `M ${top.x} ${top.y} L ${mid.x} ${mid.y} M ${bl.x} ${bl.y} L ${mid.x} ${mid.y} M ${br.x} ${br.y} L ${mid.x} ${mid.y}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="45%" stopColor="#D0D4DA" />
          <Stop offset="100%" stopColor="#8E949C" />
        </LinearGradient>
      </Defs>
      {glow ? (
        <Path
          d={outer}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={stroke * 2.2}
          fill="none"
          strokeLinejoin="round"
        />
      ) : null}
      <Path
        d={outer}
        stroke="url(#chrome)"
        strokeWidth={stroke}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d={spokes}
        stroke="url(#chrome)"
        strokeWidth={stroke * 0.92}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
