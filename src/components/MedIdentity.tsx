import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import { remboursementLabel } from '../utils/medicament';

export function PastilleRemboursable() {
  return <View accessibilityLabel="Remboursable" style={styles.pastille} />;
}

export function RemboursementBadge({
  remboursable,
  tauxLabel,
}: {
  remboursable: boolean;
  tauxLabel: string | null;
}) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: remboursable ? colors.accentSoft : colors.surfaceMuted },
      ]}
    >
      <Ionicons
        name={remboursable ? 'shield-checkmark' : 'remove-circle-outline'}
        size={12}
        color={remboursable ? colors.accent : colors.muted}
      />
      <Text style={[styles.badgeText, { color: remboursable ? colors.accent : colors.muted }]}>
        {remboursementLabel(remboursable, tauxLabel)}
      </Text>
    </View>
  );
}

const MONOGRAM_TINTS = [
  { bg: '#E1EEF0', fg: '#245A60' },
  { bg: '#F8E7DD', fg: '#8E4526' },
  { bg: '#F6E4EC', fg: '#75324F' },
  { bg: '#E5EFE1', fg: '#3B5F36' },
  { bg: '#F8EEDA', fg: '#71521A' },
  { bg: '#E5E8F4', fg: '#37426C' },
];

function monogramTint(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return MONOGRAM_TINTS[hash % MONOGRAM_TINTS.length]!;
}

/** Vignette de deux lettres — repère visuel rapide dans les longues listes BDPM. */
export function MedMonogram({ nomCommercial, size = 44 }: { nomCommercial: string; size?: number }) {
  const letters = nomCommercial.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 2).toUpperCase() || '??';
  const tint = monogramTint(nomCommercial);

  return (
    <View
      style={[
        styles.monogram,
        { width: size, height: size, borderRadius: size / 3, backgroundColor: tint.bg },
      ]}
    >
      <Text style={[styles.monogramText, { color: tint.fg, fontSize: size * 0.36 }]}>{letters}</Text>
    </View>
  );
}

export function MedIdentity({
  nom,
  nomCommercial,
  substances,
  remboursable,
  tauxRemboursement,
  withMonogram = false,
}: {
  nom: string;
  nomCommercial: string;
  substances: string;
  remboursable: boolean;
  tauxRemboursement: string | null;
  withMonogram?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {withMonogram ? <MedMonogram nomCommercial={nomCommercial} /> : null}
      <View style={styles.block}>
        <Text style={styles.commercial}>{nomCommercial}</Text>
        <Text style={styles.nom}>{nom}</Text>
        {substances && substances !== '—' ? (
          <Text style={styles.dci} numberOfLines={2}>
            DCI · {substances}
          </Text>
        ) : null}
        <RemboursementBadge remboursable={remboursable} tauxLabel={tauxRemboursement} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  block: { flex: 1, gap: 3 },
  monogram: { alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontWeight: '800', letterSpacing: -0.3 },
  commercial: { ...typography.subtitle, fontSize: 17, color: colors.ink },
  nom: { color: colors.inkSoft, fontSize: 13, lineHeight: 18 },
  dci: { color: colors.mutedLight, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: 3,
  },
  badgeText: { fontWeight: '800', fontSize: 11 },
  pastille: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
