import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, typography } from '../theme';
import type { NiveauIde } from '../types';

type Tone = {
  bg: string;
  fg: string;
  solid: string;
  icon: keyof typeof Ionicons.glyphMap;
  court: string;
  long: string;
};

const TONES: Record<NiveauIde, Tone> = {
  oui: {
    bg: colors.okSoft,
    fg: colors.ok,
    solid: colors.ok,
    icon: 'checkmark-circle',
    court: 'Prescription IDE possible',
    long: 'Figure dans la liste de l’arrêté — prescription ou renouvellement IDE possible',
  },
  conditions: {
    bg: colors.warnSoft,
    fg: colors.warn,
    solid: colors.warn,
    icon: 'alert-circle',
    court: 'IDE sous conditions',
    long: 'Figure dans la liste de l’arrêté, mais l’indication doit être vérifiée avant de prescrire',
  },
  non: {
    bg: colors.dangerSoft,
    fg: colors.danger,
    solid: colors.danger,
    icon: 'close-circle',
    court: 'Hors liste IDE',
    long: 'Ne figure pas dans la liste de l’arrêté — prescription IDE impossible',
  },
};

export function eligibiliteTone(niveau: NiveauIde) {
  return TONES[niveau];
}

export function EligibiliteBadge({
  niveau,
  suffixe,
}: {
  niveau: NiveauIde;
  suffixe?: string | null;
}) {
  const tone = TONES[niveau];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Ionicons name={tone.icon} size={13} color={tone.fg} />
      <Text style={[styles.text, { color: tone.fg }]}>
        {tone.court}
        {suffixe ? ` · ${suffixe}` : ''}
      </Text>
    </View>
  );
}

/** Liseré vertical coloré : repère d'éligibilité sur le bord gauche d'une carte. */
export function EligibiliteEdge({ niveau }: { niveau: NiveauIde }) {
  return <View style={[styles.edge, { backgroundColor: TONES[niveau].solid }]} />;
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
  text: { ...typography.micro, fontSize: 11.5 },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radii.md,
    borderBottomLeftRadius: radii.md,
  },
});
