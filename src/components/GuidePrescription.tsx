import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getGuideForItem } from '../data/guidesPrescription';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { FilterChip } from './controls';
import { GhostButton, PressableScale } from './ui';

export function GuidePrescription({
  itemId,
  accent = colors.primary,
  tint = colors.primaryTint,
  onCopied,
}: {
  itemId: string;
  accent?: string;
  tint?: string;
  onCopied?: (text: string) => void;
}) {
  const guide = getGuideForItem(itemId);
  const [situationId, setSituationId] = useState(guide?.situations[0]?.id ?? '');

  const suggestion = useMemo(() => {
    if (!guide || !situationId) return null;
    return guide.resolve(situationId);
  }, [guide, situationId]);

  if (!guide) return null;

  const autorise = suggestion?.autorise !== false || (suggestion?.libelles.length ?? 0) > 0;
  const bloque = suggestion?.autorise === false;

  async function copyOne(text: string) {
    await Clipboard.setStringAsync(text);
    haptic('success');
    onCopied?.(text);
  }

  async function copyAll() {
    if (!suggestion?.libelles.length) return;
    const block = [
      suggestion.titre,
      suggestion.duree,
      ...suggestion.libelles,
    ]
      .filter(Boolean)
      .join('\n');
    await copyOne(block);
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: tint }]}>
        <Ionicons name="git-branch-outline" size={16} color={accent} />
        <Text style={[styles.bannerText, { color: accent }]}>
          Aide au choix — liste fermée de l’arrêté. Adapter au jugement clinique.
        </Text>
      </View>

      <Text style={styles.question}>{guide.question}</Text>
      <View style={styles.chips}>
        {guide.situations.map((s) => (
          <FilterChip
            key={s.id}
            label={s.label}
            active={situationId === s.id}
            onPress={() => setSituationId(s.id)}
            color={accent}
            tint={tint}
            icon={s.icon}
          />
        ))}
      </View>

      {guide.situations.find((s) => s.id === situationId)?.hint ? (
        <Text style={styles.hint}>
          {guide.situations.find((s) => s.id === situationId)?.hint}
        </Text>
      ) : null}

      {suggestion ? (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.result}>
          <View style={styles.resultHead}>
            <Text style={styles.resultTitle}>{suggestion.titre}</Text>
            {bloque ? (
              <View style={[styles.badge, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>Hors cadre</Text>
              </View>
            ) : autorise ? (
              <View style={[styles.badge, { backgroundColor: colors.okSoft }]}>
                <Text style={[styles.badgeText, { color: colors.ok }]}>Orientations</Text>
              </View>
            ) : null}
          </View>

          {suggestion.resume ? <Text style={styles.resume}>{suggestion.resume}</Text> : null}

          {suggestion.duree ? (
            <View style={[styles.dureeBox, { backgroundColor: tint }]}>
              <Ionicons name="calendar-outline" size={14} color={accent} />
              <Text style={[styles.dureeText, { color: accent }]}>{suggestion.duree}</Text>
            </View>
          ) : null}

          {suggestion.libelles.map((libelle) => (
            <PressableScale
              key={libelle}
              scaleTo={0.97}
              accessibilityLabel={`Copier ${libelle}`}
              onPress={() => copyOne(libelle)}
              style={styles.libelleRow}
            >
              <Ionicons name="copy-outline" size={15} color={accent} />
              <Text style={styles.libelleText}>{libelle}</Text>
            </PressableScale>
          ))}

          {suggestion.notes.map((n) => (
            <View key={n} style={styles.noteRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
              <Text style={styles.noteText}>{n}</Text>
            </View>
          ))}

          {suggestion.alertes.map((a) => (
            <View
              key={a}
              style={[
                styles.alerteRow,
                { backgroundColor: bloque ? colors.dangerSoft : colors.warnSoft },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={14}
                color={bloque ? colors.danger : colors.warn}
              />
              <Text
                style={[styles.alerteText, { color: bloque ? colors.danger : colors.warn }]}
              >
                {a}
              </Text>
            </View>
          ))}

          {suggestion.libelles.length > 1 ? (
            <GhostButton
              label="Tout copier"
              icon="clipboard-outline"
              color={accent}
              onPress={copyAll}
            />
          ) : null}
        </Animated.View>
      ) : null}
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
  question: { ...typography.caption, color: colors.muted, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { color: colors.mutedLight, fontSize: 12.5, fontWeight: '600', marginTop: -2 },
  result: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  resultTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.ink },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.full },
  badgeText: { fontSize: 11, fontWeight: '800' },
  resume: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  dureeBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  dureeText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '700' },
  libelleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
  },
  libelleText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontWeight: '600', color: colors.ink },
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
});
