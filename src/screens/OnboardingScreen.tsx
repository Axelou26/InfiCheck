import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChecklistRow } from '../components/ChecklistRow';
import { PressableScale, PrimaryButton } from '../components/ui';
import { ARRETE_ITEMS, ARRETE_META, DOMAINES } from '../data/arreteCatalog';
import { getMeta } from '../db/database';
import { acceptDisclaimer } from '../storage/preferences';
import { colors, gradients, radii, shadow, spacing, typography } from '../theme';

type Point = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  title: string;
  body: string;
};

const POINTS: Point[] = [
  {
    icon: 'albums',
    color: '#2F6E75',
    tint: '#E1EEF0',
    title: 'Une liste fermée',
    body: `L’arrêté autorise ${DOMAINES.length} domaines et ${ARRETE_ITEMS.length} rubriques, pas un de plus. En dehors de cette liste, la prescription infirmière n’est pas autorisée.`,
  },
  {
    icon: 'library',
    color: '#8A6520',
    tint: '#F8EEDA',
    title: 'Seul le texte officiel fait foi',
    body: 'Inficheck reformule l’arrêté pour la pratique de terrain. Ce n’est pas une source de droit : en cas de doute, c’est Légifrance et le Journal officiel qui tranchent.',
  },
  {
    icon: 'medical',
    color: '#8C3F60',
    tint: '#F6E4EC',
    title: 'Votre jugement clinique décide',
    body: 'L’application ne remplace ni l’examen du patient, ni la coordination avec le médecin. Une rubrique « autorisée » ne veut pas dire « indiquée ».',
  },
  {
    icon: 'create',
    color: '#4A7343',
    tint: '#E5EFE1',
    title: 'Tracez systématiquement',
    body: 'Toute prescription relevant de l’arrêté doit être inscrite au dossier patient ou au dossier médical partagé (Art. 2).',
  },
];

export function OnboardingScreen({
  onDone,
  review = false,
}: {
  onDone: () => void;
  /** Relecture depuis les mentions légales : consentement déjà acquis. */
  review?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(review);
  const [importedAt, setImportedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMeta('bdpm_imported_at').then((v) => setImportedAt(v));
  }, []);

  async function confirm() {
    setSaving(true);
    // En relecture, le consentement existe déjà : ne pas écraser sa date.
    if (!review) {
      await acceptDisclaimer();
    }
    onDone();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <Animated.View entering={FadeIn.duration(420)} style={styles.heroInner}>
            <View style={styles.logo}>
              <Ionicons name="medkit" size={26} color={colors.white} />
            </View>
            <Text style={styles.brand}>
              <Text style={styles.brandAccent}>Infi</Text>
              <Text style={styles.brandMain}>check</Text>
            </Text>
            <Text style={styles.heroTitle}>
              {review ? 'Conditions d’usage' : 'Avant de commencer'}
            </Text>
            <Text style={styles.heroBody}>
              Quatre points à connaître pour utiliser l’application sans risque.
            </Text>
            <View style={styles.refChip}>
              <Ionicons name="document-text" size={12} color={colors.white} />
              <Text style={styles.refChipText}>
                Arrêté du 26 juin 2026 · NOR {ARRETE_META.nor}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.body}>
          {POINTS.map((point, i) => (
            <Animated.View
              key={point.title}
              entering={FadeInDown.delay(120 + i * 70).duration(360)}
              style={styles.pointCard}
            >
              <View style={[styles.pointIcon, { backgroundColor: point.tint }]}>
                <Ionicons name={point.icon} size={19} color={point.color} />
              </View>
              <View style={styles.pointText}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointBody}>{point.body}</Text>
              </View>
            </Animated.View>
          ))}

          <Animated.View entering={FadeInDown.delay(420).duration(360)} style={styles.dataNote}>
            <Ionicons name="cloud-offline" size={15} color={colors.muted} />
            <Text style={styles.dataNoteText}>
              Les données médicaments fonctionnent hors ligne : elles sont figées à la date
              d’import{importedAt ? ` (${importedAt})` : ''}. Vérifiez toujours la notice et la
              disponibilité réelle du produit.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(480).duration(360)} style={styles.consentBlock}>
            <ChecklistRow
              label="J’ai compris qu’Inficheck est une aide à la pratique, qu’elle ne se substitue pas au texte officiel ni à mon jugement clinique, et que la traçabilité reste à ma charge."
              checked={accepted}
              onToggle={() => setAccepted((prev) => !prev)}
            />

            <PrimaryButton
              label={
                review
                  ? 'Fermer'
                  : accepted
                    ? 'Commencer'
                    : 'Cochez la case pour continuer'
              }
              icon={review ? 'checkmark' : accepted ? 'arrow-forward' : 'lock-closed'}
              disabled={!accepted || saving}
              onPress={confirm}
            />

            <PressableScale
              accessibilityRole="link"
              accessibilityLabel="Lire l’arrêté sur Légifrance"
              scaleTo={0.97}
              onPress={() => Linking.openURL(ARRETE_META.legifrance)}
              style={styles.legifrance}
            >
              <Ionicons name="open-outline" size={15} color={colors.primary} />
              <Text style={styles.legifranceText}>Lire l’arrêté sur Légifrance</Text>
            </PressableScale>

            {review ? null : (
              <Text style={styles.footnote}>
                Ces conditions restent consultables à tout moment depuis les mentions légales.
              </Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1 },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  heroInner: { gap: spacing.xs },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brand: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  brandAccent: { color: '#EDB395' },
  brandMain: { color: colors.white },
  heroTitle: { ...typography.title, color: colors.white, marginTop: spacing.xs },
  heroBody: { color: colors.onDark, fontSize: 15, lineHeight: 22, maxWidth: 320 },
  refChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  refChipText: { ...typography.micro, color: colors.white },
  body: { padding: spacing.md, gap: spacing.sm },
  pointCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  pointIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointText: { flex: 1, gap: 3 },
  pointTitle: { ...typography.bodyStrong, fontSize: 15.5, color: colors.ink },
  pointBody: { color: colors.muted, fontSize: 13.5, lineHeight: 19 },
  dataNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  dataNoteText: { flex: 1, color: colors.muted, fontSize: 12.5, lineHeight: 18 },
  consentBlock: { gap: spacing.sm, marginTop: spacing.sm },
  legifrance: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  legifranceText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  footnote: {
    color: colors.mutedLight,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
