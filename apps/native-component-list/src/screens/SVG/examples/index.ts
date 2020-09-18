import Circle from './Circle';
import Clipping from './Clipping';
import Ellipse from './Ellipse';
import Example from './Example';
import G from './G';
import Gradients from './Gradients';
import Image from './Image';
import Line from './Line';
import PanResponder from './PanResponder';
import Path from './Path';
import Polygon from './Polygon';
import Polyline from './Polyline';
import Rect from './Rect';
import Reusable from './Reusable';
import Stroking from './Stroking';
import Svg from './Svg';
import Text from './Text';
import TouchEvents from './TouchEvents';
import VictoryNative from './VictoryNative';

const examples: { [key: string]: Example } = {
  Svg,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polygon,
  Polyline,
  Path,
  Text,
  Stroking,
  G,
  Gradients,
  Clipping,
  Image,
  TouchEvents,
  Reusable,
  PanResponder,
  VictoryNative,
};

export default examples;
