export type BetterDividerAlignment = 'left' | 'center' | 'right';
export type BetterDividerLineStyle = 'solid' | 'dashed' | 'dotted';

export interface BetterDividerProperties {
  color: string;
  thickness: number;
  width: number;
  alignment: BetterDividerAlignment;
  lineStyle: BetterDividerLineStyle;
  rounded: boolean;
  spacing: number;
  instanceClassName: string;
  customCss: string;
}

export interface BetterDividerCssTarget {
  label: string;
  selector: string;
  snippet: string;
  editable?: boolean;
  renameLabel?: string;
}

export const defaultBetterDividerProperties: BetterDividerProperties = {
  color: '#8a8886',
  thickness: 1,
  width: 100,
  alignment: 'center',
  lineStyle: 'solid',
  rounded: false,
  spacing: 16,
  instanceClassName: createBetterDividerInstanceClass('better-divider-default'),
  customCss: ''
};

const betterDividerCssTargetCommentMarker = 'Better Divider SCSS targets';

export function normalizeBetterDividerProperties(
  properties: Partial<BetterDividerProperties> = {}
): BetterDividerProperties {
  return {
    color: normalizeColor(properties.color, defaultBetterDividerProperties.color),
    thickness: normalizeRangeNumber(properties.thickness, 1, 16, defaultBetterDividerProperties.thickness),
    width: normalizeRangeNumber(properties.width, 10, 100, defaultBetterDividerProperties.width),
    alignment: isAlignment(properties.alignment) ? properties.alignment : defaultBetterDividerProperties.alignment,
    lineStyle: isLineStyle(properties.lineStyle) ? properties.lineStyle : defaultBetterDividerProperties.lineStyle,
    rounded: Boolean(properties.rounded),
    spacing: normalizeRangeNumber(properties.spacing, 0, 64, defaultBetterDividerProperties.spacing),
    instanceClassName: normalizeCssClassName(
      properties.instanceClassName,
      defaultBetterDividerProperties.instanceClassName
    ),
    customCss: normalizeCustomCss(properties.customCss)
  };
}

export function createBetterDividerCss(customCss = ''): string {
  const normalized = normalizeCustomCss(customCss);
  const compiled = compileBetterDividerScss(normalized);
  return `${betterDividerBaseCss}${compiled ? `\n\n/* Custom CSS/SCSS */\n${compiled}` : ''}`;
}

export function createBetterDividerControlCss(properties: Partial<BetterDividerProperties> = {}): string {
  const normalized = normalizeBetterDividerProperties(properties);
  return ensureBetterDividerCssTargetComment(`${createRule('.better-divider', createDividerDeclarations(normalized))}

${createRule('.better-divider__line', createLineDeclarations(normalized))}`, normalized.instanceClassName);
}

export function parseBetterDividerPropertiesFromCss(
  css: string | undefined,
  fallbackProperties: Partial<BetterDividerProperties> = {}
): BetterDividerProperties {
  const source = normalizeCustomCss(css);
  const compiledCss = compileBetterDividerScss(source);
  const dividerDeclarations = parseDeclarationMap(readCssRuleBody(compiledCss, '.better-divider'));
  const lineDeclarations = parseDeclarationMap(readCssRuleBody(compiledCss, '.better-divider__line'));
  const borderTop = parseBorderTop(lineDeclarations['border-top']);
  const borderTopStyle = normalizeLineStyle(lineDeclarations['border-top-style']) || borderTop?.lineStyle;
  const lineStyle = borderTopStyle || defaultBetterDividerProperties.lineStyle;

  return normalizeBetterDividerProperties({
    color: parseCssColor(lineStyle === 'solid' ? lineDeclarations.background : undefined) ||
      parseCssColor(lineDeclarations['background-color']) ||
      parseCssColor(lineDeclarations['border-top-color']) ||
      parseCssColor(borderTop?.color) ||
      defaultBetterDividerProperties.color,
    thickness:
      parsePixelNumber(lineStyle === 'solid' ? lineDeclarations.height : undefined) ||
      parsePixelNumber(lineDeclarations['border-top-width']) ||
      borderTop?.thickness ||
      defaultBetterDividerProperties.thickness,
    width: parsePercentNumber(lineDeclarations.width) || defaultBetterDividerProperties.width,
    alignment: parseAlignment(dividerDeclarations['justify-content']) || defaultBetterDividerProperties.alignment,
    lineStyle,
    rounded: parseRounded(lineDeclarations['border-radius']),
    spacing:
      parsePixelNumber(dividerDeclarations['padding-block']) ||
      parsePaddingSpacing(dividerDeclarations.padding) ||
      defaultBetterDividerProperties.spacing,
    instanceClassName: fallbackProperties.instanceClassName || defaultBetterDividerProperties.instanceClassName,
    customCss: source
  });
}

