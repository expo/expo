import React from 'react';
import { Dimensions, Platform, View, LayoutChangeEvent, StyleSheet } from 'react-native';
import {
  PanGestureHandler,
  TapGestureHandler,
  State as GestureState,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

type Props = {
  /**
   * Points for snapping of bottom sheet component. They define distance from bottom of the screen.
   * Might be number or percent (as string e.g. '20%') for points or percents of screen height from bottom.
   */
  snapPoints: (number | string)[];

  /**
   * Determines initial snap point of bottom sheet. Defaults to 0.
   */
  initialSnap: number;

  /**
   * When true, clamp bottom position to first snapPoint.
   */
  enabledBottomClamp?: boolean;

  /**
   * When true, sheet will grows up from bottom to initial snapPoint.
   */
  enabledBottomInitialAnimation?: boolean;

  /**
   * If false blocks snapping using snapTo method. Defaults to true.
   */
  enabledManualSnapping?: boolean;

  /**
   * Reanimated node which holds position of bottom sheet, where 1 it the highest snap point and 0 is the lowest.
   */
  callbackNode?: Animated.Value<number>;

  /**
   * Reanimated node which holds position of bottom sheet;s content (in dp).
   */
  contentPosition?: Animated.Value<number>;

  /**
   * Defines how violently sheet has to stopped while overdragging. 0 means no overdrag. Defaults to 0.
   */
  overdragResistanceFactor: number;

  /**
   * Overrides config for spring animation
   */
  springConfig: {
    damping?: number;
    mass?: number;
    stiffness?: number;
    restSpeedThreshold?: number;
    restDisplacementThreshold?: number;
    toss?: number;
  };

  /**
   * Refs for gesture handlers used for building bottomsheet
   */
  innerGestureHandlerRefs: [React.RefObject<PanGestureHandler>, React.RefObject<TapGestureHandler>];

  animationEnabled?: boolean;

  screenHeight: number;
};

type State = {
  snapPoints: Animated.Value<number>[];
  init: any;
  initSnap: number;
  propsToNewIndices: { [key: string]: number };
  heightOfContent: Animated.Value<number>;
};

const P = <T extends any>(android: T, ios: T): T => (Platform.OS === 'ios' ? ios : android);

const magic = {
  damping: 50,
  mass: 0.3,
  stiffness: 121.6,
  overshootClamping: true,
  restSpeedThreshold: 0.3,
  restDisplacementThreshold: 0.3,
  deceleration: 0.999,
  bouncyFactor: 1,
  velocityFactor: P(1, 0.8),
  toss: 0.4,
  coefForTranslatingVelocities: 5,
};

const {
  damping,
  mass,
  stiffness,
  overshootClamping,
  restSpeedThreshold,
  restDisplacementThreshold,
  deceleration,
  velocityFactor,
  toss,
} = magic;

const {
  set,
  cond,
  onChange,
  block,
  eq,
  greaterOrEq,
  sqrt,
  not,
  defined,
  max,
  add,
  and,
  Value,
  spring,
  or,
  divide,
  greaterThan,
  sub,
  // event,
  diff,
  multiply,
  clockRunning,
  startClock,
  stopClock,
  decay,
  Clock,
  lessThan,
} = Animated;

function runDecay(
  clock: Animated.Clock,
  value: Animated.Node<number>,
  velocity: Animated.Node<number>,
  wasStartedFromBegin: Animated.Value<number>
) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };

  const config = { deceleration };

  return [
    cond(clockRunning(clock), 0, [
      cond(wasStartedFromBegin, 0, [
        set(wasStartedFromBegin, 1),
        set(state.finished, 0),
        set(state.velocity, multiply(velocity, velocityFactor)),
        set(state.position, value),
        set(state.time, 0),
        startClock(clock),
      ]),
    ]),
    cond(clockRunning(clock), decay(clock, state, config)),
    cond(state.finished, stopClock(clock)),
    state.position,
  ];
}

