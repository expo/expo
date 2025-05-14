import React from 'react';

import {View, Animated, PanResponder} from 'react-native';

class PanController extends React.Component<any, any> {
  _responder: any = null;
  _listener: any = null;
  _direction: any = null;
  deceleration;

  constructor(props: any) {
    super(props);

    this.deceleration = 0.997;
    if (
      props.momentumDecayConfig &&
      this.props.momentumDecayConfig.deceleration
    ) {
      this.deceleration = this.props.momentumDecayConfig.deceleration;
    }
    this._responder = PanResponder.create({
      onStartShouldSetPanResponder: this.props.onStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this.props.onMoveShouldSetPanResponder,
      onPanResponderGrant: (...args) => {
        if (this.props.onPanResponderGrant) {
          this.props.onPanResponderGrant(...args);
        }
        let {panX, panY, horizontal, vertical, xMode, yMode} = this.props;

        this.handleResponderGrant(panX, xMode);
        this.handleResponderGrant(panY, yMode);

        this._direction =
          horizontal && !vertical ? 'x' : vertical && !horizontal ? 'y' : null;
      },

      onPanResponderMove: (_, {dx, dy, x0, y0}) => {
        let {
          panX,
          panY,
          xBounds,
          yBounds,
          overshootX,
          overshootY,
          horizontal,
          vertical,
          lockDirection,
          directionLockDistance,
        } = this.props;

        if (!this._direction) {
          const dx2 = dx * dx;
          const dy2 = dy * dy;
          if (dx2 + dy2 > directionLockDistance) {
            this._direction = dx2 > dy2 ? 'x' : 'y';
            if (this.props.onDirectionChange) {
              this.props.onDirectionChange(this._direction, {dx, dy, x0, y0});
            }
          }
        }

        const dir = this._direction;

        if (this.props.onPanResponderMove) {
          this.props.onPanResponderMove(_, {dx, dy, x0, y0});
        }

        if (horizontal && (!lockDirection || dir === 'x')) {
          let [xMin, xMax] = xBounds;

          this.handleResponderMove(panX, dx, xMin, xMax, overshootX);
        }

        if (vertical && (!lockDirection || dir === 'y')) {
          let [yMin, yMax] = yBounds;

          this.handleResponderMove(panY, dy, yMin, yMax, overshootY);
        }
      },

      onPanResponderRelease: (_, {vx, vy, dx, dy}) => {
        let {
          panX,
          panY,
          xBounds,
          yBounds,
          overshootX,
          overshootY,
          horizontal,
          vertical,
          lockDirection,
          xMode,
          yMode,
          snapSpacingX,
          snapSpacingY,
        } = this.props;

        let cancel = false;

        const dir = this._direction;

        if (this.props.onRelease) {
          cancel = this.props.onRelease({vx, vy, dx, dy}) === false;
        }

        if (!cancel && horizontal && (!lockDirection || dir === 'x')) {
          let [xMin, xMax] = xBounds;
          if (this.props.onReleaseX) {
            cancel = this.props.onReleaseX({vx, vy, dx, dy}) === false;
          }
          !cancel &&
            this.handleResponderRelease(
              panX,
              xMin,
              xMax,
              vx,
              overshootX,
              xMode,
              snapSpacingX,
            );
        }

        if (!cancel && vertical && (!lockDirection || dir === 'y')) {
          let [yMin, yMax] = yBounds;
          if (this.props.onReleaseY) {
            cancel = this.props.onReleaseY({vx, vy, dx, dy}) === false;
          }
          !cancel &&
            this.handleResponderRelease(
              panY,
              yMin,
              yMax,
              vy,
              overshootY,
              yMode,
              snapSpacingY,
            );
        }

        this._direction =
          horizontal && !vertical ? 'x' : vertical && !horizontal ? 'y' : null;
      },
    });
  }

  handleResponderMove(
    anim: any,
    delta: any,
    min: any,
    max: any,
    overshoot: any,
  ) {
    let val = anim._offset + delta;

    if (val > max) {
      switch (overshoot) {
        case 'spring':
          val = max + (val - max) / this.props.overshootReductionFactor;
          break;
        case 'clamp':
          val = max;
          break;
      }
    }
    if (val < min) {
      switch (overshoot) {
        case 'spring':
          val = min - (min - val) / this.props.overshootReductionFactor;
          break;
        case 'clamp':
          val = min;
          break;
      }
    }
    val = val - anim._offset;
    anim.setValue(val);
  }