export function compileBetterDividerScss(source: string | undefined): string {
  const normalized = normalizeCustomCss(source);
  if (!normalized.trim()) {
    return '';
  }
  const variables: Record<string, string> = {};
  const withoutComments = stripCssComments(normalized);
  const withoutVariables = withoutComments.replace(/\$([A-Za-z0-9_-]+)\s*:\s*([^;]+);/g, (
    _match,
    name: string,
    value: string
  ) => {
    variables[name] = value.trim();
    return '';
  });
  const substituted = withoutVariables.replace(/\$([A-Za-z0-9_-]+)/g, (_match, name: string) => variables[name] || '');
  return flattenNestedScss(substituted);
}

export function syncBetterDividerCssFromProperties(
  css: string | undefined,
  properties: Partial<BetterDividerProperties>
): string {
  const normalized = normalizeBetterDividerProperties(properties);
  const source = normalizeCustomCss(css);

  if (!source.trim()) {
    return createBetterDividerControlCss(normalized);
  }

  const withDivider = replaceOrAppendRule(source, '.better-divider', createDividerDeclarations(normalized));
  return ensureBetterDividerCssTargetComment(
    replaceOrAppendRule(withDivider, '.better-divider__line', createLineDeclarations(normalized)),
    normalized.instanceClassName
  );
}

export function normalizeBetterDividerInstanceClassName(
  value: string | undefined,
  fallback = defaultBetterDividerProperties.instanceClassName
): string {
  return normalizeCssClassName(value, fallback);
}

export function renameBetterDividerInstanceClassInCss(
  css: string | undefined,
  previousClassName: string | undefined,
  nextClassName: string | undefined
): string {
  const previous = normalizeCssClassName(previousClassName, defaultBetterDividerProperties.instanceClassName);
  const next = normalizeCssClassName(nextClassName, previous);
  const source = normalizeCustomCss(css);

  if (previous === next) {
    return ensureBetterDividerCssTargetComment(source, next);
  }

  return ensureBetterDividerCssTargetComment(
    source.replace(createCssClassSelectorPattern(previous), `.${next}`),
    next
  );
}

export function betterDividerRootClassName(properties: Partial<BetterDividerProperties>): string {
  const instanceClassName = normalizeBetterDividerProperties(properties).instanceClassName;
  return `better-divider ${instanceClassName}`;
}

export function betterDividerLineClassName(lineStyle: BetterDividerLineStyle): string {
  return `better-divider__line better-divider__line--${lineStyle}`;
}

export function createBetterDividerStyleVariables(properties: BetterDividerProperties): Record<string, string> {
  return {
    '--better-divider-color': properties.color,
    '--better-divider-justify': alignmentToJustifyContent(properties.alignment),
    '--better-divider-line-style': properties.lineStyle,
    '--better-divider-radius': properties.rounded ? '999px' : '0',
    '--better-divider-spacing': `${properties.spacing}px`,
    '--better-divider-thickness': `${properties.thickness}px`,
    '--better-divider-width': `${properties.width}%`
  };
}