function withPreservingAdditiveOffset(drag: Animated.Node<number>, state: Animated.Node<number>) {
  const prev = new Value(0);
  const valWithPreservedOffset = new Value(0);
  return block([
    cond(
      eq(state, GestureState.BEGAN),
      [set(prev, 0)],
      [set(valWithPreservedOffset, add(valWithPreservedOffset, sub(drag, prev))), set(prev, drag)]
    ),
    valWithPreservedOffset,
  ]);
}

function withDecaying(
  drag: Animated.Node<number>,
  state: Animated.Node<number>,
  decayClock: Animated.Clock,
  velocity: Animated.Node<number>,
  prevent: Animated.Value<number>
) {
  const valDecayed = new Value(0);
  const offset = new Value(0);
  // since there might be moar than one clock
  const wasStartedFromBegin = new Value(0);

  return block([
    cond(
      eq(state, GestureState.END),
      [
        cond(
          prevent,
          stopClock(decayClock),
          set(valDecayed, runDecay(decayClock, add(drag, offset), velocity, wasStartedFromBegin))
        ),
      ],
      [
        stopClock(decayClock),
        cond(eq(state, GestureState.BEGAN), set(prevent, 0)),
        cond(
          or(eq(state, GestureState.BEGAN), eq(state, GestureState.ACTIVE)),
          set(wasStartedFromBegin, 0)
        ),
        cond(eq(state, GestureState.BEGAN), [set(offset, sub(valDecayed, drag))]),
        set(valDecayed, add(drag, offset)),
      ]
    ),
    valDecayed,
  ]);
}

export class BottomSheet extends React.Component<Props, State> {
  static defaultProps = {
    overdragResistanceFactor: 0,
    initialSnap: 0,
    enabledBottomClamp: false,
    enabledBottomInitialAnimation: false,
    springConfig: {},
    innerGestureHandlerRefs: [React.createRef(), React.createRef()],
  };

  private decayClock = new Clock();
  private panState = new Value(0);
  private tapState = new Value(0);
  private velocity = new Value(0);
  private masterVelocity = new Value(0);
  private dragY = new Value(0);
  private isManuallySetValue: Animated.Value<number> = new Value(0);
  private manuallySetValue = new Value(0);
  private masterClockForOverscroll = new Clock();
  private preventDecaying: Animated.Value<number> = new Value(0);
  private translateMaster: Animated.Node<number>;
  private panRef: React.RefObject<PanGestureHandler>;
  private tapRef: React.RefObject<TapGestureHandler>;
  private snapPoint: Animated.Node<number>;
  private clampingValue: Animated.Value<number> = new Value(0);
  private screenIndex: Animated.Value<number> = new Value(0);
  private translateY: Animated.Value<number> = new Value(0);