  handleResponderRelease(
    anim: any,
    min: any,
    max: any,
    velocity: any,
    overshoot: any,
    mode: any,
    snapSpacing: any,
  ) {
    anim.flattenOffset();

    if (anim._value < min) {
      if (this.props.onOvershoot) {
        this.props.onOvershoot(); // TODO: what args should we pass to this
      }
      switch (overshoot) {
        case 'spring':
          Animated.spring(anim, {
            ...this.props.overshootSpringConfig,
            toValue: min,
            velocity,
          }).start();
          break;
        case 'clamp':
          anim.setValue(min);
          break;
      }
    } else if (anim._value > max) {
      if (this.props.onOvershoot) {
        this.props.onOvershoot(); // TODO: what args should we pass to this
      }
      switch (overshoot) {
        case 'spring':
          Animated.spring(anim, {
            ...this.props.overshootSpringConfig,
            toValue: max,
            velocity,
          }).start();
          break;
        case 'clamp':
          anim.setValue(min);
          break;
      }
    } else {
      switch (mode) {
        case 'snap':
          this.handleSnappedScroll(anim, min, max, velocity, snapSpacing);
          break;

        case 'decay':
          this.handleMomentumScroll(anim, min, max, velocity, overshoot);
          break;

        case 'spring-origin':
          Animated.spring(anim, {
            ...this.props.springOriginConfig,
            toValue: 0,
            velocity,
          }).start();
          break;
      }
    }
  }

  handleResponderGrant(anim: any, mode: any) {
    switch (mode) {
      case 'spring-origin':
        anim.setValue(0);
        break;
      case 'snap':
      case 'decay':
        anim.setOffset(anim._value + anim._offset);
        anim.setValue(0);
        break;
    }
  }

  handleMomentumScroll(
    anim: any,
    min: any,
    max: any,
    velocity: any,
    overshoot: any,
  ) {
    Animated.decay(anim, {
      ...this.props.momentumDecayConfig,
      velocity,
    }).start(() => {
      anim.removeListener(this._listener);
    });

    this._listener = anim.addListener(({value}: any) => {
      if (value < min) {
        anim.removeListener(this._listener);
        if (this.props.onOvershoot) {
          this.props.onOvershoot(); // TODO: what args should we pass to this
        }
        switch (overshoot) {
          case 'spring':
            Animated.spring(anim, {
              ...this.props.overshootSpringConfig,
              toValue: min,
              velocity,
            }).start();
            break;
          case 'clamp':
            anim.setValue(min);
            break;
        }
      } else if (value > max) {
        anim.removeListener(this._listener);
        if (this.props.onOvershoot) {
          this.props.onOvershoot(); // TODO: what args should we pass to this
        }
        switch (overshoot) {
          case 'spring':
            Animated.spring(anim, {
              ...this.props.overshootSpringConfig,
              toValue: max,
              velocity,
            }).start();
            break;
          case 'clamp':
            anim.setValue(min);
            break;
        }
      }
    });
  }

  handleSnappedScroll(
    anim: any,
    min: any,
    max: any,
    velocity: any,
    spacing: any,
  ) {
    let endX = this.momentumCenter(anim._value, velocity, spacing);
    endX = Math.max(endX, min);
    endX = Math.min(endX, max);
    const bounds = [endX - spacing / 2, endX + spacing / 2];
    const endV = this.velocityAtBounds(anim._value, velocity, bounds);

    this._listener = anim.addListener(({value}: any) => {
      if (value > bounds[0] && value < bounds[1]) {
        Animated.spring(anim, {
          toValue: endX,
          velocity: endV,
          useNativeDriver: false,
        }).start();
      }
    });

    Animated.decay(anim, {
      ...this.props.momentumDecayConfig,
      velocity,
    }).start(() => {
      anim.removeListener(this._listener);
    });
  }

  closestCenter(x: any, spacing: any) {
    const plus = x % spacing < spacing / 2 ? 0 : spacing;
    return Math.round(x / spacing) * spacing + plus;
  }

  momentumCenter(x0: any, vx: any, spacing: any) {
    let t = 0;
    let x1 = x0;
    let x = x1;

    while (true) {
      t += 16;
      x =
        x0 +
        (vx / (1 - this.deceleration)) *
          (1 - Math.exp(-(1 - this.deceleration) * t));
      if (Math.abs(x - x1) < 0.1) {
        x1 = x;
        break;
      }
      x1 = x;
    }
    return this.closestCenter(x1, spacing);
  }

  velocityAtBounds(x0: any, vx: any, bounds: any) {
    let t = 0;
    let x1 = x0;
    let x = x1;
    let vf;
    while (true) {
      t += 16;
      x =
        x0 +
        (vx / (1 - this.deceleration)) *
          (1 - Math.exp(-(1 - this.deceleration) * t));
      vf = (x - x1) / 16;
      if (x > bounds[0] && x < bounds[1]) {
        break;
      }
      if (Math.abs(vf) < 0.1) {
        break;
      }
      x1 = x;
    }
    return vf;
  }

  render() {
    return <View {...this.props} {...this._responder.panHandlers} />;
  }
}

export default PanController;
