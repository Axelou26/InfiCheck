import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { COMMENT_PRESCRIRE, COMMENT_PRESCRIRE_RESUME } from '../data/commentPrescrire';
import { colors, radii, spacing, typography } from '../theme';

/** Aide pratique : ce qu’il faut pour rédiger la prescription IDE. */
export function CommentPrescrire({
  accent = colors.primary,
  tint = colors.primaryTint,
  compact = false,
}: {
  accent?: string;
  tint?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: tint, borderColor: accent }]}>
        <Ionicons name="document-text-outline" size={16} color={accent} />
        <Text style={[styles.compactText, { color: accent }]}>{COMMENT_PRESCRIRE_RESUME}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: tint }]}>
        <Ionicons name="create-outline" size={16} color={accent} />
        <Text style={[styles.bannerText, { color: accent }]}>
          Ce qu’il faut concrètement pour rédiger — pas une e-prescription officielle.
        </Text>
      </View>
      {COMMENT_PRESCRIRE.map((point) => (
        <View key={point.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <View style={styles.rowText}>
            <Text style={styles.title}>{point.title}</Text>
            <Text style={styles.body}>{point.body}</Text>
          </View>
        </View>
      ))}
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
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  rowText: { flex: 1, gap: 2 },
  title: { ...typography.caption, color: colors.ink, fontWeight: '800', fontSize: 13 },
  body: { color: colors.inkSoft, fontSize: 13, lineHeight: 18 },
  compact: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  compactText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '600' },
});
