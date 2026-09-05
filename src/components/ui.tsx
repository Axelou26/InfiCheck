import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, gradients, radii, shadow, spacing, typography } from '../theme';
import { haptic, type HapticKind } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type Tone = 'primary' | 'accent' | 'warn' | 'danger' | 'ok' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  warn: { bg: colors.warnSoft, fg: colors.warn },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  ok: { bg: colors.okSoft, fg: colors.ok },
  neutral: { bg: colors.surfaceMuted, fg: colors.muted },
};

export function toneColors(tone: Tone) {
  return TONES[tone];
}

export function Screen({
  children,
  contentStyle,
}: {
  children: ReactNode;
  contentStyle?: ViewStyle;
}) {
  return <View style={[styles.screen, contentStyle]}>{children}</View>;
}

/**
 * Pression avec ressort + retour haptique — la brique tactile de toute l'app.
 * `style` accepte un tableau pour composer avec les styles de carte.
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  scaleTo = 0.97,
  feedback = 'light',
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  feedback?: HapticKind;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'checkbox' | 'tab';
}) {
  const press = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * (1 - scaleTo) }],
    opacity: 1 - press.value * 0.1,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        press.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 16, stiffness: 280, mass: 0.5 });
      }}
      onPress={
        onPress
          ? () => {
              haptic(feedback);
              onPress();
            }
          : undefined
      }
      onLongPress={
        onLongPress
          ? () => {
              haptic('medium');
              onLongPress();
            }
          : undefined
      }
      style={[style, animated, disabled && styles.disabled]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  elevation = 'card',
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 'flat' | 'card' | 'raised';
  accessibilityLabel?: string;
}) {
  const elevationStyle =
    elevation === 'flat' ? undefined : elevation === 'raised' ? shadow.raised : shadow.card;

  if (onPress || onLongPress) {
    return (
      <PressableScale
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, elevationStyle, style]}
      >
        {children}
      </PressableScale>
    );
  }
  return <View style={[styles.card, elevationStyle, style]}>{children}</View>;
}

/** Alias historique conservé pour éviter une migration inutile des appels existants. */
export const SoftCard = Card;

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function SectionHeader({
  label,
  title,
  hint,
  trailing,
}: {
  label?: string;
  title?: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
        {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function Pill({
  label,
  tone = 'primary',
  icon,
  dot,
  style,
  textStyle,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {dot ? <View style={[styles.pillDot, { backgroundColor: fg }]} /> : null}
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={[styles.pillText, { color: fg }, textStyle]}>{label}</Text>
    </View>
  );
}

export function GradientPill({
  label,
  gradient,
  icon,
}: {
  label: string;
  gradient: readonly [string, string, ...string[]];
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.pill, styles.gradientPill]}
    >
      {icon ? <Ionicons name={icon} size={12} color={colors.white} /> : null}
      <Text style={[styles.pillText, { color: colors.white }]}>{label}</Text>
    </LinearGradient>
  );
}

export function IconBubble({
  icon,
  color,
  background,
  size = 44,
  gradient,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  size?: number;
  gradient?: readonly [string, string, ...string[]];
}) {
  const inner = <Ionicons name={icon} size={size * 0.48} color={color ?? colors.white} />;
  const frame = { width: size, height: size, borderRadius: size / 2 };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bubble, frame]}
      >
        {inner}
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.bubble, frame, { backgroundColor: background ?? colors.primarySoft }]}>
      {inner}
    </View>
  );
}

export function IconTile({
  icon,
  label,
  sublabel,
  onPress,
  tone = 'primary',
  gradient,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  onPress: () => void;
  tone?: Tone;
  gradient?: readonly [string, string, ...string[]];
}) {
  const { bg, fg } = TONES[tone];
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.tile}>
      <IconBubble icon={icon} color={gradient ? colors.white : fg} background={bg} gradient={gradient} size={40} />
      <View style={styles.tileText}>
        <Text style={styles.tileLabel}>{label}</Text>
        {sublabel ? <Text style={styles.tileSub}>{sublabel}</Text> : null}
      </View>
    </PressableScale>
  );
}

