import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import type { Modalite } from '../types';

const CONFIG = {
  prescrire: {
    label: 'Prescrire',
    icon: 'create-outline' as const,
    bg: colors.primarySoft,
    fg: colors.badgePrescribe,
  },
  renouveler: {
    label: 'Renouveler',
    icon: 'refresh-outline' as const,
    bg: colors.primaryTint,
    fg: colors.badgeRenew,
  },
};

function SingleBadge({ kind }: { kind: 'prescrire' | 'renouveler' }) {
  const { label, icon, bg, fg } = CONFIG[kind];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Affiche Prescrire, Renouveler, ou les deux badges côte à côte (jamais « Les deux »). */
export function ModalityBadge({ modalite }: { modalite: Modalite }) {
  if (modalite === 'les_deux') {
    return (
      <View style={styles.row}>
        <SingleBadge kind="prescrire" />
        <SingleBadge kind="renouveler" />
      </View>
    );
  }

  return <SingleBadge kind={modalite} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignSelf: 'flex-start' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  text: { ...typography.micro },
});
