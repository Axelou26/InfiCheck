import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radii, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { PressableScale } from './ui';

/** Bouton retour — à placer dans les héros / tops d’écran (plus de barre native). */
export function BackButton({
  light = false,
  label = 'Retour',
}: {
  light?: boolean;
  label?: string;
}) {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;

  const fg = light ? colors.white : colors.primary;
  const bg = light ? 'rgba(255,255,255,0.18)' : colors.primarySoft;

  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={() => {
        haptic('light');
        navigation.goBack();
      }}
      scaleTo={0.94}
      style={[styles.backBtn, { backgroundColor: bg }]}
    >
      <Ionicons name="chevron-back" size={18} color={fg} />
      <Text style={[styles.backLabel, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}

/** Header des écrans racine d’onglet (Catalogue, Liste IDE). */
export function TabRootHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.rootHeader, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.rootHeaderRow}>
        {icon ? (
          <View style={styles.rootHeaderIcon}>
            <Ionicons name={icon} size={18} color={colors.white} />
          </View>
        ) : null}
        <View style={styles.rootHeaderText}>
          <Text style={styles.rootHeaderTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rootHeaderSub}>{subtitle}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  backLabel: { fontSize: 14, fontWeight: '700' },
  rootHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    marginHorizontal: -spacing.md,
    marginBottom: spacing.xs,
  },
  rootHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rootHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootHeaderText: { flex: 1, gap: 2 },
  rootHeaderTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.white,
  },
  rootHeaderSub: {
    color: colors.onDarkSoft,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
