import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChecklistRow } from '../components/ChecklistRow';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { GhostButton, ProgressBar, SectionHeader } from '../components/ui';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';

const ITEMS = [
  {
    id: 'liste',
    label: 'L’item figure bien dans la liste fermée de l’arrêté du 26 juin 2026',
  },
  {
    id: 'modalite',
    label: 'La modalité est correcte : prescription de 1re intention ou renouvellement',
  },
  {
    id: 'conditions',
    label: 'Les conditions sont remplies (âge, durée, exclusions, formation vaccins…)',
  },
  {
    id: 'tracabilite',
    label: 'Traçabilité prévue au dossier patient ou au DMP (Art. 2)',
  },
  {
    id: 'art3',
    label: 'Si renouvellement : prescription initiale consultable par le pharmacien (Art. 3)',
  },
  {
    id: 'annexe2',
    label:
      'Si contraceptifs oraux : mentions Annexe II sur l’ordonnance (nom, n°, « Renouvellement infirmier », durée ≤ 6 mois, date)',
  },
] as const;

export function ChecklistScreen() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const progress = useMemo(() => ITEMS.filter((item) => checked[item.id]).length, [checked]);
  const done = progress === ITEMS.length;

  const scorePop = useSharedValue(1);
  const scoreStyle = useAnimatedStyle(() => ({ transform: [{ scale: scorePop.value }] }));

  useEffect(() => {
    scorePop.value = withSequence(
      withTiming(1.12, { duration: 110 }),
      withSpring(1, { damping: 12, stiffness: 240 }),
    );
  }, [progress, scorePop]);

  useEffect(() => {
    if (done) haptic('success');
  }, [done]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={done ? ['#4C8259', '#325C41'] : ['#4E6650', '#37493A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scoreCard}
      >
        <View style={styles.scoreTop}>
          <View style={styles.scoreText}>
            <Text style={styles.scoreKicker}>Garde-fous de l’arrêté</Text>
            <Animated.Text style={[styles.scoreValue, scoreStyle]}>
              {progress}
              <Text style={styles.scoreTotal}>/{ITEMS.length}</Text>
            </Animated.Text>
          </View>
          <View style={[styles.scoreIcon, done && styles.scoreIconDone]}>
            <Ionicons
              name={done ? 'shield-checkmark' : 'shield-half'}
              size={26}
              color={colors.white}
            />
          </View>
        </View>

        <ProgressBar
          value={progress / ITEMS.length}
          gradient={['#FFFFFF', 'rgba(255,255,255,0.75)']}
          track="rgba(0,0,0,0.22)"
          height={8}
        />

        <Text style={styles.scoreMessage}>
          {done
            ? 'Checklist complète — tracez au dossier et procédez selon votre jugement clinique.'
            : `Encore ${ITEMS.length - progress} point${ITEMS.length - progress > 1 ? 's' : ''} à vérifier avant de prescrire.`}
        </Text>
      </LinearGradient>

      <DisclaimerBanner />

      <SectionHeader
        label="Points de contrôle"
        hint="Touchez une ligne pour la valider. Rien n’est enregistré : la liste se réinitialise à chaque situation."
      />

      <View style={styles.list}>
        {ITEMS.map((item, i) => (
          <Animated.View key={item.id} entering={FadeInDown.delay(i * 50).duration(320)}>
            <ChecklistRow
              label={item.label}
              index={i}
              checked={!!checked[item.id]}
              onToggle={() => setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
            />
          </Animated.View>
        ))}
      </View>

      {done ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.doneCard}>
          <Ionicons name="checkmark-done-circle" size={22} color={colors.ok} />
          <Text style={styles.doneText}>
            Les six garde-fous sont validés. N’oubliez pas l’inscription au dossier patient ou au
            DMP (Art. 2).
          </Text>
        </Animated.View>
      ) : null}

      {progress > 0 ? (
        <GhostButton
          label="Réinitialiser la checklist"
          icon="refresh"
          color={colors.muted}
          onPress={() => {
            haptic('medium');
            setChecked({});
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: TAB_BAR_CLEARANCE },
  scoreCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.raised,
  },
  scoreTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreText: { gap: 2 },
  scoreKicker: { ...typography.micro, color: colors.onDarkSoft, letterSpacing: 1 },
  scoreValue: { color: colors.white, fontSize: 38, fontWeight: '800', letterSpacing: -1.4 },
  scoreTotal: { color: colors.onDarkSoft, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  scoreIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreIconDone: { backgroundColor: 'rgba(255,255,255,0.26)' },
  scoreMessage: { color: colors.onDark, fontSize: 13.5, lineHeight: 19 },
  list: { gap: spacing.sm },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.okSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.ok,
    padding: spacing.md,
  },
  doneText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' },
});