export function createBetterDividerCssTargetComment(instanceClassName?: string): string {
  const normalizedInstanceClassName = normalizeCssClassName(
    instanceClassName,
    defaultBetterDividerProperties.instanceClassName
  );
  return `/*
Better Divider SCSS targets:
:host - web part host element.
.better-divider - wrapper for alignment and vertical spacing.
.better-divider__line - visible divider line, width, color, stroke, and rounded ends.
.${normalizedInstanceClassName} - generated instance class on this divider only.
*/`;
}

export function createBetterDividerCssTargets(
  properties: Partial<BetterDividerProperties> = {}
): BetterDividerCssTarget[] {
  const normalized = normalizeBetterDividerProperties(properties);
  const instanceSelector = `.${normalized.instanceClassName}`;

  return [
    {
      label: ':host',
      selector: ':host',
      snippet: ':host {\n  display: block;\n}'
    },
    {
      label: '.better-divider',
      selector: '.better-divider',
      snippet: createRule('.better-divider', createDividerDeclarations(normalized))
    },
    {
      label: '.better-divider__line',
      selector: '.better-divider__line',
      snippet: createRule('.better-divider__line', createLineDeclarations(normalized))
    },
    {
      label: instanceSelector,
      selector: instanceSelector,
      snippet: `${instanceSelector} {\n  /* Instance-only wrapper styles */\n}`,
      editable: true,
      renameLabel: 'Edit instance class'
    }
  ];
}

