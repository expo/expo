package abi48_0_0.host.exp.exponent.modules.api.components.sharedelement;

enum RNSharedElementAnimation {
  MOVE(0),
  FADE(1),
  FADE_IN(2),
  FADE_OUT(3);

  private final int value;

  RNSharedElementAnimation(final int newValue) {
    value = newValue;
  }

  public int getValue() {
    return value;
  }
}

enum RNSharedElementResize {
  AUTO(0),
  STRETCH(1),
  CLIP(2),
  NONE(3);

  private final int value;

  RNSharedElementResize(final int newValue) {
    value = newValue;
  }

  public int getValue() {
    return value;
  }
}

enum RNSharedElementAlign {
  AUTO(0),
  LEFT_TOP(1),
  LEFT_CENTER(2),
  LEFT_BOTTOM(3),
  RIGHT_TOP(4),
  RIGHT_CENTER(5),
  RIGHT_BOTTOM(6),
  CENTER_TOP(7),
  CENTER_CENTER(8),
  CENTER_BOTTOM(9);

  private final int value;

  RNSharedElementAlign(final int newValue) {
    value = newValue;
  }

  public int getValue() {
    return value;
  }
}