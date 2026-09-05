import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import type { Modalite } from '../types';

const CONFIG: Record<
  Modalite,
  { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }
> = {
  prescrire: {
    label: 'Prescrire',
    icon: 'create-outline',
    bg: colors.primarySoft,
    fg: colors.badgePrescribe,
  },
  renouveler: {
    label: 'Renouveler',
    icon: 'refresh-outline',
    bg: colors.primaryTint,
    fg: colors.badgeRenew,
  },
  les_deux: {
    label: 'Prescrire · Renouveler',
    icon: 'sync-outline',
    bg: colors.accentSoft,
    fg: colors.badgeBoth,
  },
};

export function ModalityBadge({ modalite }: { modalite: Modalite }) {
  const { label, icon, bg, fg } = CONFIG[modalite];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={12} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