export function createBetterDividerInstanceClass(seed = ''): string {
  const source = seed.trim() || `${Date.now()}-${Math.random()}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `bd-${(hash >>> 0).toString(36).padStart(7, '0').slice(0, 7)}`;
}

export function alignmentToJustifyContent(alignment: BetterDividerAlignment): string {
  switch (alignment) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    case 'center':
    default:
      return 'center';
  }
}

function createDividerDeclarations(properties: BetterDividerProperties): Record<string, string> {
  return {
    'justify-content': alignmentToJustifyContent(properties.alignment),
    'padding-block': `${properties.spacing}px`
  };
}

function createLineDeclarations(properties: BetterDividerProperties): Record<string, string> {
  const declarations: Record<string, string> = {
    width: `${properties.width}%`,
    'border-radius': properties.rounded ? '999px' : '0'
  };

  if (properties.lineStyle === 'solid') {
    return {
      ...declarations,
      height: `${properties.thickness}px`,
      background: properties.color,
      border: '0'
    };
  }

  return {
    ...declarations,
    height: '0',
    background: 'transparent',
    'border-top': `${properties.thickness}px ${properties.lineStyle} ${properties.color}`
  };
}

function createRule(selector: string, declarations: Record<string, string>): string {
  const body = Object.entries(declarations)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

function ensureBetterDividerCssTargetComment(css: string, instanceClassName?: string): string {
  const source = normalizeCustomCss(css).trimStart();
  const comment = createBetterDividerCssTargetComment(instanceClassName);
  if (!source.trim()) {
    return comment;
  }
  if (source.includes(betterDividerCssTargetCommentMarker)) {
    const replaced = source.replace(/\/\*[\s\S]*?Better Divider SCSS targets:[\s\S]*?\*\//, comment);
    return replaced === source ? source : replaced;
  }
  return `${comment}\n\n${source}`;
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function normalizeColor(value: string | undefined, fallback: string): string {
  const next = typeof value === 'string' ? value.trim() : '';
  if (!next || next.length > 64) {
    return fallback;
  }
  return next;
}

function normalizeCustomCss(value: string | undefined): string {
  if (typeof value !== 'string') {
    return defaultBetterDividerProperties.customCss;
  }
  return value.slice(0, 12000);
}

function normalizeCssClassName(value: string | undefined, fallback: string): string {
  const next = typeof value === 'string' ? value.trim().replace(/^\./, '') : '';
  if (/^[A-Za-z_][-_A-Za-z0-9]{1,31}$/.test(next)) {
    return next;
  }
  return fallback;
}

function createCssClassSelectorPattern(className: string): RegExp {
  return new RegExp(`\\.${escapeRegExp(className)}(?=$|[^-_A-Za-z0-9])`, 'g');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRangeNumber(value: number | undefined, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

function isAlignment(value: unknown): value is BetterDividerAlignment {
  return value === 'left' || value === 'center' || value === 'right';
}

function isLineStyle(value: unknown): value is BetterDividerLineStyle {
  return value === 'solid' || value === 'dashed' || value === 'dotted';
}

function normalizeLineStyle(value: string | undefined): BetterDividerLineStyle | undefined {
  const next = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return isLineStyle(next) ? next : undefined;
}

function parseAlignment(value: string | undefined): BetterDividerAlignment | undefined {
  switch ((value || '').trim()) {
    case 'flex-start':
      return 'left';
    case 'flex-end':
      return 'right';
    case 'center':
      return 'center';
    default:
      return undefined;
  }
}

function parseRounded(value: string | undefined): boolean {
  const parsed = parsePixelNumber(value);
  if (parsed !== undefined) {
    return parsed > 0;
  }
  return Boolean(value && value.trim() !== '0' && value.trim() !== '0px');
}

function parsePixelNumber(value: string | undefined): number | undefined {
  const match = (value || '').trim().match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (!match) {
    return undefined;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePercentNumber(value: string | undefined): number | undefined {
  const match = (value || '').trim().match(/^(-?\d+(?:\.\d+)?)%$/);
  if (!match) {
    return undefined;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePaddingSpacing(value: string | undefined): number | undefined {
  const parts = (value || '').trim().split(/\s+/);
  return parsePixelNumber(parts[0]);
}

function parseCssColor(value: string | undefined): string | undefined {
  const next = (value || '').trim();
  if (!next || next === 'transparent') {
    return undefined;
  }
  return next.length <= 64 ? next : undefined;
}

function parseBorderTop(value: string | undefined):
  | { thickness?: number; lineStyle?: BetterDividerLineStyle; color?: string }
  | undefined {
  const next = (value || '').trim();
  if (!next || next === '0') {
    return undefined;
  }
  const tokens = next.split(/\s+/);
  const thickness = parsePixelNumber(tokens.find((token) => /px$/i.test(token)));
  const lineStyle = normalizeLineStyle(tokens.find((token) => isLineStyle(token)));
  const color = tokens.find((token) => token !== `${thickness}px` && token !== lineStyle);
  return { thickness, lineStyle, color };
}

function readCssRuleBody(css: string, selector: string): string | undefined {
  const selectorIndex = findRuleSelectorIndex(css, selector);
  if (selectorIndex < 0) {
    return undefined;
  }

  const openIndex = css.indexOf('{', selectorIndex + selector.length);
  if (openIndex < 0) {
    return undefined;
  }

  let depth = 0;
  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      depth += 1;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openIndex + 1, index);
      }
    }
  }

  return undefined;
}

function parseDeclarationMap(body: string | undefined): Record<string, string> {
  const declarations: Record<string, string> = {};
  if (!body) {
    return declarations;
  }

  body.split(';').forEach((entry) => {
    const separatorIndex = entry.indexOf(':');
    if (separatorIndex < 0) {
      return;
    }
    const property = entry.slice(0, separatorIndex).trim().toLowerCase();
    const value = entry.slice(separatorIndex + 1).trim();
    if (property && value) {
      declarations[property] = value;
    }
  });

  return declarations;
}

function replaceOrAppendRule(css: string, selector: string, declarations: Record<string, string>): string {
  const existingBody = readCssRuleBody(css, selector);
  const mergedRule = createRule(selector, mergeDeclarations(existingBody, declarations));

  if (existingBody === undefined) {
    return `${css.trimEnd()}\n\n${mergedRule}`;
  }

  const selectorIndex = findRuleSelectorIndex(css, selector);
  const openIndex = css.indexOf('{', selectorIndex + selector.length);
  let depth = 0;
  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index];
    if (char === '{') {
      depth += 1;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return `${css.slice(0, selectorIndex)}${mergedRule}${css.slice(index + 1)}`;
      }
    }
  }

  return `${css.trimEnd()}\n\n${mergedRule}`;
}

function flattenNestedScss(css: string): string {
  const trimmed = css.trim();
  if (!trimmed.includes('{')) {
    return trimmed;
  }
  const output: string[] = [];

  function parseBlock(selector: string, body: string): void {
    const directParts: string[] = [];
    let cursor = 0;
    let searchIndex = 0;
    let openIndex = body.indexOf('{', searchIndex);

    while (openIndex >= 0) {
      const selectorStart = findNestedSelectorStart(body, openIndex);
      const closeIndex = findMatchingBrace(body, openIndex);
      if (closeIndex < 0) {
        break;
      }

      directParts.push(body.slice(cursor, selectorStart));
      const childSelector = body.slice(selectorStart, openIndex).trim();
      const childBody = body.slice(openIndex + 1, closeIndex).trim();
      const resolved = childSelector
        .split(',')
        .map((item) => {
          const value = item.trim();
          return value.includes('&') ? value.replace(/&/g, selector) : `${selector} ${value}`;
        })
        .join(', ');
      output.push(`${resolved} { ${childBody} }`);
      cursor = closeIndex + 1;
      searchIndex = closeIndex + 1;
      openIndex = body.indexOf('{', searchIndex);
    }

    directParts.push(body.slice(cursor));
    const direct = directParts.join('');
    if (direct.trim()) {
      output.unshift(`${selector} { ${direct.trim()} }`);
    }
  }

  const topRegex = /([^{}]+)\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = topRegex.exec(trimmed))) {
    parseBlock(match[1].trim(), match[2]);
  }
  return output.length ? output.join('\n') : trimmed;
}

function findNestedSelectorStart(body: string, openIndex: number): number {
  for (let index = openIndex - 1; index >= 0; index -= 1) {
    const char = body[index];
    if (char === ';' || char === '}') {
      return index + 1;
    }
  }
  return 0;
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function findRuleSelectorIndex(css: string, selector: string): number {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escapedSelector}\\s*\\{`).exec(css);
  return match ? match.index : -1;
}

