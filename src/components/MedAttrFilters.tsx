import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import type { MedQueryOptions } from '../db/database';
import { colors, spacing } from '../theme';
import { FilterChip } from './controls';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type MedAttrFilterKey = keyof Pick<
  MedQueryOptions,
  | 'remboursable'
  | 'generique'
  | 'princeps'
  | 'commercialise'
  | 'mitm'
  | 'infoImportante'
  | 'surveillanceRenforcee'
  | 'tensionDispo'
>;

const ATTR_FILTERS: {
  key: MedAttrFilterKey;
  label: string;
  icon: IconName;
  color: string;
  tint: string;
}[] = [
  {
    key: 'remboursable',
    label: 'Remboursable AMO',
    icon: 'card-outline',
    color: colors.ok,
    tint: colors.okSoft,
  },
  {
    key: 'generique',
    label: 'Générique',
    icon: 'git-branch-outline',
    color: colors.primary,
    tint: colors.primarySoft,
  },
  {
    key: 'princeps',
    label: 'Princeps',
    icon: 'ribbon-outline',
    color: colors.accent,
    tint: colors.accentSoft,
  },
  {
    key: 'commercialise',
    label: 'Commercialisé',
    icon: 'storefront-outline',
    color: colors.primaryMid,
    tint: colors.primaryTint,
  },
  {
    key: 'mitm',
    label: 'MITM',
    icon: 'medkit-outline',
    color: colors.primary,
    tint: colors.primarySoft,
  },
  {
    key: 'infoImportante',
    label: 'Info sécurité',
    icon: 'information-circle-outline',
    color: colors.warn,
    tint: colors.warnSoft,
  },
  {
    key: 'surveillanceRenforcee',
    label: 'Surveillance+',
    icon: 'eye-outline',
    color: colors.warn,
    tint: colors.warnSoft,
  },
  {
    key: 'tensionDispo',
    label: 'Tension / rupture',
    icon: 'warning-outline',
    color: colors.danger,
    tint: colors.dangerSoft,
  },
];

export type MedAttrFilters = Partial<Record<MedAttrFilterKey, boolean>>;

export function medAttrToQuery(attrs: MedAttrFilters): MedQueryOptions {
  const out: MedQueryOptions = {};
  for (const f of ATTR_FILTERS) {
    if (attrs[f.key]) out[f.key] = true;
  }
  return out;
}

export function countActiveMedAttrs(attrs: MedAttrFilters): number {
  return ATTR_FILTERS.reduce((n, f) => n + (attrs[f.key] ? 1 : 0), 0);
}

/** Puces de filtres BDPM (remboursable, générique, etc.) — toggles cumulables. */
export function MedAttrFilterChips({
  value,
  onChange,
}: {
  value: MedAttrFilters;
  onChange: (next: MedAttrFilters) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ATTR_FILTERS.map((f) => {
        const active = Boolean(value[f.key]);
        return (
          <FilterChip
            key={f.key}
            label={f.label}
            icon={f.icon}
            color={f.color}
            tint={f.tint}
            active={active}
            onPress={() => onChange({ ...value, [f.key]: !active })}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: spacing.md },
});
