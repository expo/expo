import {
  LayoutAnimationFunction,
  EntryAnimationsValues,
  ExitAnimationsValues,
  AnimationConfigFunction,
} from '../animationBuilder/commonTypes';

export const DefaultLayout: LayoutAnimationFunction = (values) => {
  'worklet';
  return {
    initialValues: {
      originX: values.targetOriginX,
      originY: values.targetOriginY,
      width: values.targetWidth,
      height: values.targetHeight,
    },
    animations: {},
  };
};

export const DefaultEntering: AnimationConfigFunction<EntryAnimationsValues> = (
  values
) => {
  'worklet';
  return {
    initialValues: {
      originX: values.targetOriginX,
      originY: values.targetOriginY,
      width: values.targetWidth,
      height: values.targetHeight,
    },
    animations: {},
  };
};

export const DefaultExiting: AnimationConfigFunction<ExitAnimationsValues> = (
  values
) => {
  'worklet';
  return {
    initialValues: {
      originX: values.currentOriginX,
      originY: values.currentOriginY,
      width: values.currentWidth,
      height: values.currentHeight,
    },
    animations: {},
  };
};
