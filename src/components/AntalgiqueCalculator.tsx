import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ANTALGIQUES_PALIER_I,
  computeAntalgiqueDose,
  isPoidsEnfantValide,
  type AntalgiqueId,
  type PatientProfil,
} from '../data/antalgiquesPalierI';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { FilterChip, SegmentedControl } from './controls';
import { GhostButton, PressableScale } from './ui';

export function AntalgiqueCalculator({
  accent = colors.primary,
  tint = colors.primaryTint,
  onCopied,
}: {
  accent?: string;
  tint?: string;
  onCopied?: (text: string) => void;
}) {
  const [molecule, setMolecule] = useState<AntalgiqueId>('paracetamol');
  const [profil, setProfil] = useState<PatientProfil>('adulte');
  const [poidsText, setPoidsText] = useState('20');

  const poidsKg = useMemo(() => {
    const n = Number(poidsText.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }, [poidsText]);

  const dose = useMemo(
    () =>
      computeAntalgiqueDose({
        molecule,
        profil,
        poidsKg: profil === 'enfant' ? poidsKg : null,
      }),
    [molecule, profil, poidsKg],
  );

  const poidsInvalide = profil === 'enfant' && (poidsKg === null || !isPoidsEnfantValide(poidsKg));

  async function copyResume() {
    if (!dose) return;
    await Clipboard.setStringAsync(dose.resumeOrdonnance);
    haptic('success');
    onCopied?.(dose.resumeOrdonnance);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: tint }]}>
        <Ionicons name="calculator-outline" size={16} color={accent} />
        <Text style={[styles.bannerText, { color: accent }]}>
          Aide posologique — molécules de l’Art. 1-V uniquement. Vérifier l’AMM de la spécialité.
        </Text>
      </View>

      <Text style={styles.label}>Molécule</Text>
      <View style={styles.chips}>
        {ANTALGIQUES_PALIER_I.map((m) => (
          <FilterChip
            key={m.id}
            label={m.label}
            active={molecule === m.id}
            onPress={() => setMolecule(m.id)}
            color={accent}
            tint={tint}
          />
        ))}
      </View>

      <Text style={styles.label}>Patient</Text>
      <SegmentedControl
        value={profil}
        onChange={setProfil}
        accent={accent}
        options={[
          { value: 'adulte', label: 'Adulte' },
          { value: 'enfant', label: 'Enfant' },
        ]}
      />

      {profil === 'enfant' ? (
        <Animated.View entering={FadeIn.duration(180)} style={styles.poidsRow}>
          <Text style={styles.poidsLabel}>Poids (kg)</Text>
          <TextInput
            value={poidsText}
            onChangeText={setPoidsText}
            keyboardType="decimal-pad"
            accessibilityLabel="Poids en kilogrammes"
            style={[
              styles.poidsInput,
              poidsInvalide && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
            ]}
            placeholder="ex. 20"
            placeholderTextColor={colors.mutedLight}
          />
          {poidsInvalide ? (
            <Text style={styles.poidsHint}>Saisir un poids entre 5 et 50 kg.</Text>
          ) : (
            <Text style={styles.poidsHint}>Dose calculée au mg/kg selon le poids.</Text>
          )}
        </Animated.View>
      ) : null}

      {dose && !poidsInvalide ? (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.result}>
          <ResultRow icon="flask-outline" label="Par prise" value={dose.doseParPrise} accent={accent} />
          <ResultRow icon="time-outline" label="Intervalle" value={dose.intervalle} accent={accent} />
          <ResultRow
            icon="speedometer-outline"
            label="Max / 24 h"
            value={dose.maxJournalier}
            accent={accent}
          />

          {dose.notes.map((n) => (
            <View key={n} style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
              <Text style={styles.noteText}>{n}</Text>
            </View>
          ))}

          {dose.alertes.map((a) => (
            <View key={a} style={[styles.alerteRow, { backgroundColor: colors.warnSoft }]}>
              <Ionicons name="warning-outline" size={14} color={colors.warn} />
              <Text style={[styles.alerteText, { color: colors.warn }]}>{a}</Text>
            </View>
          ))}

          <PressableScale
            scaleTo={0.97}
            accessibilityLabel="Copier le libellé d’ordonnance"
            onPress={copyResume}
            style={[styles.copyCard, { borderColor: accent, backgroundColor: tint }]}
          >
            <Ionicons name="copy-outline" size={16} color={accent} />
            <Text style={[styles.copyText, { color: accent }]}>{dose.resumeOrdonnance}</Text>
          </PressableScale>

          <GhostButton
            label="Copier le libellé"
            icon="clipboard-outline"
            color={accent}
            onPress={copyResume}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

function ResultRow({
  icon,
  label,
  value,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.resultRow}>
      <View style={[styles.resultIcon, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
  label: { ...typography.caption, color: colors.muted, fontWeight: '700', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  poidsRow: { gap: 6 },
  poidsLabel: { ...typography.caption, color: colors.muted, fontWeight: '700' },
  poidsInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  poidsHint: { color: colors.mutedLight, fontSize: 12, fontWeight: '600' },
  result: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  resultRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  resultIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { flex: 1, gap: 2 },
  resultLabel: { fontSize: 11, fontWeight: '700', color: colors.mutedLight, textTransform: 'uppercase' },
  resultValue: { fontSize: 15, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.muted },
  alerteRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  alerteText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
  copyCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  copyText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontWeight: '700' },
});
