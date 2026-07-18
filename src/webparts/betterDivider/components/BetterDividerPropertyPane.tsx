import * as React from 'react';
import {
  Button,
  ColorArea,
  ColorPicker,
  ColorSlider,
  FluentProvider,
  IdPrefixProvider,
  Input,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  webLightTheme
} from '@fluentui/react-components';

import {
  BetterDividerAlignment,
  BetterDividerLineStyle,
  BetterDividerProperties,
  createBetterDividerCssTargetComment,
  createBetterDividerCssTargets,
  normalizeBetterDividerInstanceClassName,
  normalizeBetterDividerProperties,
  parseBetterDividerPropertiesFromCss,
  renameBetterDividerInstanceClassInCss,
  syncBetterDividerCssFromProperties
} from '../../../shared/divider';
import {
  SourceEditorField,
  SourceEditorFieldConfig,
  SourceEditorTarget
} from '../../../vendor/source-editor/SourceEditorField';

export interface BetterDividerPropertyPaneProps {
  properties: BetterDividerProperties;
  onChange: (properties: BetterDividerProperties) => void;
}

const fluentIdPrefix = 'better-divider-';
const betterDividerScssEditorConfiguration: SourceEditorFieldConfig = {
  inlineHeight: 190,
  inlineModelPath: 'better-divider.custom.scss',
  floatingModelPath: 'better-divider.custom.floating.scss',
  toolbarLabel: 'SCSS target shortcuts'
};

