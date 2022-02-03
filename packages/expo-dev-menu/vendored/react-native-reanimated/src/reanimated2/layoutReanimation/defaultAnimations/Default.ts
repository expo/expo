import {
  LayoutAnimationFunction,
  EntryExitAnimationFunction,
} from '../animationBuilder/commonTypes';

export const DefaultLayout: LayoutAnimationFunction = (values) => {
  'worklet';
  return {
    initialValues: {
      originX: values.originX,
      originY: values.originY,
      width: values.width,
      height: values.height,
    },
    animations: {},
  };
};

export const DefaultEntering: EntryExitAnimationFunction = (targetValues) => {
  'worklet';
  return {
    initialValues: {
      originX: targetValues.originX,
      originY: targetValues.originY,
      width: targetValues.width,
      height: targetValues.height,
    },
    animations: {},
  };
};

export const DefaultExiting: EntryExitAnimationFunction = (startValues) => {
  'worklet';
  return {
    initialValues: {
      originX: startValues.originX,
      originY: startValues.originY,
      width: startValues.width,
      height: startValues.height,
    },
    animations: {},
  };
};
