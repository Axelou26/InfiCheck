import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radii, shadow, spacing } from '../theme';
import { haptic } from '../utils/haptics';
import type { TabParamList } from './types';

const TABS: Record<
  keyof TabParamList,
  { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }
> = {
  Accueil: { label: 'Recherche', icon: 'search-outline', active: 'search' },
  Catalogue: { label: 'Catalogue', icon: 'albums-outline', active: 'albums' },
  Medicaments: { label: 'Liste IDE', icon: 'flask-outline', active: 'flask' },
};

/** Hauteur réservée sous les listes pour ne pas passer sous la barre flottante. */
export const TAB_BAR_CLEARANCE = 108;

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const position = useSharedValue(state.index);

  useEffect(() => {
    position.value = withSpring(state.index, { damping: 18, stiffness: 190, mass: 0.7 });
  }, [state.index, position]);

  const slotWidth = width > 0 ? (width - 2 * PADDING) / state.routes.length : 0;

  const indicator = useAnimatedStyle(() => ({
    width: slotWidth,
    transform: [{ translateX: position.value * slotWidth }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {slotWidth > 0 ? (
          <Animated.View style={[styles.indicator, indicator]}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => (
          <TabItem
            key={route.key}
            name={route.name as keyof TabParamList}
            focused={state.index === index}
            onPress={() => {
              if (state.index === index) {
                navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                return;
              }
              haptic('select');
              navigation.navigate(route.name);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabItem({
  name,
  focused,
  onPress,
}: {
  name: keyof TabParamList;
  focused: boolean;
  onPress: () => void;
}) {
  const config = TABS[name];
  const on = useSharedValue(focused ? 1 : 0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, { duration: 220 });
    if (!focused) return;
    bounce.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 11, stiffness: 260 }),
    );
  }, [focused, on, bounce]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(on.value, [0, 1], [1, 1.06]) + bounce.value * 0.16 },
      { translateY: interpolate(on.value, [0, 1], [0, -1]) - bounce.value * 3 },
    ],
  }));

  /** Les deux icônes sont superposées : le passage plein/contour suit le curseur. */
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: on.value }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [colors.mutedLight, colors.white]),
    opacity: interpolate(on.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={config.label}
      style={styles.item}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name={config.icon} size={21} color={colors.mutedLight} />
        <Animated.View style={[StyleSheet.absoluteFill, activeIconStyle]}>
          <Ionicons name={config.active} size={21} color={colors.white} />
        </Animated.View>
      </Animated.View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
        {config.label}
      </Animated.Text>
    </Pressable>
  );
}

const PADDING = 6;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: PADDING,
    ...shadow.floating,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadow.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.1 },
});