export const BetterDividerPropertyPane: React.FunctionComponent<BetterDividerPropertyPaneProps> = (props) => {
  const [values, setValues] = React.useState<BetterDividerProperties>(() => normalizeBetterDividerProperties(props.properties));

  React.useEffect(() => {
    setValues(normalizeBetterDividerProperties(props.properties));
  }, [props.properties]);

  const applyValues = (nextValues: BetterDividerProperties): void => {
    setValues(nextValues);
    props.onChange(nextValues);
  };

  const applyControlPatch = (patch: Partial<BetterDividerProperties>): void => {
    const nextValues = normalizeBetterDividerProperties({ ...values, ...patch });
    nextValues.customCss = syncBetterDividerCssFromProperties(values.customCss, nextValues);
    applyValues(nextValues);
  };

  const applyCustomCss = (customCss: string): void => {
    const parsed = parseBetterDividerPropertiesFromCss(customCss, values);
    applyValues({ ...parsed, customCss });
  };

  const renameTarget = (_target: SourceEditorTarget, nextSelector: string, nextValue: string): void => {
    const nextInstanceClassName = normalizeBetterDividerInstanceClassName(nextSelector, values.instanceClassName);
    const customCss = renameBetterDividerInstanceClassInCss(nextValue, values.instanceClassName, nextInstanceClassName);
    const parsed = parseBetterDividerPropertiesFromCss(customCss, {
      ...values,
      instanceClassName: nextInstanceClassName
    });

    applyValues({
      ...parsed,
      customCss,
      instanceClassName: nextInstanceClassName
    });
  };

  return (
    <IdPrefixProvider value={fluentIdPrefix}>
      <FluentProvider className="bd-property-pane__provider" theme={webLightTheme}>
        <div className="bd-property-pane">
          <style>{propertyPaneCss}</style>
          <section className="bd-property-pane__section">
            <ColorField label="Color" value={values.color} onChange={(color) => applyControlPatch({ color })} />
            <div className="bd-property-pane__field-row">
              <SelectField
                label="Line style"
                options={[
                  { label: 'Solid', value: 'solid' },
                  { label: 'Dashed', value: 'dashed' },
                  { label: 'Dotted', value: 'dotted' }
                ]}
                value={values.lineStyle}
                onChange={(lineStyle) => applyControlPatch({ lineStyle })}
              />
              <NumberField
                label="Thickness"
                max={16}
                min={1}
                step={1}
                unit="px"
                value={values.thickness}
                onChange={(thickness) => applyControlPatch({ thickness })}
              />
            </div>
            <div className="bd-property-pane__field-row bd-property-pane__field-row--shape">
              <CheckboxField
                checked={values.rounded}
                label="Rounded ends"
                onChange={(rounded) => applyControlPatch({ rounded })}
              />
              <AlignmentField value={values.alignment} onChange={(alignment) => applyControlPatch({ alignment })} />
            </div>
            <div className="bd-property-pane__field-row">
              <NumberField
                label="Width"
                max={100}
                min={10}
                step={5}
                unit="%"
                value={values.width}
                onChange={(width) => applyControlPatch({ width })}
              />
              <NumberField
                label="Vertical spacing"
                max={64}
                min={0}
                step={4}
                unit="px"
                value={values.spacing}
                onChange={(spacing) => applyControlPatch({ spacing })}
              />
            </div>
            <SourceEditorField
              configuration={betterDividerScssEditorConfiguration}
              label="Custom CSS/SCSS"
              language="scss"
              targetComment={createBetterDividerCssTargetComment(values.instanceClassName)}
              targets={createBetterDividerCssTargets(values)}
              value={values.customCss}
              onChange={applyCustomCss}
              onTargetRename={renameTarget}
            />
          </section>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField: React.FunctionComponent<ColorFieldProps> = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const pickerValue = normalizeHexColor(props.value);
  const hslColor = hexToHsl(pickerValue);

  const onHslChange = (channel: keyof HslColor, nextValue: string): void => {
    const parsedValue = Number(nextValue);
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    props.onChange(
      hslToHex({
        ...hslColor,
        [channel]: channel === 'h' ? clampHue(parsedValue) : clampPercentage(parsedValue)
      })
    );
  };

  return (
    <div className="bd-property-pane__field">
      <span className="bd-property-pane__label">{props.label}</span>
      <div className="bd-property-pane__color-row">
        <Popover
          open={isOpen}
          positioning={{ position: 'below', align: 'start' }}
          withArrow
          onOpenChange={(_event, data) => setIsOpen(data.open)}
        >
          <PopoverTrigger disableButtonEnhancement>
            <Button
              appearance="outline"
              aria-label={`Open ${props.label} color picker`}
              className="bd-property-pane__swatch-button"
              type="button"
              onClick={() => setIsOpen((currentValue) => !currentValue)}
            >
              <span aria-hidden="true" className="bd-property-pane__swatch" style={{ backgroundColor: pickerValue }} />
            </Button>
          </PopoverTrigger>
          <PopoverSurface className="bd-property-pane__color-popover">
            <ColorPicker color={hexToHsv(pickerValue)} onColorChange={(_event, data) => props.onChange(hsvToHex(data.color))}>
              <ColorArea aria-label={`${props.label} saturation and brightness`} />
              <ColorSlider aria-label={`${props.label} hue`} />
              <div className="bd-property-pane__hsl" aria-label={`${props.label} HSL values`}>
                <label className="bd-property-pane__hsl-field">
                  <span>H</span>
                  <Input
                    aria-label={`${props.label} HSL hue`}
                    max={360}
                    min={0}
                    step={1}
                    type="number"
                    value={String(hslColor.h)}
                    onChange={(event) => onHslChange('h', event.currentTarget.value)}
                  />
                </label>
                <label className="bd-property-pane__hsl-field">
                  <span>S</span>
                  <Input
                    aria-label={`${props.label} HSL saturation`}
                    contentAfter={<span className="bd-property-pane__number-unit">%</span>}
                    max={100}
                    min={0}
                    step={1}
                    type="number"
                    value={String(hslColor.s)}
                    onChange={(event) => onHslChange('s', event.currentTarget.value)}
                  />
                </label>
                <label className="bd-property-pane__hsl-field">
                  <span>L</span>
                  <Input
                    aria-label={`${props.label} HSL lightness`}
                    contentAfter={<span className="bd-property-pane__number-unit">%</span>}
                    max={100}
                    min={0}
                    step={1}
                    type="number"
                    value={String(hslColor.l)}
                    onChange={(event) => onHslChange('l', event.currentTarget.value)}
                  />
                </label>
              </div>
            </ColorPicker>
          </PopoverSurface>
        </Popover>
        <Input
          aria-label={`${props.label} value`}
          className="bd-property-pane__input bd-property-pane__input--text"
          value={props.value}
          onChange={(event) => props.onChange(event.currentTarget.value)}
        />
      </div>
    </div>
  );
};

interface SelectFieldProps<TValue extends string> {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}

function SelectField<TValue extends BetterDividerLineStyle>(props: SelectFieldProps<TValue>): JSX.Element {
  return (
    <label className="bd-property-pane__field">
      <span className="bd-property-pane__label">{props.label}</span>
      <span className="bd-property-pane__select-wrap">
        <select
          className="bd-property-pane__input bd-property-pane__select"
          value={props.value}
          onChange={(event) => props.onChange(event.currentTarget.value as TValue)}
        >
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  max: number;
  min: number;
  step: number;
  unit: string;
  value: number;
  onChange: (value: number) => void;
}

const NumberField: React.FunctionComponent<NumberFieldProps> = (props) => (
  <label className="bd-property-pane__field">
    <span className="bd-property-pane__label">{props.label}</span>
    <span className="bd-property-pane__number-wrap">
      <input
        aria-label={`${props.label} (${props.unit})`}
        className="bd-property-pane__input bd-property-pane__input--number"
        max={props.max}
        min={props.min}
        step={props.step}
        type="number"
        value={props.value}
        onChange={(event) => {
          const value = Number(event.currentTarget.value);
          if (Number.isFinite(value)) {
            props.onChange(value);
          }
        }}
      />
      <span className="bd-property-pane__unit">{props.unit}</span>
    </span>
  </label>
);

interface CheckboxFieldProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

const CheckboxField: React.FunctionComponent<CheckboxFieldProps> = (props) => (
  <label className="bd-property-pane__checkbox-field">
    <input
      checked={props.checked}
      className="bd-property-pane__checkbox"
      type="checkbox"
      onChange={(event) => props.onChange(event.currentTarget.checked)}
    />
    <span>{props.label}</span>
  </label>
);

interface AlignmentFieldProps {
  value: BetterDividerAlignment;
  onChange: (value: BetterDividerAlignment) => void;
}

const alignmentOptions: Array<{ label: string; value: BetterDividerAlignment }> = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

const AlignmentField: React.FunctionComponent<AlignmentFieldProps> = (props) => (
  <div className="bd-property-pane__field bd-property-pane__alignment-field">
    <span className="bd-property-pane__label">Alignment</span>
    <div className="bd-property-pane__icon-group" role="radiogroup" aria-label="Alignment">
      {alignmentOptions.map((option) => (
        <button
          aria-checked={props.value === option.value}
          aria-label={option.label}
          className={`bd-property-pane__icon-button ${
            props.value === option.value ? 'bd-property-pane__icon-button--selected' : ''
          }`}
          key={option.value}
          role="radio"
          title={option.label}
          type="button"
          onClick={() => props.onChange(option.value)}
        >
          <AlignmentIcon value={option.value} />
        </button>
      ))}
    </div>
  </div>
);

interface AlignmentIconProps {
  value: BetterDividerAlignment;
}

const AlignmentIcon: React.FunctionComponent<AlignmentIconProps> = (props) => (
  <span className={`bd-property-pane__align-icon bd-property-pane__align-icon--${props.value}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

interface HsvColor {
  h: number;
  s: number;
  v: number;
  a?: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

function normalizeHexColor(value: string): string {
  const trimmed = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [, red, green, blue] = trimmed.toLowerCase();
    return `#${red}${red}${green}${green}${blue}${blue}`;
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }
  if (/^[0-9a-f]{3}$/i.test(trimmed)) {
    const [red, green, blue] = trimmed.toLowerCase();
    return `#${red}${red}${green}${green}${blue}${blue}`;
  }
  return '#8a8886';
}

function hexToHsv(hex: string): HsvColor {
  const normalized = normalizeHexColor(hex);
  const red = parseInt(normalized.slice(1, 3), 16) / 255;
  const green = parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    h: Math.round(hue < 0 ? hue + 360 : hue),
    s: max === 0 ? 0 : delta / max,
    v: max,
    a: 1
  };
}

function hexToHsl(hex: string): HslColor {
  const normalized = normalizeHexColor(hex);
  const red = parseInt(normalized.slice(1, 3), 16) / 255;
  const green = parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    h: clampHue(hue < 0 ? hue + 360 : hue),
    s: clampPercentage(saturation * 100),
    l: clampPercentage(lightness * 100)
  };
}

