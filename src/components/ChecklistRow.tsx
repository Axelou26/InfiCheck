import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, shadow, spacing } from '../theme';
import { PressableScale } from './ui';

type Props = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  index?: number;
};

export function ChecklistRow({ label, checked, onToggle, index }: Props) {
  const on = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    on.value = withSpring(checked ? 1 : 0, { damping: 14, stiffness: 200 });
  }, [checked, on]);

  const row = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.surface, colors.okSoft]),
    borderColor: interpolateColor(on.value, [0, 1], [colors.borderSoft, colors.ok]),
  }));

  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(0,0,0,0)', colors.ok]),
    borderColor: interpolateColor(on.value, [0, 1], [colors.mutedLight, colors.ok]),
    transform: [{ scale: interpolate(on.value, [0, 0.6, 1], [1, 1.16, 1]) }],
  }));

  const check = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ scale: interpolate(on.value, [0, 1], [0.4, 1]) }],
  }));

  return (
    <PressableScale
      onPress={() => {
        on.value = withSequence(withTiming(checked ? 0.7 : 0.3, { duration: 60 }));
        onToggle();
      }}
      feedback={checked ? 'select' : 'success'}
      scaleTo={0.985}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.row, row]}>
        <Animated.View style={[styles.box, box]}>
          <Animated.View style={check}>
            <Ionicons name="checkmark" size={17} color={colors.white} />
          </Animated.View>
        </Animated.View>
        <View style={styles.textWrap}>
          {index !== undefined ? <Text style={styles.index}>Point {index + 1}</Text> : null}
          <Text style={[styles.label, checked && styles.labelOn]}>{label}</Text>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: spacing.md,
    ...shadow.card,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textWrap: { flex: 1, gap: 3 },
  index: {
    color: colors.mutedLight,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  label: { color: colors.inkSoft, fontSize: 14.5, lineHeight: 21 },
  labelOn: { color: colors.ink, fontWeight: '600' },
});
