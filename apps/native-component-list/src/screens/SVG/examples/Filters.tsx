import * as Svg from 'react-native-svg';

import Example from './Example';

function GaussianBlurExample() {
  return (
    <Svg.Svg height="120" width="120">
      <Svg.Defs>
        <Svg.Filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <Svg.FeGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </Svg.Filter>
      </Svg.Defs>
      <Svg.Circle cx="60" cy="60" r="40" fill="purple" filter="url(#blur)" />
    </Svg.Svg>
  );
}

GaussianBlurExample.title = 'Gaussian Blur Filter';

function BlendExample() {
  return (
    <Svg.Svg height="120" width="200">
      <Svg.Defs>
        <Svg.Filter id="blend" x="0" y="0" width="100%" height="100%">
          <Svg.FeBlend in="SourceGraphic" in2="BackgroundImage" mode="multiply" />
        </Svg.Filter>
      </Svg.Defs>
      <Svg.Rect x="10" y="10" width="80" height="80" fill="red" />
      <Svg.Rect x="50" y="30" width="80" height="80" fill="blue" filter="url(#blend)" />
    </Svg.Svg>
  );
}

BlendExample.title = 'Blend Filter';

function CompositeExample() {
  return (
    <Svg.Svg height="120" width="120">
      <Svg.Defs>
        <Svg.Filter id="composite" x="0" y="0" width="100%" height="100%">
          <Svg.FeFlood floodColor="green" floodOpacity="0.5" result="flood" />
          <Svg.FeComposite in="SourceGraphic" in2="flood" operator="xor" />
        </Svg.Filter>
      </Svg.Defs>
      <Svg.Circle cx="60" cy="60" r="40" fill="orange" filter="url(#composite)" />
    </Svg.Svg>
  );
}

CompositeExample.title = 'Composite Filter (XOR)';

function DropShadowExample() {
  return (
    <Svg.Svg height="120" width="140">
      <Svg.Defs>
        <Svg.Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <Svg.FeGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <Svg.FeOffset in="blur" dx="4" dy="4" result="offsetBlur" />
          <Svg.FeMerge>
            <Svg.FeMergeNode in="offsetBlur" />
            <Svg.FeMergeNode in="SourceGraphic" />
          </Svg.FeMerge>
        </Svg.Filter>
      </Svg.Defs>
      <Svg.Rect x="20" y="20" width="80" height="60" rx="10" fill="coral" filter="url(#shadow)" />
    </Svg.Svg>
  );
}

DropShadowExample.title = 'Drop Shadow (Blur + Offset + Merge)';

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Defs>
      <Svg.Filter id="iconBlur">
        <Svg.FeGaussianBlur in="SourceGraphic" stdDeviation="1" />
      </Svg.Filter>
    </Svg.Defs>
    <Svg.Circle cx="10" cy="10" r="7" fill="purple" filter="url(#iconBlur)" />
  </Svg.Svg>
);

const Filters: Example = {
  icon,
  samples: [GaussianBlurExample, BlendExample, CompositeExample, DropShadowExample],
};

export default Filters;
