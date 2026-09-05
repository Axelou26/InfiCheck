import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useIsFavorite } from '../hooks/useLibrary';
import { toggleFavorite, type LibraryKind } from '../storage/library';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import { Pop } from './motion';

const GOLD = '#F3D38A';

export function FavoriteToggle({
  kind,
  id,
  title,
  subtitle,
  accent,
  color = colors.white,
}: {
  kind: LibraryKind;
  id: string;
  title: string;
  subtitle?: string;
  accent?: string;
  color?: string;
}) {
  const on = useIsFavorite(kind, id);

  const toggle = useCallback(() => {
    haptic(on ? 'select' : 'success');
    void toggleFavorite({ kind, id, title, subtitle, accent });
  }, [kind, id, title, subtitle, accent, on]);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={on ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [styles.btn, on && styles.btnOn, pressed && styles.pressed]}
    >
      <Pop trigger={on}>
        <Ionicons name={on ? 'star' : 'star-outline'} size={20} color={on ? GOLD : color} />
      </Pop>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: { backgroundColor: 'rgba(243,211,138,0.22)' },
  pressed: { opacity: 0.7 },
});