  constructor(props: Props) {
    super(props);

    this.panRef = props.innerGestureHandlerRefs[0];
    this.tapRef = props.innerGestureHandlerRefs[1];
    this.state = BottomSheet.getDerivedStateFromProps(props, undefined);

    const { snapPoints, init } = this.state;
    const middlesOfSnapPoints: [Animated.Node<number>, Animated.Node<number>][] = [];

    for (let i = 1; i < snapPoints.length; i++) {
      const tuple: [Animated.Node<number>, Animated.Node<number>] = [
        add(snapPoints[i - 1], 10),
        sub(snapPoints[i], 25),
      ];
      middlesOfSnapPoints.push(tuple);
    }

    const masterOffseted = (this.masterOffseted = new Value(init));
    // destination point is a approximation of movement if finger released
    const tossForMaster =
      props.springConfig.hasOwnProperty('toss') && props.springConfig.toss != undefined
        ? props.springConfig.toss
        : toss;
    const destinationPoint = add(masterOffseted, multiply(tossForMaster, this.masterVelocity));

    const positive = greaterOrEq(multiply(tossForMaster, this.masterVelocity), 0);
    // method for generating condition for finding the nearest snap point
    const currentSnapPoint = (i = 0): Animated.Node<number> =>
      i + 1 === snapPoints.length
        ? snapPoints[i]
        : cond(
            positive,
            cond(
              greaterThan(destinationPoint, middlesOfSnapPoints[i][0]),
              cond(
                lessThan(destinationPoint, middlesOfSnapPoints[i][1]),
                snapPoints[i + 1],
                currentSnapPoint(i + 1)
              ),
              snapPoints[i]
            ),
            cond(
              greaterThan(destinationPoint, middlesOfSnapPoints[i][1]),
              cond(
                lessThan(destinationPoint, middlesOfSnapPoints[i][0]),
                snapPoints[i + 1],
                currentSnapPoint(i + 1)
              ),
              snapPoints[i]
            )
          );
    // current snap point desired
    this.snapPoint = currentSnapPoint();

    if (props.enabledBottomClamp) {
      this.clampingValue.setValue(snapPoints[snapPoints.length - 1]);
    }

    const masterClock = new Clock();
    const wasRun: Animated.Value<number> = new Value(0);

    this.translateMaster = block([
      cond(or(clockRunning(masterClock), not(wasRun), this.isManuallySetValue), [
        cond(this.isManuallySetValue, stopClock(masterClock)),
        set(
          masterOffseted,
          this.runSpring(
            masterClock,
            masterOffseted,
            this.masterVelocity,
            cond(this.isManuallySetValue, this.manuallySetValue, this.snapPoint),
            wasRun,
            this.isManuallySetValue,
            this.masterVelocity
          )
        ),
        set(this.isManuallySetValue, 0),
      ]),
      cond(
        greaterThan(masterOffseted, snapPoints[0]),
        cond(
          and(props.enabledBottomClamp ? 1 : 0, greaterThan(masterOffseted, this.clampingValue)),
          this.clampingValue,
          masterOffseted
        ),
        max(
          multiply(sub(snapPoints[0], sqrt(add(1, sub(snapPoints[0], masterOffseted)))), 1),
          masterOffseted
        )
      ),
    ]);

    this.translateY = this.withEnhancedLimits(
      withDecaying(
        withPreservingAdditiveOffset(this.dragY, this.panState),
        this.panState,
        this.decayClock,
        this.velocity,
        this.preventDecaying
      ),
      this.masterOffseted,
      0
    );
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { snapPoints } = this.state;
    if (this.props.enabledBottomClamp && snapPoints !== prevState.snapPoints) {
      this.clampingValue.setValue(snapPoints[snapPoints.length - 1]);
    }
  }

  private runSpring(
    clock: Animated.Clock,
    value: Animated.Value<number>,
    velocity: Animated.Node<number>,
    dest: Animated.Node<number>,
    wasRun: Animated.Value<number>,
    isManuallySet: Animated.Node<number> | number,
    valueToBeZeroed: Animated.Value<number>
  ) {
    const state = {
      finished: new Value(0),
      velocity: new Value(0),
      position: new Value(0),
      time: new Value(0),
    };

    const config = {
      damping,
      mass,
      stiffness,
      overshootClamping,
      restSpeedThreshold,
      restDisplacementThreshold,
      toValue: new Value(0),
      ...this.props.springConfig,
    };

    return [
      cond(clockRunning(clock), 0, [
        set(state.finished, 0),
        set(state.velocity, velocity),
        set(state.position, value),
        set(config.toValue, dest),
        cond(and(wasRun, not(isManuallySet)), 0, startClock(clock)),
        cond(defined(wasRun), set(wasRun, 1)),
      ]),
      spring(clock, state, config),
      cond(state.finished, [stopClock(clock), set(valueToBeZeroed, 0)]),
      state.position,
    ];
  }

  private handlePan = ({ nativeEvent: { translationY, state, velocityY } }) => {
    this.dragY.setValue(translationY);
    this.panState.setValue(state);
    this.velocity.setValue(velocityY);
  };

  private handleTap = ({ nativeEvent: { state } }) => {
    this.tapState.setValue(state);
  };

