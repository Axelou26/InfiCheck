import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { PressableScale } from './ui';

/** Champ de recherche : anneau de focus animé + bouton d'effacement. */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  accent = colors.primary,
  variant = 'default',
  style,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  accent?: string;
  variant?: 'default' | 'onDark';
  style?: StyleProp<ViewStyle>;
}) {
  const focus = useSharedValue(0);
  const onDark = variant === 'onDark';
  const iconColor = onDark ? colors.white : accent;

  const animated = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      onDark ? ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.7)'] : [colors.border, accent],
    ),
    shadowOpacity: interpolate(focus.value, [0, 1], [0.06, 0.16]),
  }));

  const iconAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(focus.value, [0, 1], [1, 1.12]) }],
  }));

  return (
    <Animated.View
      style={[styles.searchWrap, onDark && styles.searchWrapOnDark, animated, style]}
    >
      <Animated.View style={iconAnimated}>
        <Ionicons name="search" size={19} color={iconColor} />
      </Animated.View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onDark ? colors.onDarkSoft : colors.mutedLight}
        style={[styles.searchInput, onDark && styles.searchInputOnDark]}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        returnKeyType="search"
        onFocus={() => {
          focus.value = withTiming(1, { duration: 180 });
        }}
        onBlur={() => {
          focus.value = withTiming(0, { duration: 180 });
        }}
      />
      {value.length > 0 ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)}>
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Effacer la recherche"
            onPress={() => {
              haptic('select');
              onChangeText('');
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close" size={14} color={colors.white} />
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

/** Sélecteur segmenté avec curseur glissant. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = colors.primary,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  accent?: string;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const position = useSharedValue(index);

  useEffect(() => {
    position.value = withSpring(index, { damping: 18, stiffness: 220, mass: 0.6 });
  }, [index, position]);

  const segmentWidth = width > 0 ? (width - 8) / options.length : 0;

  const indicator = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  return (
    <View style={styles.segmentTrack} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {segmentWidth > 0 ? (
        <Animated.View style={[styles.segmentIndicator, { backgroundColor: accent }, indicator]} />
      ) : null}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={styles.segment}
            onPress={() => {
              if (active) return;
              haptic('select');
              onChange(option.value);
            }}
          >
            <Text
              numberOfLines={1}
              style={[styles.segmentText, active && styles.segmentTextActive]}
            >
              {option.label}
              {option.count !== undefined ? ` ${option.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Puce de filtre : couleur de fond animée entre l'état inactif et la teinte du filtre. */
export function FilterChip({
  label,
  active,
  onPress,
  color = colors.primary,
  tint = colors.primarySoft,
  count,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  tint?: string;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const on = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    on.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active, on]);

  const chip = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.surface, color]),
    borderColor: interpolateColor(on.value, [0, 1], [colors.border, color]),
  }));

  const text = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [colors.inkSoft, colors.white]),
  }));

  const badge = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [tint, 'rgba(255,255,255,0.22)']),
  }));

  const badgeText = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [color, colors.white]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      feedback="select"
      scaleTo={0.94}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.chip, chip]}>
        {icon ? (
          <Ionicons name={icon} size={13} color={active ? colors.white : colors.inkSoft} />
        ) : null}
        <Animated.Text style={[styles.chipText, text]}>{label}</Animated.Text>
        {count !== undefined ? (
          <Animated.View style={[styles.chipBadge, badge]}>
            <Animated.Text style={[styles.chipBadgeText, badgeText]}>{count}</Animated.Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

/** Bloc repliable : chevron pivotant + contenu en fondu. */
export function Collapsible({
  title,
  subtitle,
  icon,
  accent = colors.primary,
  tint = colors.primaryTint,
  defaultOpen = false,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  tint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` }],
  }));

  return (
    <View style={[styles.collapsible, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        onPress={() => {
          haptic('select');
          rotation.value = withSpring(open ? 0 : 1, { damping: 15, stiffness: 220 });
          setOpen((prev) => !prev);
        }}
        style={styles.collapsibleHead}
      >
        {icon ? (
          <View style={[styles.collapsibleIcon, { backgroundColor: tint }]}>
            <Ionicons name={icon} size={16} color={accent} />
          </View>
        ) : null}
        <View style={styles.collapsibleText}>
          <Text style={styles.collapsibleTitle}>{title}</Text>
          {subtitle ? <Text style={styles.collapsibleSub}>{subtitle}</Text> : null}
        </View>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(120)}
          style={styles.collapsibleBody}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    height: 52,
    shadowColor: '#3D5140',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 3,
  },
  searchWrapOnDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    shadowOpacity: 0,
    elevation: 0,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  searchInputOnDark: { color: colors.white },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.mutedLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.bgSunken,
    borderRadius: radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radii.full,
    ...shadow.card,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9 },
  segmentText: { ...typography.caption, fontSize: 13, color: colors.muted },
  segmentTextActive: { color: colors.white, fontWeight: '800' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  chipBadge: { minWidth: 22, paddingHorizontal: 5, paddingVertical: 1, borderRadius: radii.full, alignItems: 'center' },
  chipBadgeText: { fontSize: 11, fontWeight: '800' },
  collapsible: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
    ...shadow.card,
  },
  collapsibleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  collapsibleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleText: { flex: 1, gap: 2 },
  collapsibleTitle: { color: colors.ink, fontWeight: '800', fontSize: 15, lineHeight: 20 },
  collapsibleSub: { color: colors.mutedLight, fontSize: 12, fontWeight: '600' },
  collapsibleBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
});
