import { Color, hexColorToInt } from '@alyle/ui/color';
import { _STYLE_MAP, Styles, LyClasses } from './theme/style';
import { StyleCollection, StyleTemplate } from './parse';

export class LyStyleUtils {
  name: string;
  typography: {
    fontFamily?: string;
    htmlFontSize: number,
    fontSize: number;
  };
  breakpoints: {
    XSmall: string,
    Small: string,
    Medium: string,
    Large: string,
    XLarge: string,

    Handset: string,
    Tablet: string,
    Web: string,

    HandsetPortrait: string,
    TabletPortrait: string,
    WebPortrait: string,

    HandsetLandscape: string,
    TabletLandscape: string,
    WebLandscape: string,
    [key: string]: string
  };
  direction: Dir;

  /** Returns left or right according to the direction */
  get before() {
    return this.getDirection(DirAlias.before);
  }

  /** Returns left or right according to the direction */
  get after() {
    return this.getDirection(DirAlias.after);
  }

  /** Returns top */
  readonly above = 'top';

  /** Returns bottom */
  readonly below = 'bottom';

  pxToRem(value: number) {
    const size = this.typography.fontSize / 14;
    return `${value / this.typography.htmlFontSize * size}rem`;
  }
  colorOf(value: string | number, optional?: string): Color {
    if (typeof value === 'number') {
      return new Color(value);
    }
    if (value.includes('#') && value.length === 7) {
      return new Color(hexColorToInt(value));
    }
    const color = get(this, value, optional);
    if (color) {
      return color;
    }
    /** Create invalid color */
    return new Color();
  }
  getBreakpoint(key: string) {
    return `@media ${this.breakpoints[key] || key}`;
  }

  selectorsOf<T>(styles: T & Styles): LyClasses<T> {
    const styleMap = _STYLE_MAP.get(styles);
    if (styleMap) {
      return styleMap.classes || styleMap[this.name];
    } else {
      throw Error('Classes not found');
    }
  }

  getDirection(val: DirAlias | 'before' | 'after' | 'above' | 'below') {
    if (val === DirAlias.before) {
      return this.direction === 'rtl' ? 'right' : 'left';
    } else if (val === DirAlias.after) {
      return this.direction === 'rtl' ? 'left' : 'right';
    } else if (val === 'above') {
      return 'top';
    } else if (val === 'below') {
      return 'bottom';
    }
    return val;
  }
}

export enum Dir {
  rtl = 'rtl',
  ltr = 'ltr'
}
export enum DirAlias {
  before = 'before',
  after = 'after'
}
export enum DirPosition {
  left = 'left',
  right = 'right'
}

/**
 * get color of object
 * @param obj object
 * @param path path
 * @param optional get optional value, if not exist return default if not is string
 */
function get(obj: Object, path: string[] | string, optional?: string): Color {
  if (path === 'transparent') {
    return new Color(0, 0, 0, 0);
  }
  const _path: string[] = path instanceof Array ? path : path.split(':');
  for (let i = 0; i < _path.length; i++) {
    const posibleOb = obj[_path[i]];
    if (posibleOb) {
      obj = posibleOb;
    } else {
      /** if not exist */
      return new Color();
    }
  }
  if (obj instanceof Color) {
    return obj;
  } else if (optional) {
    return obj[optional] || obj['default'];
  } else {
    return obj['default'];
  }
  // return typeof obj === 'string' ? obj as string : obj['default'] as string;
}

// export type MediaQueryArray = (
//   string | number | (number | string| (string | number)[])[]
// )[];

export function eachMedia(
  str: string | number,
  fn: ((val: string | number, media: string | null, index: number) => void)
): void;
export function eachMedia(
  str: string | number,
  fn: ((val: string | number, media: string | null, index: number) => void),
  styleCollection: boolean
): StyleTemplate;
export function eachMedia(
  str: string | number,
  fn: ((val: string | number, media: string | null, index: number) => void),
  withStyleCollection?: boolean
): StyleTemplate | void {
  let styleCollection: StyleCollection | undefined;
  if (withStyleCollection) {
    styleCollection = new StyleCollection();
  }
  if (typeof str === 'string') {
    const values = str.split(/\s/g);
    for (let index = 0; index < values.length; index++) {
      const valItem = values[index].split(/\@/g);
      const strValue = valItem.shift()!;
      const len = valItem.length;
      const value = isNaN(+strValue) ? strValue : +strValue;
      if (len) {
        for (let j = 0; j < len; j++) {
          const st = fn.call(undefined, value, valItem[j], index);
          if (styleCollection) {
            styleCollection.add(st);
          }
        }
      } else {
        const st = fn.call(undefined, value, null, index);
        if (styleCollection) {
          styleCollection.add(st);
        }
      }
    }
  } else {
    const st = fn.call(undefined, str, null, 0);
    if (styleCollection) {
      styleCollection.add(st);
    }
  }
  if (styleCollection) {
    return styleCollection.css;
  }
}
/**
 * Simple object check.
 * @param item
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep<T, U>(target: T, source: U): T & U;
export function mergeDeep<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function mergeDeep<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function mergeDeep(target: object, ...sources: any[]): any;

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target: any, ...sources: any[]) {
  if (!sources.length) { return target; }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) { Object.assign(target, { [key]: {} }); }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * Simple object check.
 * @param item
 */
function isObjectForTheme(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item))
  && !(item instanceof StyleCollection)
  && !(item instanceof Color);
}

export function mergeThemes<T, U>(target: T, source: U): T & U;
export function mergeThemes<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function mergeThemes<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function mergeThemes(target: object, ...sources: any[]): any;
export function mergeThemes(target: any, ...sources: any[]): any {
  if (!sources.length) { return target; }
  const source = sources.shift();

  if (isObjectForTheme(target) && isObjectForTheme(source)) {
    for (const key in source) {
      if (isObjectForTheme(source[key])) {
        if (!target[key]) { Object.assign(target, { [key]: {} }); }
        mergeThemes(target[key], source[key]);
      } else {
        const targetKey = target[key];
        const sourceKey = source[key];
        // Merge styles
        if (targetKey instanceof StyleCollection && typeof sourceKey === 'function') {
          target[key] = (target[key] as StyleCollection).add(sourceKey);
        } else if (sourceKey instanceof Color) {
          target[key] = sourceKey;
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  }

  return mergeThemes(target, ...sources);
}