  private withEnhancedLimits(
    val: Animated.Node<number>,
    masterOffseted: Animated.Value<number>,
    screenIndex: number
  ) {
    const wasRunMaster = new Value(0);
    const min = multiply(-1, this.state.heightOfContent);
    const prev = new Value(0);
    const limitedVal = new Value(0);
    const diffPres = new Value(0);
    const flagWasRunSpring = new Value(0);
    const justEndedIfEnded: Animated.Value<number> = new Value(1);
    // const wasEndedMasterAfterInner: Animated.Value<number> = new Value(1);
    const prevState = new Value(0);
    const rev = new Value(0);
    const clockForOverscroll = new Clock();

    return block([
      cond(
        eq(this.screenIndex, screenIndex),

        // Node evaluated on matching screen
        [
          set(rev, limitedVal),
          cond(
            or(
              eq(this.panState, GestureState.BEGAN),
              and(eq(this.panState, GestureState.ACTIVE), eq(prevState, GestureState.END))
            ),

            // Pan just began
            [
              set(prev, val),
              set(flagWasRunSpring, 0),
              stopClock(clockForOverscroll),
              set(wasRunMaster, 0),
            ],

            // Pan is active
            [
              set(limitedVal, add(limitedVal, sub(val, prev))),
              cond(lessThan(limitedVal, min), set(limitedVal, min)),
            ]
          ),
          set(prevState, this.panState), // on iOS sometimes BEGAN event does not trigger
          set(diffPres, sub(prev, val)),
          set(prev, val),
          cond(
            or(greaterOrEq(limitedVal, 0), greaterThan(masterOffseted, 0)),
            [
              cond(
                eq(this.panState, GestureState.ACTIVE),
                set(masterOffseted, sub(masterOffseted, diffPres))
              ),
              cond(greaterThan(masterOffseted, 0), [set(limitedVal, 0)]),
              cond(not(eq(this.panState, GestureState.END)), set(justEndedIfEnded, 1)),
              // cond(eq(this.panState, GestureState.ACTIVE), set(wasEndedMasterAfterInner, 0)),
              cond(
                and(
                  eq(this.panState, GestureState.END),
                  // not(wasEndedMasterAfterInner),
                  or(clockRunning(clockForOverscroll), not(wasRunMaster))
                ),
                [
                  // cond(justEndedIfEnded, set(this.masterVelocity, diff(val))),
                  set(this.masterVelocity, cond(justEndedIfEnded, diff(val), this.velocity)),
                  set(
                    masterOffseted,
                    this.runSpring(
                      clockForOverscroll,
                      masterOffseted,
                      diff(val),
                      this.snapPoint,
                      wasRunMaster,
                      0,
                      this.masterVelocity
                    )
                  ),
                  set(this.masterVelocity, 0),
                ]
              ),
              //   cond(eq(this.panState, State.END), set(wasEndedMasterAfterInner, 0)),
              cond(eq(this.panState, GestureState.END), set(justEndedIfEnded, 0)),
              set(this.preventDecaying, 1),
              0,
            ],
            [set(this.preventDecaying, 0), limitedVal]
          ),
        ],

        // Node evaluated on non-matching screens
        //
        [
          set(diffPres, Animated.min(limitedVal, masterOffseted)),
          set(rev, Animated.min(limitedVal, masterOffseted)),
        ]
      ),
    ]);
  }

  snapTo = (index: number) => {
    this.isManuallySetValue.setValue(1);
    this.manuallySetValue.setValue(
      // @ts-ignore
      this.state.snapPoints[this.state.propsToNewIndices[index]]
    );
  };

  private height: Animated.Value<number> = new Value(0);

  private handleFullHeader = ({
    nativeEvent: {
      layout: { height },
    },
  }: LayoutChangeEvent) => requestAnimationFrame(() => this.height.setValue(height));

  private handleContentHeightChange = (height: number) => {
    this.state.heightOfContent.setValue(height - this.state.initSnap);
  };

  static renumber = (str: string, screenHeight: number) => {
    const result = (Number(str.split('%')[0]) * screenHeight) / 100;
    return result;
  };

