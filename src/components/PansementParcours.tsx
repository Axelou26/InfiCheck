import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { GUIDE_PANSEMENTS } from '../data/guidesPrescription';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem } from '../types';
import { haptic } from '../utils/haptics';
import { CommentPrescrire } from './CommentPrescrire';
import { FicheChecklist } from './FicheChecklist';
import { GhostButton, PressableScale } from './ui';

type Step = 1 | 2 | 3;

/**
 * Parcours pansements en 3 étapes :
 * 1) profil de plaie → 2) choix des libellés → 3) résumé + cases à cocher.
 */
export function PansementParcours({
  item,
  accent = colors.primary,
  tint = colors.primaryTint,
  onCopied,
}: {
  item: ArreteItem;
  accent?: string;
  tint?: string;
  onCopied?: (text: string) => void;
}) {
  const guide = GUIDE_PANSEMENTS;
  const [step, setStep] = useState<Step>(1);
  const [situationId, setSituationId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const situation = guide.situations.find((s) => s.id === situationId) ?? null;
  const suggestion = useMemo(() => {
    if (!situationId) return null;
    return guide.resolve(situationId);
  }, [situationId]);

  const bloque = suggestion?.autorise === false;
  const canGoStep2 = !!situationId && !bloque;
  const canGoStep3 = (selected.size > 0 || (suggestion?.libelles.length ?? 0) === 0) && !bloque;

  function pickSituation(id: string) {
    setSituationId(id);
    setSelected(new Set());
    haptic('select');
  }

  function toggleLibelle(libelle: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(libelle)) next.delete(libelle);
      else next.add(libelle);
      return next;
    });
    haptic('select');
  }

  function go(next: Step) {
    setStep(next);
    haptic('light');
  }

  async function copySelection() {
    const lines = [
      situation?.label,
      suggestion?.duree,
      ...[...selected],
    ].filter(Boolean) as string[];
    if (!lines.length) return;
    const block = lines.join('\n');
    await Clipboard.setStringAsync(block);
    haptic('success');
    onCopied?.(block);
  }

  return (
    <View style={styles.wrap}>
      <StepHeader step={step} accent={accent} tint={tint} />

      {step === 1 ? (
        <Animated.View key="s1" entering={FadeInRight.duration(220)} style={styles.panel}>
          <Text style={styles.question}>{guide.question}</Text>
          <Text style={styles.hint}>Choisissez d’abord le profil — le pansement vient ensuite.</Text>
          <View style={styles.situations}>
            {guide.situations.map((s) => {
              const active = situationId === s.id;
              return (
                <PressableScale
                  key={s.id}
                  scaleTo={0.98}
                  accessibilityLabel={s.label}
                  onPress={() => pickSituation(s.id)}
                  style={[
                    styles.situationCard,
                    active && { borderColor: accent, backgroundColor: tint },
                  ]}
                >
                  {s.icon ? (
                    <View style={[styles.situationIcon, { backgroundColor: active ? colors.white : tint }]}>
                      <Ionicons name={s.icon} size={18} color={accent} />
                    </View>
                  ) : null}
                  <View style={styles.situationText}>
                    <Text style={[styles.situationLabel, active && { color: accent }]}>{s.label}</Text>
                    {s.hint ? <Text style={styles.situationHint}>{s.hint}</Text> : null}
                  </View>
                  <Ionicons
                    name={active ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={active ? accent : colors.border}
                  />
                </PressableScale>
              );
            })}
          </View>
          {bloque && suggestion ? (
            <View style={[styles.alerte, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="warning-outline" size={14} color={colors.danger} />
              <Text style={[styles.alerteText, { color: colors.danger }]}>
                {suggestion.alertes[0] ?? suggestion.resume}
              </Text>
            </View>
          ) : null}
          <GhostButton
            label="Continuer — choisir le pansement"
            icon="arrow-forward"
            color={accent}
            disabled={!canGoStep2}
            onPress={() => go(2)}
          />
          {!canGoStep2 ? (
            <Text style={styles.gate}>Sélectionnez un profil de plaie pour continuer.</Text>
          ) : null}
        </Animated.View>
      ) : null}

      {step === 2 && suggestion ? (
        <Animated.View key="s2" entering={FadeInRight.duration(220)} style={styles.panel}>
          <Text style={styles.question}>Quels pansements prescrire ?</Text>
          <Text style={styles.hint}>
            {situation?.label} — {suggestion.resume}
          </Text>
          {suggestion.duree ? (
            <View style={[styles.dureeBox, { backgroundColor: tint }]}>
              <Ionicons name="calendar-outline" size={14} color={accent} />
              <Text style={[styles.dureeText, { color: accent }]}>{suggestion.duree}</Text>
            </View>
          ) : null}
          <View style={styles.libelles}>
            {suggestion.libelles.map((libelle) => {
              const on = selected.has(libelle);
              return (
                <PressableScale
                  key={libelle}
                  scaleTo={0.98}
                  accessibilityRole="checkbox"
                  accessibilityLabel={libelle}
                  onPress={() => toggleLibelle(libelle)}
                  style={[styles.libelleRow, on && { borderColor: accent, backgroundColor: tint }]}
                >
                  <Ionicons
                    name={on ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={on ? accent : colors.muted}
                  />
                  <Text style={styles.libelleText}>{libelle}</Text>
                </PressableScale>
              );
            })}
          </View>
          {suggestion.notes.map((n) => (
            <View key={n} style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
              <Text style={styles.noteText}>{n}</Text>
            </View>
          ))}
          {suggestion.alertes.map((a) => (
            <View key={a} style={[styles.alerte, { backgroundColor: colors.warnSoft }]}>
              <Ionicons name="warning-outline" size={14} color={colors.warn} />
              <Text style={[styles.alerteText, { color: colors.warn }]}>{a}</Text>
            </View>
          ))}
          <View style={styles.navRow}>
            <GhostButton label="Retour" icon="arrow-back" color={colors.muted} onPress={() => go(1)} />
            <GhostButton
              label="Résumé et cases"
              icon="arrow-forward"
              color={accent}
              disabled={!canGoStep3}
              onPress={() => go(3)}
            />
          </View>
          {!canGoStep3 ? (
            <Text style={styles.gate}>Cochez au moins un pansement (ou revenez si hors cadre).</Text>
          ) : null}
        </Animated.View>
      ) : null}

      {step === 3 && suggestion && situation ? (
        <Animated.View key="s3" entering={FadeInRight.duration(220)} style={styles.panel}>
          <Text style={styles.question}>Résumé de votre demande</Text>
          <View style={[styles.resumeCard, { borderColor: accent }]}>
            <Text style={[styles.resumeLabel, { color: accent }]}>Profil de plaie</Text>
            <Text style={styles.resumeValue}>{situation.label}</Text>
            <Text style={[styles.resumeLabel, { color: accent }]}>Pansements</Text>
            {[...selected].map((l) => (
              <Text key={l} style={styles.resumeLibelle}>
                • {l}
              </Text>
            ))}
            {suggestion.duree ? (
              <>
                <Text style={[styles.resumeLabel, { color: accent }]}>Durée</Text>
                <Text style={styles.resumeValue}>{suggestion.duree}</Text>
              </>
            ) : null}
          </View>

          <CommentPrescrire accent={accent} tint={tint} compact />

          <GhostButton
            label="Copier le résumé"
            icon="clipboard-outline"
            color={accent}
            onPress={copySelection}
          />

          <FicheChecklist item={item} />

          <GhostButton label="Modifier le choix" icon="create-outline" color={colors.muted} onPress={() => go(2)} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function StepHeader({ step, accent, tint }: { step: Step; accent: string; tint: string }) {
  const labels = ['Plaie', 'Pansement', 'Résumé'];
  return (
    <View style={styles.steps}>
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = step === n;
        const done = step > n;
        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                { backgroundColor: tint },
                (active || done) && { backgroundColor: accent },
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={12} color={colors.white} />
              ) : (
                <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{n}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, active && { color: accent, fontWeight: '800' }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 4 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '800', color: colors.muted },
  stepNumActive: { color: colors.white },
  stepLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  panel: { gap: spacing.sm },
  question: { ...typography.subtitle, color: colors.ink, fontSize: 16 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -4 },
  situations: { gap: spacing.xs },
  situationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  situationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  situationText: { flex: 1, gap: 2 },
  situationLabel: { ...typography.caption, color: colors.ink, fontWeight: '800', fontSize: 14 },
  situationHint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  dureeBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  dureeText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
  libelles: { gap: spacing.xs },
  libelleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  libelleText: { flex: 1, color: colors.ink, fontSize: 13.5, lineHeight: 19, fontWeight: '600' },
  noteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  noteText: { flex: 1, color: colors.muted, fontSize: 12.5, lineHeight: 17 },
  alerte: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  alerteText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  gate: { color: colors.mutedLight, fontSize: 12, fontWeight: '600' },
  resumeCard: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  resumeLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 6 },
  resumeValue: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  resumeLibelle: { color: colors.inkSoft, fontSize: 13.5, lineHeight: 19 },
});
