import { WidgetFamily } from './WidgetFamily.type';

type WidgetConfiguration = {
  title: string;
  description?: string;
  parameters: Record<string, WidgetParameter>;
};

type WidgetIosConfig = {
  supportedFamilies?: WidgetFamily[];
  contentMarginsDisabled?: boolean;
  initialLayout?: string;
  configuration?: WidgetConfiguration;
};

type WidgetConfigBase = {
  name: string;
  displayName: string;
  description: string;
  // @deprecated: use `ios.supportedFamilies` instead.
  supportedFamilies?: WidgetFamily[];
  // @deprecated: use `ios.contentMarginsDisabled` instead.
  contentMarginsDisabled?: boolean;
  // @deprecated: use `ios.configuration` instead.
  configuration?: WidgetConfiguration;
  ios?: WidgetIosConfig | null;
  android?: {
    minWidth?: number;
    minHeight?: number;
    targetCellWidth?: number;
    targetCellHeight?: number;
    resizeMode?: 'none' | 'horizontal' | 'vertical' | 'both';
    initialLayout?: string;
  } | null;
};

export type WidgetConfig =
  | (WidgetConfigBase & {
      ios: WidgetIosConfig & { supportedFamilies: WidgetFamily[] };
    })
  | (WidgetConfigBase & {
      supportedFamilies: WidgetFamily[];
    });

export type WidgetParameterString = {
  title: string;
  type: 'string';
  default: string;
};
export type WidgetParameterNumber = {
  title: string;
  type: 'number';
  default: number;
};
export type WidgetParameterBoolean = {
  title: string;
  type: 'boolean';
  default: boolean;
};
export type WidgetParameterEnum = {
  title: string;
  type: 'enum';
  values: {
    name: string;
    value: string;
  }[];
  default: string;
};

export type WidgetParameter =
  | WidgetParameterString
  | WidgetParameterNumber
  | WidgetParameterBoolean
  | WidgetParameterEnum;
