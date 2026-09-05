import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ARRETE_META } from '../data/arreteCatalog';
import { colors, radii, spacing } from '../theme';
import { PressableScale } from './ui';

export function DisclaimerBanner({ onPress }: { onPress?: () => void }) {
  const content = (
    <>
      <View style={styles.iconWrap}>
        <Ionicons name="alert-circle" size={18} color={colors.warn} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Aide à la pratique — pas une source de droit</Text>
        <Text style={styles.body}>
          Arrêté {ARRETE_META.nor} · {ARRETE_META.jo}. Seul Légifrance fait foi. Tracer au dossier
          patient ou au DMP (Art. 2).
        </Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.warn} /> : null}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityLabel="Mentions légales et sources"
        style={styles.box}
      >
        {content}
      </PressableScale>
    );
  }

  return <View style={styles.box}>{content}</View>;
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warnSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#EAD8B4',
    padding: spacing.sm,
    paddingRight: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(143, 101, 32, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 3 },
  title: { color: colors.warn, fontWeight: '800', fontSize: 13, lineHeight: 17 },
  body: { color: colors.inkSoft, fontSize: 12.5, lineHeight: 17 },
});
