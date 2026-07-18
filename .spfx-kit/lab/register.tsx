import * as React from 'react';
import type {
  LabPropertyBag,
  LabRenderProps,
  LabWebPart,
  LabWebPartRegistry
} from '@spfx-kit/spfx-lab-runtime';
import {
  betterDividerLineClassName,
  betterDividerRootClassName,
  BetterDividerProperties,
  createBetterDividerCss,
  createBetterDividerControlCss,
  createBetterDividerCssTargetComment,
  createBetterDividerCssTargets,
  createBetterDividerInstanceClass,
  createBetterDividerStyleVariables,
  defaultBetterDividerProperties,
  normalizeBetterDividerInstanceClassName,
  normalizeBetterDividerProperties,
  parseBetterDividerPropertiesFromCss,
  renameBetterDividerInstanceClassInCss,
  syncBetterDividerCssFromProperties
} from '../../src/shared/divider';
import './betterDividerLab.css';

type BetterDividerLabProps = LabPropertyBag & BetterDividerProperties;

const labInstanceClassName = createBetterDividerInstanceClass('better-divider-spfx:better-divider:lab');

const defaultProps: BetterDividerLabProps = {
  ...defaultBetterDividerProperties,
  instanceClassName: labInstanceClassName,
  customCss: createBetterDividerControlCss({
    ...defaultBetterDividerProperties,
    instanceClassName: labInstanceClassName
  })
};

const BetterDividerLabPreview: React.FunctionComponent<LabRenderProps<BetterDividerLabProps>> = ({ props }) => {
  const divider = props.customCss
    ? parseBetterDividerPropertiesFromCss(props.customCss, props)
    : normalizeBetterDividerProperties(props);
  const rootStyle: React.CSSProperties = {
    ...createBetterDividerStyleVariables(divider)
  };

  return (
    <section className="better-divider-lab-preview">
      <style>{createBetterDividerCss(divider.customCss)}</style>
      <div className={`${betterDividerRootClassName(divider)} better-divider-lab-web-part`} style={rootStyle}>
        <div className={betterDividerLineClassName(divider.lineStyle)} role="separator" aria-orientation="horizontal" />
      </div>
    </section>
  );
};

const webPart: LabWebPart<BetterDividerLabProps> = {
  id: 'better-divider-spfx:better-divider',
  appId: 'better-divider-spfx',
  title: 'Better Divider',
  description: 'A configurable SharePoint divider with color, width, stroke, spacing, and rounded ends.',
  defaultProps,
  controls: [
    {
      type: 'color',
      name: 'color',
      label: 'Color',
      getPatch: (value, values) => createControlPatch('color', value, values)
    },
    {
      type: 'select',
      name: 'lineStyle',
      label: 'Line style',
      inlineGroup: 'divider-line',
      options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' }
      ],
      getPatch: (value, values) => createControlPatch('lineStyle', value, values)
    },
    {
      type: 'number',
      name: 'thickness',
      label: 'Thickness',
      inlineGroup: 'divider-line',
      min: 1,
      max: 16,
      step: 1,
      unit: 'px',
      getPatch: (value, values) => createControlPatch('thickness', value, values)
    },
    {
      type: 'toggle',
      name: 'rounded',
      label: 'Rounded ends',
      inlineGroup: 'divider-shape',
      getPatch: (value, values) => createControlPatch('rounded', value, values)
    },
    {
      type: 'radio',
      name: 'alignment',
      label: 'Alignment',
      inlineGroup: 'divider-shape',
      options: [
        { label: 'Left', value: 'left', icon: 'text-align-left' },
        { label: 'Center', value: 'center', icon: 'text-align-center' },
        { label: 'Right', value: 'right', icon: 'text-align-right' }
      ],
      getPatch: (value, values) => createControlPatch('alignment', value, values)
    },
    {
      type: 'number',
      name: 'width',
      label: 'Width',
      inlineGroup: 'divider-size',
      min: 10,
      max: 100,
      step: 5,
      unit: '%',
      getPatch: (value, values) => createControlPatch('width', value, values)
    },
    {
      type: 'number',
      name: 'spacing',
      label: 'Vertical spacing',
      inlineGroup: 'divider-size',
      min: 0,
      max: 64,
      step: 4,
      unit: 'px',
      getPatch: (value, values) => createControlPatch('spacing', value, values)
    },
    {
      type: 'cssEditor',
      name: 'customCss',
      label: 'Custom CSS/SCSS',
      minHeight: 190,
      getValue: (values) => String(values.customCss || ''),
      getPatch: (value, values) => createCssPatch(String(value || ''), values),
      getTargets: (values) => createBetterDividerCssTargets(normalizeBetterDividerProperties(values)),
      getTargetComment: (values) =>
        createBetterDividerCssTargetComment(normalizeBetterDividerProperties(values).instanceClassName),
      getTargetRenamePatch: (_target, nextSelector, nextValue, values) =>
        createInstanceClassRenamePatch(nextSelector, nextValue, values)
    }
  ],
  supportedBreakpoints: ['one-column', 'two-third', 'one-half', 'one-third', 'mobile'],
  fixtures: {},
  render: BetterDividerLabPreview
};

export function register(registry: LabWebPartRegistry): void {
  registry.register(webPart);
}

function createControlPatch(
  name: keyof BetterDividerProperties,
  value: LabPropertyBag[string],
  values: LabPropertyBag
): LabPropertyBag {
  const nextProperties = normalizeBetterDividerProperties({
    ...values,
    [name]: value
  });
  return {
    ...nextProperties,
    customCss: syncBetterDividerCssFromProperties(String(values.customCss || ''), nextProperties)
  };
}

function createCssPatch(value: string, values: LabPropertyBag): LabPropertyBag {
  const nextProperties = parseBetterDividerPropertiesFromCss(value, values);
  return {
    ...nextProperties,
    customCss: value
  };
}

function createInstanceClassRenamePatch(
  nextSelector: string,
  nextValue: string,
  values: LabPropertyBag
): LabPropertyBag {
  const currentProperties = normalizeBetterDividerProperties(values);
  const nextInstanceClassName = normalizeBetterDividerInstanceClassName(
    nextSelector,
    currentProperties.instanceClassName
  );
  const customCss = renameBetterDividerInstanceClassInCss(
    nextValue,
    currentProperties.instanceClassName,
    nextInstanceClassName
  );
  const nextProperties = parseBetterDividerPropertiesFromCss(customCss, {
    ...values,
    instanceClassName: nextInstanceClassName
  });

  return {
    ...nextProperties,
    instanceClassName: nextInstanceClassName,
    customCss
  };
}