  static getDerivedStateFromProps(props: Props, state: State | undefined): State {
    let snapPoints;
    const sortedPropsSnapPoints: {
      val: number;
      ind: number;
    }[] = props.snapPoints
      .map(
        (
          s: number | string,
          i: number
        ): {
          val: number;
          ind: number;
        } => {
          if (typeof s === 'number') {
            return { val: s, ind: i };
          } else if (typeof s === 'string') {
            return { val: BottomSheet.renumber(s, props.screenHeight), ind: i };
          }

          throw new Error(`Invalid type for value ${s}: ${typeof s}`);
        }
      )
      .sort(({ val: a }, { val: b }) => b - a);
    if (state && state.snapPoints) {
      state.snapPoints.forEach(
        (s, i) =>
          // @ts-ignore
          s.__initialized && s.setValue(sortedPropsSnapPoints[0].val - sortedPropsSnapPoints[i].val)
      );
      snapPoints = state.snapPoints;
    } else {
      snapPoints = sortedPropsSnapPoints.map(
        (p) => new Value(sortedPropsSnapPoints[0].val - p.val)
      );
    }

    const propsToNewIndices: { [key: string]: number } = {};
    sortedPropsSnapPoints.forEach(({ ind }, i) => (propsToNewIndices[ind] = i));

    const { initialSnap } = props;

    let init =
      sortedPropsSnapPoints[0].val - sortedPropsSnapPoints[propsToNewIndices[initialSnap]].val;

    if (props.enabledBottomInitialAnimation) {
      init =
        sortedPropsSnapPoints[sortedPropsSnapPoints.length - 1 - propsToNewIndices[initialSnap]]
          .val;
    }

    return {
      init,
      propsToNewIndices,
      heightOfContent: (state && state.heightOfContent) || new Value(0),
      initSnap: sortedPropsSnapPoints[0].val,
      snapPoints,
    };
  }

  render() {
    return (
      <>
        <Animated.View style={styles.heightRuler} onLayout={this.handleFullHeader} />
        <Animated.View
          style={[
            styles.masterView,
            {
              opacity: cond(this.height, 1, 0),
              transform: [
                {
                  translateY: this.translateMaster,
                },
                {
                  translateY: sub(this.height, this.state.initSnap) as any,
                },
              ],
            },
          ]}>
          <Animated.View style={[styles.container]}>
            <PanGestureHandler
              ref={this.panRef}
              onGestureEvent={this.handlePan}
              onHandlerStateChange={this.handlePan}>
              <Animated.View>
                <TapGestureHandler ref={this.tapRef} onHandlerStateChange={this.handleTap}>
                  <View style={styles.fullscreenView}>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            translateY: this.translateY as any,
                          },
                        ],
                      }}
                      onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        if (height === 0) {
                          return;
                        }
                        // We saved screen heigh to apply it when we come back to the same screen later.
                        this.handleContentHeightChange(height);
                      }}>
                      <Animated.View style={[{ minHeight: this.height }]}>
                        {this.props.children}
                      </Animated.View>
                    </Animated.View>
                  </View>
                </TapGestureHandler>
              </Animated.View>
            </PanGestureHandler>
            <Animated.Code
              exec={onChange(
                this.tapState,
                cond(eq(this.tapState, GestureState.BEGAN), stopClock(this.decayClock))
              )}
            />
            {this.props.callbackNode && (
              <Animated.Code
                exec={onChange(
                  this.translateMaster,
                  block([
                    set(
                      this.props.callbackNode,
                      sub(
                        1,
                        divide(
                          this.translateMaster,
                          this.state.snapPoints[this.state.snapPoints.length - 1]
                        )
                      )
                    ),
                  ])
                )}
              />
            )}
          </Animated.View>
        </Animated.View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  heightRuler: {
    height: '100%',
    width: 0,
    position: 'absolute',
  },
  masterView: {
    width: '100%',
    position: 'absolute',
    zIndex: 100,
  },
  container: {
    overflow: 'hidden',
    borderRadius: 10,
    maxWidth: 525,
    width: '100%',
    alignSelf: 'center',
  },
  fullscreenView: {
    width: '100%',
    height: '100%',
  },
});