function hslToHex(color: HslColor): string {
  const hue = clampHue(color.h) / 360;
  const saturation = clampPercentage(color.s) / 100;
  const lightness = clampPercentage(color.l) / 100;

  if (saturation === 0) {
    return `#${toHexChannel(lightness)}${toHexChannel(lightness)}${toHexChannel(lightness)}`;
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return `#${toHexChannel(hueToRgb(p, q, hue + 1 / 3))}${toHexChannel(hueToRgb(p, q, hue))}${toHexChannel(hueToRgb(p, q, hue - 1 / 3))}`;
}

function hsvToHex(color: HsvColor): string {
  const hue = (((color.h || 0) % 360) + 360) % 360;
  const saturation = clampUnit(color.s);
  const value = clampUnit(color.v);
  const chroma = value * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = x;
  } else if (hue < 120) {
    red = x;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = x;
  } else if (hue < 240) {
    green = x;
    blue = chroma;
  } else if (hue < 300) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return `#${toHexChannel(red + m)}${toHexChannel(green + m)}${toHexChannel(blue + m)}`;
}

function clampUnit(value: number | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(Math.max(parsed, 0), 1);
}

function clampHue(value: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(parsed), 0), 360);
}

function clampPercentage(value: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(parsed), 0), 100);
}

function hueToRgb(p: number, q: number, value: number): number {
  let normalizedValue = value;

  if (normalizedValue < 0) {
    normalizedValue += 1;
  }
  if (normalizedValue > 1) {
    normalizedValue -= 1;
  }
  if (normalizedValue < 1 / 6) {
    return p + (q - p) * 6 * normalizedValue;
  }
  if (normalizedValue < 1 / 2) {
    return q;
  }
  if (normalizedValue < 2 / 3) {
    return p + (q - p) * (2 / 3 - normalizedValue) * 6;
  }

  return p;
}

