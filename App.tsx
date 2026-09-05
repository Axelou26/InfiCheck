import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GhostButton, ProgressBar } from './src/components/ui';
import { ContentUpdateProvider } from './src/content/ContentUpdateProvider';
import { initDatabase } from './src/db/database';
import { RootNavigator } from './src/navigation/RootNavigator';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { isAcceptanceCurrent, readDisclaimerAcceptance } from './src/storage/preferences';
import { colors, gradients, radii, spacing, typography } from './src/theme';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    // Les deux lectures sont indépendantes : les paralléliser évite d'afficher
    // brièvement l'app avant l'écran de conditions.
    Promise.all([initDatabase(), readDisclaimerAcceptance()])
      .then(([, acceptance]) => {
        setConsented(isAcceptanceCurrent(acceptance));
        setReady(true);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Erreur d’initialisation');
      });
  }, []);

  useEffect(load, [load]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BootScreen error={error} onRetry={load} />
      </SafeAreaProvider>
    );
  }

  if (!consented || reviewing) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen
          review={consented}
          onDone={() => {
            setConsented(true);
            setReviewing(false);
          }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ContentUpdateProvider>
        <RootNavigator onReviewTerms={() => setReviewing(true)} />
      </ContentUpdateProvider>
    </SafeAreaProvider>
  );
}

function BootScreen({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (error) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [error, pulse]);

  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.boot}
    >
      <Animated.View entering={FadeIn.duration(400)} style={styles.bootInner}>
        <Animated.View style={[styles.logo, logoStyle]}>
          <Ionicons name={error ? 'warning' : 'medkit'} size={34} color={colors.white} />
        </Animated.View>

        <Text style={styles.brand}>
          <Text style={styles.brandAccent}>Infi</Text>
          <Text style={styles.brandMain}>check</Text>
        </Text>

        {error ? (
          <Animated.View entering={FadeInDown.duration(320)} style={styles.errorBlock}>
            <Text style={styles.errorTitle}>Base de données indisponible</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <GhostButton
              label="Réessayer"
              icon="refresh"
              color={colors.white}
              onPress={onRetry}
              style={styles.retry}
            />
          </Animated.View>
        ) : (
          <View style={styles.loadingBlock}>
            <Text style={styles.loadingText}>Préparation de la base BDPM locale…</Text>
            <View style={styles.progressWrap}>
              <IndeterminateBar />
            </View>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

/** Barre d'attente : la durée d'ouverture SQLite n'est pas mesurable, on boucle. */
function IndeterminateBar() {
  const [tick, setTick] = useState(0.15);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((prev) => (prev >= 0.95 ? 0.15 : prev + 0.12));
    }, 420);
    return () => clearInterval(id);
  }, []);

  return (
    <ProgressBar value={tick} gradient={['#EDB395', '#FFFFFF']} track="rgba(0,0,0,0.25)" height={6} />
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  bootInner: { alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: 340 },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...typography.hero },
  brandAccent: { color: '#EDB395' },
  brandMain: { color: colors.white },
  loadingBlock: { alignItems: 'center', gap: spacing.sm, width: '100%' },
  loadingText: { color: colors.onDarkSoft, fontSize: 14, textAlign: 'center' },
  progressWrap: { width: '70%' },
  errorBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radii.md,
    padding: spacing.md,
    width: '100%',
  },
  errorTitle: { color: colors.white, fontWeight: '800', fontSize: 16, textAlign: 'center' },
  errorBody: {
    color: colors.onDarkSoft,
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
  retry: { alignSelf: 'stretch', backgroundColor: 'transparent' },
});
