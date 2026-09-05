import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { checklistForItem } from '../data/checklist';
import { colors, gradients, radii, spacing } from '../theme';
import type { ArreteItem } from '../types';
import { ChecklistRow } from './ChecklistRow';
import { ProgressBar, SectionHeader } from './ui';

export function FicheChecklist({ item }: { item: ArreteItem }) {
  const points = useMemo(() => checklistForItem(item), [item]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const count = points.filter((point) => checked[point.id]).length;
  const done = count === points.length && points.length > 0;

  return (
    <View style={styles.wrap}>
      <SectionHeader
        label="Avant de prescrire"
        hint="Points utiles pour cette rubrique. Rien n’est enregistré."
        trailing={
          <View style={[styles.counter, done && styles.counterDone]}>
            <Text style={[styles.counterText, done && styles.counterTextDone]}>
              {count}/{points.length}
            </Text>
          </View>
        }
      />
      <ProgressBar
        value={points.length === 0 ? 0 : count / points.length}
        gradient={done ? DONE_GRADIENT : gradients.primary}
        height={6}
      />
      <View style={styles.list}>
        {points.map((point, i) => (
          <ChecklistRow
            key={point.id}
            label={point.label}
            index={i}
            checked={!!checked[point.id]}
            onToggle={() => setChecked((prev) => ({ ...prev, [point.id]: !prev[point.id] }))}
          />
        ))}
      </View>
      {done ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.done}>
          <Animated.View entering={FadeIn.delay(120).duration(300)}>
            <Ionicons name="shield-checkmark" size={18} color={colors.ok} />
          </Animated.View>
          <Text style={styles.doneText}>
            Garde-fous cochés. Tracez au dossier patient ou au DMP, puis jugez cliniquement.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const DONE_GRADIENT = [colors.ok, '#2E5638'] as const;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  counter: {
    minWidth: 44,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  counterDone: { backgroundColor: colors.okSoft },
  counterText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  counterTextDone: { color: colors.ok },
  list: { gap: spacing.xs },
  done: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.okSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.ok,
    padding: spacing.sm,
  },
  doneText: { flex: 1, color: colors.ink, fontSize: 13.5, lineHeight: 19, fontWeight: '600' },
});
