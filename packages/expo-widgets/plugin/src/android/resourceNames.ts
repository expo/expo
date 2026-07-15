import { WidgetConfig } from '../types/WidgetConfig.type';

const toAndroidResourceName = (name: string): string => {
  const resourceName = name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return /^[a-z]/.test(resourceName) ? resourceName : `widget_${resourceName}`;
};

export const assertAndroidWidgetName = (widget: WidgetConfig): void => {
  if (typeof widget.name !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(widget.name)) {
    throw new Error(
      `Invalid widget name ${JSON.stringify(widget.name)}: Android widget names must be Kotlin identifiers.`
    );
  }
};

export const getProviderClassName = (widget: WidgetConfig): string => {
  assertAndroidWidgetName(widget);
  return `${widget.name}Provider`;
};

export const getWidgetInfoResourceName = (widget: WidgetConfig): string => {
  return `${toAndroidResourceName(widget.name)}_info`;
};

export const getWidgetDisplayNameResourceName = (widget: WidgetConfig): string => {
  return `${toAndroidResourceName(widget.name)}_display_name`;
};

export const getWidgetDescriptionResourceName = (widget: WidgetConfig): string => {
  return `${toAndroidResourceName(widget.name)}_description`;
};
