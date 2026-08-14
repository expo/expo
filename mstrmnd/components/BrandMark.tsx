import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  size?: number;
  glow?: boolean;
};

/** Top-down tetrahedron mark — official MSTRMND geometry */
export function BrandMark({ size = 72, glow = true }: Props) {
  const stroke = 5.2;
  // Circumcenter at (50,50); vertices on circumradius
  const cx = 50;
  const cy = 50;
  const R = 36;
  const top = { x: cx, y: cy - R };
  const bl = { x: cx - R * 0.8660254, y: cy + R * 0.5 };
  const br = { x: cx + R * 0.8660254, y: cy + R * 0.5 };
  const mid = { x: cx, y: cy };

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
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={stroke * 2.1}
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
