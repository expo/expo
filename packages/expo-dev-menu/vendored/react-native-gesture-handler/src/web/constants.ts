import Hammer from '@egjs/hammerjs';

import { State } from '../State';

export const CONTENT_TOUCHES_DELAY = 240;
export const CONTENT_TOUCHES_QUICK_TAP_END_DELAY = 50;
export const MULTI_FINGER_PAN_MAX_PINCH_THRESHOLD = 0.1;
export const MULTI_FINGER_PAN_MAX_ROTATION_THRESHOLD = 7;
export const DEG_RAD = Math.PI / 180;

// Map Hammer values to RNGH
export const EventMap = {
  [Hammer.INPUT_START]: State.BEGAN,
  [Hammer.INPUT_MOVE]: State.ACTIVE,
  [Hammer.INPUT_END]: State.END,
  [Hammer.INPUT_CANCEL]: State.FAILED,
} as const;

export const Direction = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

export const DirectionMap = {
  [Hammer.DIRECTION_RIGHT]: Direction.RIGHT,
  [Hammer.DIRECTION_LEFT]: Direction.LEFT,
  [Hammer.DIRECTION_UP]: Direction.UP,
  [Hammer.DIRECTION_DOWN]: Direction.DOWN,
};

export const HammerInputNames = {
  [Hammer.INPUT_START]: 'START',
  [Hammer.INPUT_MOVE]: 'MOVE',
  [Hammer.INPUT_END]: 'END',
  [Hammer.INPUT_CANCEL]: 'CANCEL',
};
export const HammerDirectionNames = {
  [Hammer.DIRECTION_HORIZONTAL]: 'HORIZONTAL',
  [Hammer.DIRECTION_UP]: 'UP',
  [Hammer.DIRECTION_DOWN]: 'DOWN',
  [Hammer.DIRECTION_VERTICAL]: 'VERTICAL',
  [Hammer.DIRECTION_NONE]: 'NONE',
  [Hammer.DIRECTION_ALL]: 'ALL',
  [Hammer.DIRECTION_RIGHT]: 'RIGHT',
  [Hammer.DIRECTION_LEFT]: 'LEFT',
};
