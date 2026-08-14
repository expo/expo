import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Weight = 'regular' | 'bold';
type Tone = 'chrome' | 'solid';

type Props = {
  size?: number;
  glow?: boolean;
  weight?: Weight;
  tone?: Tone;
  color?: string;
};

/** Top-down tetrahedron — official MSTRMND mark */
export function BrandMark({
  size = 72,
  glow = true,
  weight = 'bold',
  tone = 'chrome',
  color = '#F4F6F8',
}: Props) {
  const stroke = weight === 'bold' ? 6.4 : 4.2;
  const cx = 50;
  const cy = 50;
  const R = 35;
  const top = { x: cx, y: cy - R };
  const bl = { x: cx - R * 0.8660254, y: cy + R * 0.5 };
  const br = { x: cx + R * 0.8660254, y: cy + R * 0.5 };
  const mid = { x: cx, y: cy };

  const outer = `M ${top.x} ${top.y} L ${br.x} ${br.y} L ${bl.x} ${bl.y} Z`;
  const spokes = `M ${top.x} ${top.y} L ${mid.x} ${mid.y} M ${bl.x} ${bl.y} L ${mid.x} ${mid.y} M ${br.x} ${br.y} L ${mid.x} ${mid.y}`;
  const strokeColor = tone === 'chrome' ? 'url(#chrome)' : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="chrome" x1="15%" y1="0%" x2="90%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="42%" stopColor="#D2D6DC" />
          <Stop offset="100%" stopColor="#8B919A" />
        </LinearGradient>
      </Defs>
      {glow && tone === 'chrome' ? (
        <Path
          d={outer}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke * 2.05}
          fill="none"
          strokeLinejoin="round"
        />
      ) : null}
      <Path
        d={outer}
        stroke={strokeColor}
        strokeWidth={stroke}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d={spokes}
        stroke={strokeColor}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
