import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  IPropertyPaneField,
  PropertyPaneFieldType
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import {
  betterDividerLineClassName,
  betterDividerRootClassName,
  BetterDividerProperties,
  createBetterDividerCss,
  createBetterDividerControlCss,
  createBetterDividerInstanceClass,
  createBetterDividerStyleVariables,
  defaultBetterDividerProperties,
  normalizeBetterDividerProperties,
  parseBetterDividerPropertiesFromCss,
  syncBetterDividerCssFromProperties
} from '../../shared/divider';
import { BetterDividerPropertyPane } from './components/BetterDividerPropertyPane';

export interface IBetterDividerWebPartProps extends BetterDividerProperties {}

interface IPropertyPaneCustomFieldProps {
  key: string;
  context?: unknown;
  onRender: (
    domElement: HTMLElement,
    context?: unknown,
    changeCallback?: (targetProperty?: string, newValue?: unknown, isValidEntry?: boolean) => void
  ) => void;
  onDispose?: (domElement: HTMLElement, context?: unknown) => void;
}

export default class BetterDividerWebPart extends BaseClientSideWebPart<IBetterDividerWebPartProps> {
  public render(): void {
    const properties = parseBetterDividerPropertiesFromCss(
      this.properties.customCss || createBetterDividerControlCss(this.properties),
      this.properties
    );
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    const root = document.createElement('div');
    const line = document.createElement('div');

    style.textContent = createBetterDividerCss(properties.customCss);
    root.className = betterDividerRootClassName(properties);
    Object.entries(createBetterDividerStyleVariables(properties)).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });

    line.className = betterDividerLineClassName(properties.lineStyle);
    line.setAttribute('role', 'separator');
    line.setAttribute('aria-orientation', 'horizontal');

    root.appendChild(line);
    shadow.appendChild(style);
    shadow.appendChild(root);
    this.domElement.innerHTML = '';
    this.domElement.appendChild(host);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected onInit(): Promise<void> {
    const properties = normalizeBetterDividerProperties({
      color: this.properties.color || defaultBetterDividerProperties.color,
      thickness: this.properties.thickness || defaultBetterDividerProperties.thickness,
      width: this.properties.width || defaultBetterDividerProperties.width,
      alignment: this.properties.alignment || defaultBetterDividerProperties.alignment,
      lineStyle: this.properties.lineStyle || defaultBetterDividerProperties.lineStyle,
      rounded: Boolean(this.properties.rounded),
      spacing: this.properties.spacing === undefined ? defaultBetterDividerProperties.spacing : this.properties.spacing,
      instanceClassName: this.properties.instanceClassName || createBetterDividerInstanceClass(this._getInstanceClassSeed()),
      customCss: this.properties.customCss
    });

    this._assignProperties(properties);
    this.properties.customCss = syncBetterDividerCssFromProperties(properties.customCss, properties);

    return Promise.resolve();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (!isBetterDividerProperty(propertyPath)) {
      return;
    }

    if (propertyPath === 'customCss' && typeof newValue === 'string') {
      const properties = parseBetterDividerPropertiesFromCss(newValue, this.properties);
      this._assignProperties(properties);
      this.properties.customCss = newValue;
      this.render();
      return;
    }

    const properties = normalizeBetterDividerProperties(this.properties);
    this._assignProperties(properties);
    this.properties.customCss = syncBetterDividerCssFromProperties(this.properties.customCss, properties);
    this.render();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupFields: [this._createCustomPropertyPaneField()]
            }
          ]
        }
      ]
    };
  }

  private _createCustomPropertyPaneField(): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
    return createPropertyPaneCustomField({
      key: 'better-divider-custom-property-pane',
      onRender: (
        domElement: HTMLElement,
        _context?: unknown,
        changeCallback?: (targetProperty?: string, newValue?: unknown, isValidEntry?: boolean) => void
      ): void => {
        ReactDom.render(
          React.createElement(BetterDividerPropertyPane, {
            properties: normalizeBetterDividerProperties(this.properties),
            onChange: (properties): void => this._applyPropertyPaneProperties(properties, changeCallback)
          }),
          domElement
        );
      },
      onDispose: (domElement: HTMLElement): void => {
        ReactDom.unmountComponentAtNode(domElement);
      }
    });
  }

  private _applyPropertyPaneProperties(
    properties: BetterDividerProperties,
    changeCallback?: (targetProperty?: string, newValue?: unknown, isValidEntry?: boolean) => void
  ): void {
    const previous = normalizeBetterDividerProperties(this.properties);
    const normalized = normalizeBetterDividerProperties(properties);
    this._assignProperties(normalized);
    this.properties.customCss = normalized.customCss;

    ([
      'color',
      'thickness',
      'width',
      'alignment',
      'lineStyle',
      'rounded',
      'spacing',
      'instanceClassName',
      'customCss'
    ] as Array<keyof BetterDividerProperties>).forEach((propertyPath) => {
      if (previous[propertyPath] !== normalized[propertyPath]) {
        changeCallback?.(propertyPath, normalized[propertyPath], true);
      }
    });

    this.render();
  }

  private _getInstanceClassSeed(): string {
    return (
      (this as unknown as { instanceId?: string }).instanceId ||
      (this.context as unknown as { instanceId?: string }).instanceId ||
      `${this.context.manifest.id}-${this.context.manifest.alias}`
    );
  }

  private _assignProperties(properties: BetterDividerProperties): void {
    this.properties.color = properties.color;
    this.properties.thickness = properties.thickness;
    this.properties.width = properties.width;
    this.properties.alignment = properties.alignment;
    this.properties.lineStyle = properties.lineStyle;
    this.properties.rounded = properties.rounded;
    this.properties.spacing = properties.spacing;
    this.properties.instanceClassName = properties.instanceClassName;
  }
}

function isBetterDividerProperty(propertyPath: string): boolean {
  return (
    propertyPath === 'color' ||
    propertyPath === 'thickness' ||
    propertyPath === 'width' ||
    propertyPath === 'alignment' ||
    propertyPath === 'lineStyle' ||
    propertyPath === 'rounded' ||
    propertyPath === 'spacing' ||
    propertyPath === 'instanceClassName' ||
    propertyPath === 'customCss'
  );
}

function createPropertyPaneCustomField(
  properties: IPropertyPaneCustomFieldProps
): IPropertyPaneField<IPropertyPaneCustomFieldProps> {
  return {
    type: PropertyPaneFieldType.Custom,
    targetProperty: 'customCss',
    properties
  };
}