function toHexChannel(value: number): string {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
}

const propertyPaneCss = `.bd-property-pane__provider {
  font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.bd-property-pane {
  box-sizing: border-box;
  color: #242424;
  font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.bd-property-pane *,
.bd-property-pane *::before,
.bd-property-pane *::after {
  box-sizing: border-box;
}

.bd-property-pane__section {
  display: grid;
  gap: 12px;
  padding: 0 0 16px;
  border-bottom: 1px solid #edebe9;
}

.bd-property-pane__field {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.bd-property-pane__field-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: 8px;
}

.bd-property-pane__field-row--shape {
  align-items: end;
}

.bd-property-pane__label {
  color: #424242;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}

.bd-property-pane__input {
  width: 100%;
  min-width: 0;
  min-height: 32px;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  padding: 5px 8px;
  color: #242424;
  background: #ffffff;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
}

.bd-property-pane__input:focus,
.bd-property-pane__select:focus,
.bd-property-pane__checkbox:focus-visible,
.bd-property-pane__icon-button:focus-visible,
.bd-property-pane__swatch-button:focus-within {
  border-color: #0f6cbd;
  outline: 2px solid rgb(15 108 189 / 24%);
  outline-offset: 1px;
}

.bd-property-pane__color-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.bd-property-pane__swatch-button {
  position: relative;
  display: inline-flex !important;
  width: 32px !important;
  min-width: 32px !important;
  min-inline-size: 32px !important;
  height: 32px;
  inline-size: 32px !important;
  block-size: 32px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  padding: 0 !important;
  background: #ffffff;
  cursor: pointer;
  line-height: 0;
}

.bd-property-pane__swatch {
  display: block;
  width: 24px;
  height: 24px;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 45%);
}

.bd-property-pane__color-popover {
  box-sizing: border-box;
  display: grid;
  width: min(240px, calc(100vw - 32px));
  gap: 12px;
  padding: 12px;
}

.bd-property-pane__color-popover [class~="fui-ColorPicker"] {
  display: grid;
  gap: 12px;
}

.bd-property-pane__color-popover [class~="fui-ColorArea"] {
  width: 100%;
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  height: auto;
}

.bd-property-pane__color-popover [class~="fui-ColorSlider"] {
  width: 100%;
  min-width: 0;
}

.bd-property-pane__hsl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.bd-property-pane__hsl-field {
  display: grid;
  min-width: 0;
  gap: 4px;
  color: #616161;
  font-size: 11px;
  font-weight: 600;
  line-height: 14px;
}

.bd-property-pane__hsl-field [class~="fui-Input"] {
  width: 100%;
  min-width: 0;
}

.bd-property-pane__hsl-field input {
  text-align: right;
}

.bd-property-pane__number-unit {
  color: #707070;
  font-size: 11px;
}

.bd-property-pane__select-wrap,
.bd-property-pane__number-wrap {
  position: relative;
  display: block;
  min-width: 0;
}

.bd-property-pane__select {
  appearance: none;
  padding-right: 30px;
}

.bd-property-pane__select-wrap::after {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid #616161;
  border-bottom: 1.5px solid #616161;
  content: "";
  pointer-events: none;
  transform: translateY(-70%) rotate(45deg);
}

.bd-property-pane__input--number {
  padding-right: 34px;
}

.bd-property-pane__unit {
  position: absolute;
  top: 50%;
  right: 9px;
  color: #616161;
  font-size: 12px;
  line-height: 1;
  pointer-events: none;
  transform: translateY(-50%);
}

.bd-property-pane__checkbox-field {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  color: #616161;
  font-size: 13px;
  line-height: 20px;
}

.bd-property-pane__checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #0f6cbd;
}

.bd-property-pane__alignment-field {
  justify-items: start;
}

.bd-property-pane__icon-group {
  display: inline-flex;
  gap: 2px;
}

.bd-property-pane__icon-button {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0;
  color: #616161;
  background: transparent;
  cursor: pointer;
}

.bd-property-pane__icon-button:hover {
  background: #f5f5f5;
}

.bd-property-pane__icon-button--selected {
  color: #0f6cbd;
  background: #e8ebed;
}

.bd-property-pane__align-icon {
  display: grid;
  width: 18px;
  gap: 3px;
}

.bd-property-pane__align-icon span {
  display: block;
  height: 1.5px;
  border-radius: 999px;
  background: currentColor;
}

.bd-property-pane__align-icon--left span:nth-child(1),
.bd-property-pane__align-icon--center span:nth-child(1),
.bd-property-pane__align-icon--right span:nth-child(1) {
  width: 16px;
}

.bd-property-pane__align-icon--left span:nth-child(2),
.bd-property-pane__align-icon--right span:nth-child(2) {
  width: 10px;
}

.bd-property-pane__align-icon--left span:nth-child(3),
.bd-property-pane__align-icon--center span:nth-child(3),
.bd-property-pane__align-icon--right span:nth-child(3) {
  width: 14px;
}

.bd-property-pane__align-icon--left span {
  justify-self: start;
}

.bd-property-pane__align-icon--center span {
  justify-self: center;
}

.bd-property-pane__align-icon--right span {
  justify-self: end;
}

@media (max-width: 260px) {
  .bd-property-pane__field-row,
  .bd-property-pane__field-row--shape {
    grid-template-columns: 1fr;
  }
}`;
