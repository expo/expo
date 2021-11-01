import {
  cond,
  sub,
  divide,
  multiply,
  sqrt,
  add,
  block,
  set,
  exp,
  sin,
  cos,
  eq,
  or,
  neq,
  and,
  lessThan,
  greaterThan,
  proc,
  min,
  abs,
} from '../base';
import AnimatedValue from '../core/InternalAnimatedValue';

const MAX_STEPS_MS = 64;

function spring(clock, state, config) {
  const lastTime = cond(state.time, state.time, clock);

  const deltaTime = min(sub(clock, lastTime), MAX_STEPS_MS);

  const c = config.damping;
  const m = config.mass;
  const k = config.stiffness;

  const v0 = multiply(-1, state.velocity);
  const x0 = sub(config.toValue, state.position);

  const zeta = divide(c, multiply(2, sqrt(multiply(k, m)))); // damping ratio
  const omega0 = sqrt(divide(k, m)); // undamped angular frequency of the oscillator (rad/ms)
  const omega1 = multiply(omega0, sqrt(sub(1, multiply(zeta, zeta)))); // exponential decay

  const t = divide(deltaTime, 1000); // in seconds

  const sin1 = sin(multiply(omega1, t));
  const cos1 = cos(multiply(omega1, t));

  // under damped
  const underDampedEnvelope = exp(multiply(-1, zeta, omega0, t));
  const underDampedFrag1 = multiply(
    underDampedEnvelope,
    add(
      multiply(sin1, divide(add(v0, multiply(zeta, omega0, x0)), omega1)),
      multiply(x0, cos1)
    )
  );
  const underDampedPosition = sub(config.toValue, underDampedFrag1);
  // This looks crazy -- it's actually just the derivative of the oscillation function
  const underDampedVelocity = sub(
    multiply(zeta, omega0, underDampedFrag1),
    multiply(
      underDampedEnvelope,
      sub(
        multiply(cos1, add(v0, multiply(zeta, omega0, x0))),
        multiply(omega1, x0, sin1)
      )
    )
  );

  // critically damped
  const criticallyDampedEnvelope = exp(multiply(-1, omega0, t));
  const criticallyDampedPosition = sub(
    config.toValue,
    multiply(
      criticallyDampedEnvelope,
      add(x0, multiply(add(v0, multiply(omega0, x0)), t))
    )
  );
  const criticallyDampedVelocity = multiply(
    criticallyDampedEnvelope,
    add(
      multiply(v0, sub(multiply(t, omega0), 1)),
      multiply(t, x0, omega0, omega0)
    )
  );

  // conditions for stopping the spring animations
  const prevPosition = state.prevPosition
    ? state.prevPosition
    : new AnimatedValue(0);

  const isOvershooting = cond(
    and(config.overshootClamping, neq(config.stiffness, 0)),
    cond(
      lessThan(prevPosition, config.toValue),
      greaterThan(state.position, config.toValue),
      lessThan(state.position, config.toValue)
    )
  );
  const isVelocity = lessThan(abs(state.velocity), config.restSpeedThreshold);
  const isDisplacement = or(
    eq(config.stiffness, 0),
    lessThan(
      abs(sub(config.toValue, state.position)),
      config.restDisplacementThreshold
    )
  );

  return block([
    set(prevPosition, state.position),
    cond(
      lessThan(zeta, 1),
      [
        set(state.position, underDampedPosition),
        set(state.velocity, underDampedVelocity),
      ],
      [
        set(state.position, criticallyDampedPosition),
        set(state.velocity, criticallyDampedVelocity),
      ]
    ),
    set(state.time, clock),
    cond(or(isOvershooting, and(isVelocity, isDisplacement)), [
      cond(neq(config.stiffness, 0), [
        set(state.velocity, 0),
        set(state.position, config.toValue),
      ]),
      set(state.finished, 1),
    ]),
  ]);
}

const procSpring = proc(
  (
    finished,
    velocity,
    position,
    time,
    prevPosition,
    toValue,
    damping,
    mass,
    stiffness,
    overshootClamping,
    restSpeedThreshold,
    restDisplacementThreshold,
    clock
  ) =>
    spring(
      clock,
      {
        finished,
        velocity,
        position,
        time,
        prevPosition,
      },
      {
        toValue,
        damping,
        mass,
        stiffness,
        overshootClamping,
        restDisplacementThreshold,
        restSpeedThreshold,
      }
    )
);

export default function springAnimation(
  clock,
  { finished, velocity, position, time, prevPosition },
  {
    toValue,
    damping,
    mass,
    stiffness,
    overshootClamping,
    restDisplacementThreshold,
    restSpeedThreshold,
  }
) {
  return procSpring(
    finished,
    velocity,
    position,
    time,
    prevPosition,
    toValue,
    damping,
    mass,
    stiffness,
    overshootClamping,
    restSpeedThreshold,
    restDisplacementThreshold,
    clock
  );
}