function mergeDeclarations(
  existingBody: string | undefined,
  canonicalDeclarations: Record<string, string>
): Record<string, string> {
  const existingDeclarations = parseDeclarationMap(existingBody);
  const canonicalKeys = new Set([
    ...Object.keys(canonicalDeclarations),
    'border',
    'border-top',
    'border-top-color',
    'border-top-style',
    'border-top-width',
    'background-color'
  ]);
  const merged: Record<string, string> = { ...canonicalDeclarations };

  Object.entries(existingDeclarations).forEach(([property, value]) => {
    if (!canonicalKeys.has(property)) {
      merged[property] = value;
    }
  });

  return merged;
}

const betterDividerBaseCss = `:host {
  display: block;
}

.better-divider {
  box-sizing: border-box;
  display: flex;
  justify-content: var(--better-divider-justify, center);
  width: 100%;
  padding: var(--better-divider-spacing, 16px) 0;
}

.better-divider__line {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: var(--better-divider-width, 100%);
  border-radius: var(--better-divider-radius, 0);
}

.better-divider__line--solid {
  height: var(--better-divider-thickness, 1px);
  background: var(--better-divider-color, #8a8886);
}

.better-divider__line--dashed,
.better-divider__line--dotted {
  height: 0;
  border-top-width: var(--better-divider-thickness, 1px);
  border-top-style: var(--better-divider-line-style, dashed);
  border-top-color: var(--better-divider-color, #8a8886);
}`;
