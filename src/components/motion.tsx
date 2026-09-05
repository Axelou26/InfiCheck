import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const COUNT_STEPS = 20;

/**
 * Compteur qui monte à l'arrivée du chiffre. Piloté en JS (et non en worklet)
 * parce que Reanimated ne peut pas écrire dans les enfants d'un `Text`.
 */
export function CountUp({
  value,
  duration = 750,
  suffix,
  style,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    if (start === value) return;

    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const t = step / COUNT_STEPS;
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (value - start) * eased);
      setDisplay(next);
      if (step >= COUNT_STEPS) {
        from.current = value;
        clearInterval(timer);
      }
    }, duration / COUNT_STEPS);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <Text style={style}>
      {display.toLocaleString('fr-FR')}
      {suffix ?? ''}
    </Text>
  );
}

/** Halo qui respire — utilisé en fond de hero pour que l'écran ne soit jamais figé. */
export function Breathe({
  children,
  delay = 0,
  duration = 5200,
  amplitude = 0.12,
  style,
}: {
  children?: ReactNode;
  delay?: number;
  duration?: number;
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [delay, duration, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * amplitude }],
    opacity: 0.55 + t.value * 0.45,
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * Rebond ponctuel déclenché par un changement de `trigger`.
 * Sert aux confirmations : favori ajouté, point de checklist coché.
 */
export function Pop({
  trigger,
  children,
  scale = 1.28,
  style,
}: {
  trigger: unknown;
  children: ReactNode;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    t.value = withSequence(
      withTiming(1, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) }),
    );
  }, [trigger, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * (scale - 1) }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
