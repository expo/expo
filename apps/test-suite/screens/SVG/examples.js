import * as Circle from './Circle';
import * as Clipping from './Clipping';
import * as Ellipse from './Ellipse';
import * as G from './G';
import * as Gradients from './Gradients';
import * as Image from './Image';
import * as Line from './Line';
import * as Path from './Path';
import * as Polygon from './Polygon';
import * as Polyline from './Polyline';
import * as Rect from './Rect';
import * as Reusable from './Reusable';
import * as Stroking from './Stroking';
import * as Svg from './Svg';
import * as Text from './Text';
import * as TextStroke from './TextStroke';

import createScreen from './index';

const SVGS = {
  Svg,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polygon,
  Polyline,
  Path,
  Text,
  TextStroke,
  Stroking,
  G,
  Gradients,
  Clipping,
  Image,
  Reusable,
};

let screens = {};
for (const screenName of Object.keys(SVGS)) {
  screens[screenName] = createScreen(SVGS[screenName]);
}
export default screens;