export function ChevronRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  style,
}: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={title}
      scaleTo={0.985}
      style={[styles.row, style]}
    >
      {leading}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {trailing}
      <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
    </PressableScale>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/** Barre de progression animée, avec dégradé. */
export function ProgressBar({
  value,
  gradient = gradients.primary,
  height = 10,
  track = colors.surfaceMuted,
}: {
  value: number;
  gradient?: readonly [string, string, ...string[]];
  height?: number;
  track?: string;
}) {
  const progress = useSharedValue(0);
  const clamped = Math.max(0, Math.min(1, value));

  useEffect(() => {
    progress.value = withSpring(clamped, { damping: 18, stiffness: 120, mass: 0.6 });
  }, [clamped, progress]);

  const animated = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <Animated.View style={[styles.progressFill, animated]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Placeholder pulsé pendant les requêtes SQLite. */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = radii.xs,
  delay = 0,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1),
    );
  }, [delay, pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceMuted }, animated, style]}
    />
  );
}

export function SkeletonCard({ lines = 3, delay = 0 }: { lines?: number; delay?: number }) {
  return (
    <View style={[styles.card, shadow.card, styles.skeletonCard]}>
      <Skeleton width="38%" height={18} radius={radii.full} delay={delay} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '55%' : '92%'}
          height={12}
          delay={delay + i * 90}
        />
      ))}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.empty}>
      <View style={styles.emptyBubble}>
        <Ionicons name={icon} size={30} color={colors.primaryMid} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
      {action}
    </Animated.View>
  );
}

/** Apparition décalée pour les listes courtes non virtualisées. */
export function Stagger({
  index = 0,
  children,
  step = 45,
}: {
  index?: number;
  children: ReactNode;
  step?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * step).duration(360)}>
      {children}
    </Animated.View>
  );
}

/** Toast bas d'écran, utilisé pour confirmer les copies presse-papier. */
export function Toast({ label, visible }: { label: string; visible: boolean }) {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.value = withSpring(visible ? 1 : 0, { damping: 18, stiffness: 200 });
  }, [visible, shown]);

  const animated = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: interpolate(shown.value, [0, 1], [24, 0]) }],
  }));

  return (
    <Animated.View style={[styles.toast, animated]}>
      <Ionicons name="checkmark-circle" size={18} color={colors.white} />
      <Text style={styles.toastText}>{label}</Text>
    </Animated.View>
  );
}

const DISABLED_GRADIENT = [colors.mutedLight, colors.muted] as const;

export function PrimaryButton({
  label,
  icon,
  onPress,
  gradient = gradients.primary,
  disabled,
  style,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[styles.buttonShadow, style]}
    >
      <LinearGradient
        colors={disabled ? DISABLED_GRADIENT : gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.white} /> : null}
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

export function GhostButton({
  label,
  icon,
  onPress,
  color = colors.primary,
  style,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.ghostButton, { borderColor: color }, style]}
    >
      {icon ? <Ionicons name={icon} size={17} color={color} /> : null}
      <Text style={[styles.ghostButtonText, { color }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  disabled: { opacity: 0.45 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  skeletonCard: { gap: spacing.sm },
  sectionLabel: { ...typography.section, color: colors.mutedLight },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionHeaderText: { flex: 1, gap: 3 },
  sectionTitle: { ...typography.subtitle, color: colors.ink },
  sectionHint: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  gradientPill: { paddingVertical: 6 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { ...typography.micro },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 116,
    ...shadow.card,
  },
  tileText: { gap: 2 },
  tileLabel: { ...typography.label, color: colors.ink },
  tileSub: { color: colors.mutedLight, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontWeight: '700', fontSize: 16, lineHeight: 21 },
  rowSub: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.borderSoft },
  progressTrack: { width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', overflow: 'hidden', borderRadius: radii.full },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  emptyBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.bodyStrong, color: colors.ink, fontSize: 17, textAlign: 'center' },
  emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
  toast: {
    position: 'absolute',
    pointerEvents: 'none',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDeep,
    borderRadius: radii.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    ...shadow.floating,
  },
  toastText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  buttonShadow: { borderRadius: radii.md, ...shadow.card },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.md,
  },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  ghostButtonText: { fontWeight: '800', fontSize: 15 },
});
