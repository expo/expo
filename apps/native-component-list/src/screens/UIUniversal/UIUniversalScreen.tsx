import { optionalRequire } from '../../navigation/routeBuilder';
import ComponentListScreen, {
  componentScreensToListElements,
  type ListElement,
} from '../ComponentListScreen';

const SCREEN_NAME_PREFIX = 'UI Universal ';

export const UIUniversalScreens = [
  {
    name: `${SCREEN_NAME_PREFIX}Button`,
    route: 'ui-universal/button',
    options: { title: 'Button' },
    getComponent() {
      return optionalRequire(() => require('./ButtonScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Text`,
    route: 'ui-universal/text',
    options: { title: 'Text' },
    getComponent() {
      return optionalRequire(() => require('./TextScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Column`,
    route: 'ui-universal/column',
    options: { title: 'Column' },
    getComponent() {
      return optionalRequire(() => require('./ColumnScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Row`,
    route: 'ui-universal/row',
    options: { title: 'Row' },
    getComponent() {
      return optionalRequire(() => require('./RowScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}ScrollView`,
    route: 'ui-universal/scrollview',
    options: { title: 'ScrollView' },
    getComponent() {
      return optionalRequire(() => require('./ScrollViewScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Switch`,
    route: 'ui-universal/switch',
    options: { title: 'Switch' },
    getComponent() {
      return optionalRequire(() => require('./SwitchScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Slider`,
    route: 'ui-universal/slider',
    options: { title: 'Slider' },
    getComponent() {
      return optionalRequire(() => require('./SliderScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Checkbox`,
    route: 'ui-universal/checkbox',
    options: { title: 'Checkbox' },
    getComponent() {
      return optionalRequire(() => require('./CheckboxScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}BottomSheet`,
    route: 'ui-universal/bottom-sheet',
    options: { title: 'BottomSheet' },
    getComponent() {
      return optionalRequire(() => require('./BottomSheetScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}FieldGroup`,
    route: 'ui-universal/field-group',
    options: { title: 'FieldGroup' },
    getComponent() {
      return optionalRequire(() => require('./FieldGroupScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Spacer`,
    route: 'ui-universal/spacer',
    options: { title: 'Spacer' },
    getComponent() {
      return optionalRequire(() => require('./SpacerScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}Icon`,
    route: 'ui-universal/icon',
    options: { title: 'Icon' },
    getComponent() {
      return optionalRequire(() => require('./IconScreen'));
    },
  },
  {
    name: `${SCREEN_NAME_PREFIX}TextInput`,
    route: 'ui-universal/text-input',
    options: { title: 'TextInput' },
    getComponent() {
      return optionalRequire(() => require('./TextInputScreen'));
    },
  },
];

function stripPrefix(elements: ListElement[]): ListElement[] {
  return elements.map((el) => ({
    ...el,
    name: el.name.replace(SCREEN_NAME_PREFIX, ''),
  }));
}

export default function UIUniversalScreen() {
  const apis = stripPrefix(componentScreensToListElements(UIUniversalScreens));
  return <ComponentListScreen apis={apis} sort />;
}

UIUniversalScreen.navigationOptions = {
  title: 'Expo UI (Universal)',
};
