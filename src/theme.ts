import type { DomaineId } from './types';

export const colors = {
  bg: '#F6F1E9',
  bgSunken: '#EFE7DB',
  bgHero: '#3D5140',
  surface: '#FFFDFA',
  surfaceMuted: '#F3ECE1',
  surfaceRaised: '#FFFFFF',
  ink: '#22211E',
  inkSoft: '#4A4640',
  muted: '#857C71',
  mutedLight: '#A79C8E',
  primary: '#3D5140',
  primaryDeep: '#2A3A2D',
  primaryMid: '#5A7359',
  primarySoft: '#DEE7DB',
  primaryTint: '#EDF2EB',
  accent: '#9B4B32',
  accentMid: '#BB6244',
  accentSoft: '#F7E6DE',
  warn: '#8F6520',
  warnSoft: '#F9EED8',
  danger: '#8B3A3A',
  dangerSoft: '#F8E3E3',
  ok: '#3D6B4A',
  okSoft: '#E2EFE5',
  border: '#E6DACB',
  borderSoft: '#F0E7DA',
  borderStrong: '#D2BC9E',
  clay: '#D4B99A',
  badgePrescribe: '#3D5140',
  badgeRenew: '#5A7359',
  badgeBoth: '#9B4B32',
  white: '#FFFFFF',
  overlay: 'rgba(34, 33, 30, 0.45)',
  onDark: 'rgba(255,255,255,0.92)',
  onDarkSoft: 'rgba(255,255,255,0.68)',
  onDarkFaint: 'rgba(255,255,255,0.14)',
};

/** Dégradés — toujours au moins deux teintes (contrainte de `expo-linear-gradient`). */
export const gradients = {
  hero: ['#4A6149', '#3A4F3D', '#2B3B2E'] as const,
  heroAccent: ['#B0603F', '#96442C'] as const,
  primary: ['#4E6650', '#37493A'] as const,
  accent: ['#BB6244', '#95462D'] as const,
  glassLight: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)'] as const,
  fadeToBg: ['rgba(246,241,233,0)', '#F6F1E9'] as const,
};

/**
 * Le hero change de lumière selon l'heure de la tournée : ouvrir l'app à 6 h
 * et à 21 h ne donne pas la même ambiance, sans jamais quitter la palette.
 */
const HERO_BY_MOMENT = {
  aube: ['#4C6B57', '#3A5344', '#293B31'] as const,
  jour: ['#4A6149', '#3A4F3D', '#2B3B2E'] as const,
  couchant: ['#6A5340', '#48493A', '#2C3A2F'] as const,
  nuit: ['#2F4034', '#26332B', '#1C2621'] as const,
};

export type Moment = keyof typeof HERO_BY_MOMENT;

export function momentOfDay(date = new Date()): Moment {
  const h = date.getHours();
  if (h < 6) return 'nuit';
  if (h < 10) return 'aube';
  if (h < 18) return 'jour';
  if (h < 22) return 'couchant';
  return 'nuit';
}

export function heroGradient(moment: Moment = momentOfDay()) {
  return HERO_BY_MOMENT[moment];
}

export const MOMENT_GREETING: Record<Moment, string> = {
  aube: 'Bonne tournée',
  jour: 'Bonjour',
  couchant: 'Bonne fin de tournée',
  nuit: 'Bonne garde',
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** `ratio` négatif assombrit, positif éclaircit. Sert à dériver un dégradé d'une seule teinte. */
export function shade(hex: string, ratio: number): string {
  const raw = hex.replace('#', '');
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw.padEnd(6, '0').slice(0, 6);
  const target = ratio < 0 ? 0 : 255;
  const weight = Math.min(1, Math.abs(ratio));
  const channel = (offset: number) => {
    const value = parseInt(full.slice(offset, offset + 2), 16);
    if (Number.isNaN(value)) return '00';
    return clampByte(value + (target - value) * weight)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

/** Dégradé lisible construit à partir d'une couleur d'accent unique. */
export function accentGradient(hex: string): readonly [string, string] {
  return [shade(hex, 0.14), shade(hex, -0.24)];
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 999,
};

export const typography = {
  display: { fontSize: 40, fontWeight: '800' as const, letterSpacing: -1.2, lineHeight: 44 },
  hero: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 39 },
  title: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 30 },
  subtitle: { fontSize: 19, fontWeight: '800' as const, letterSpacing: -0.2, lineHeight: 25 },
  section: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '800' as const, letterSpacing: 0.4 },
  label: { fontSize: 14, fontWeight: '700' as const, lineHeight: 18 },
};

export const shadow = {
  /** Ombre discrète pour les cartes posées sur le fond crème. */
  card: {
    shadowColor: '#3D5140',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  raised: {
    shadowColor: '#2A3A2D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  floating: {
    shadowColor: '#22211E',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 14,
  },
};

/** Ombre teintée : donne du relief aux cartes colorées (favoris, domaines). */
export function glow(hex: string) {
  return {
    shadowColor: hex,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  };
}

export type DomainPalette = {
  /** Teinte pleine, pour les pastilles et les accents forts. */
  solid: string;
  /** Fond très clair, pour les surfaces teintées. */
  tint: string;
  /** Texte lisible sur `tint`. */
  onTint: string;
  gradient: readonly [string, string];
};

/** Une identité couleur par domaine de l'arrêté — repère visuel constant dans toute l'app. */
const DOMAIN_PALETTES: Record<DomaineId, DomainPalette> = {
  I: { solid: '#2F6E75', tint: '#E1EEF0', onTint: '#245A60', gradient: ['#3A838B', '#255C63'] },
  II: { solid: '#A9552F', tint: '#F8E7DD', onTint: '#8E4526', gradient: ['#C0663D', '#94472A'] },
  III: { solid: '#8C3F60', tint: '#F6E4EC', onTint: '#75324F', gradient: ['#A34D73', '#7A3453'] },
  IV: { solid: '#4A7343', tint: '#E5EFE1', onTint: '#3B5F36', gradient: ['#5A8951', '#3E6339'] },
  V: { solid: '#8A6520', tint: '#F8EEDA', onTint: '#71521A', gradient: ['#A2782B', '#755518'] },
  VI: { solid: '#455283', tint: '#E5E8F4', onTint: '#37426C', gradient: ['#54639B', '#3B4670'] },
};

const FALLBACK_PALETTE: DomainPalette = {
  solid: colors.primary,
  tint: colors.primarySoft,
  onTint: colors.primary,
  gradient: gradients.primary,
};

export function domainPalette(id: string): DomainPalette {
  return DOMAIN_PALETTES[id as DomaineId] ?? FALLBACK_PALETTE;
}

/** Conservé pour les usages « pastille » simples (fond + texte). */
export function domainTint(id: string): { bg: string; fg: string } {
  const palette = domainPalette(id);
  return { bg: palette.tint, fg: palette.onTint };
}
