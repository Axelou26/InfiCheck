import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'none' | 'light' | 'medium' | 'select' | 'success' | 'warning';

const SILENT = Platform.OS === 'web';

/** Retour haptique « best effort » : jamais bloquant, jamais source d'erreur. */
export function haptic(kind: HapticKind = 'light') {
  if (kind === 'none' || SILENT) return;
  const run = () => {
    switch (kind) {
      case 'medium':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'select':
        return Haptics.selectionAsync();
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  void run()?.catch(() => undefined);
}
