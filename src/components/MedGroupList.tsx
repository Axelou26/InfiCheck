import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import type { BdpmMedicament } from '../types';
import {
  formeCourte,
  isCommercialise,
  moleculesLisibles,
  nomLisible,
  remboursementLabel,
} from '../utils/medicament';
import { PressableScale } from './ui';

function priseEnCharge(med: BdpmMedicament): string {
  return remboursementLabel(med.remboursable, med.tauxRemboursement);
}

function groupMeds(meds: BdpmMedicament[]): [string, BdpmMedicament[]][] {
  const groups = new Map<string, BdpmMedicament[]>();
  for (const med of meds) {
    const key = med.nomCommercial.trim() || med.nom;
    const list = groups.get(key);
    if (list) list.push(med);
    else groups.set(key, [med]);
  }
  return [...groups.entries()];
}

export function MedGroupList({
  meds,
  copied,
  accent,
  forceOpen = false,
  onCopy,
  onOpen,
}: {
  meds: BdpmMedicament[];
  copied: string | null;
  accent: string;
  /** Recherche en cours : toutes les marques sont ouvertes. */
  forceOpen?: boolean;
  onCopy: (nom: string) => void;
  onOpen: (id: string) => void;
}) {
  const groups = useMemo(() => groupMeds(meds), [meds]);
  const [openBrand, setOpenBrand] = useState<string | null>(null);

  return (
    <View style={styles.list}>
      {groups.map(([brand, items]) => {
        const open = forceOpen || openBrand === brand;
        const molecule = moleculesLisibles(items[0]?.substances ?? '');
        const charges = new Set(items.map(priseEnCharge));
        const charge = charges.size === 1 ? [...charges][0] : null;
        const meta = [molecule, charge].filter(Boolean).join(' · ');
        const several = items.length > 1;

        return (
          <View key={brand} style={styles.card}>
            {several ? (
              <PressableScale
                scaleTo={0.99}
                accessibilityLabel={`${nomLisible(brand)}, ${items.length} formes`}
                onPress={() => setOpenBrand((current) => (current === brand ? null : brand))}
                style={styles.header}
              >
                <View style={styles.headerText}>
                  <Text style={styles.brand}>{nomLisible(brand)}</Text>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                  <Text style={styles.count}>
                    {items.length} forme{items.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.muted}
                />
              </PressableScale>
            ) : (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.brand}>{nomLisible(brand)}</Text>
                  {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                </View>
              </View>
            )}
            {!several || open
              ? items.map((med) => (
                  <FormRow
                    key={med.id}
                    med={med}
                    copied={copied}
                    accent={accent}
                    showCharge={several && charges.size > 1}
                    onCopy={onCopy}
                    onOpen={onOpen}
                  />
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
}

function FormRow({
  med,
  copied,
  accent,
  showCharge,
  onCopy,
  onOpen,
}: {
  med: BdpmMedicament;
  copied: string | null;
  accent: string;
  showCharge: boolean;
  onCopy: (nom: string) => void;
  onOpen: (id: string) => void;
}) {
  const forme = formeCourte(med.nom, med.nomCommercial);
  const isCopied = copied === med.nom;
  const retired = med.etatCommercialisation && !isCommercialise(med.etatCommercialisation);

  return (
    <View style={styles.row}>
      <View style={styles.formeWrap}>
        <Text style={styles.forme}>{forme}</Text>
        {showCharge ? <Text style={styles.meta}>{priseEnCharge(med)}</Text> : null}
        {retired ? <Text style={styles.retired}>Plus vendu</Text> : null}
      </View>
      <PressableScale
        scaleTo={0.96}
        accessibilityLabel={`Copier ${med.nom}`}
        onPress={() => onCopy(med.nom)}
        style={styles.iconBtn}
      >
        <Ionicons
          name={isCopied ? 'checkmark-circle' : 'copy-outline'}
          size={18}
          color={isCopied ? accent : colors.muted}
        />
      </PressableScale>
      <PressableScale
        scaleTo={0.96}
        accessibilityLabel={`Ouvrir ${med.nom}`}
        onPress={() => onOpen(med.id)}
        style={styles.iconBtn}
      >
        <Ionicons name="open-outline" size={18} color={colors.muted} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  brand: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  count: { color: colors.mutedLight, fontSize: 12, fontWeight: '700', marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  formeWrap: { flex: 1, gap: 2 },
  forme: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  retired: { color: colors.warn, fontSize: 12, fontWeight: '700' },
  iconBtn: { padding: 8 },
});
