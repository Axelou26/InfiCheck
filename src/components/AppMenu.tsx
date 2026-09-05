import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabParamList } from '../navigation/types';
import { colors, gradients, radii, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { PressableScale } from './ui';

type MenuContextValue = {
  open: () => void;
  close: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(
    () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
    }),
    [],
  );

  return (
    <MenuContext.Provider value={value}>
      {children}
      <AppMenuOverlay visible={visible} onClose={value.close} />
    </MenuContext.Provider>
  );
}

export function useAppMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error('useAppMenu must be used within MenuProvider');
  }
  return ctx;
}

export function MenuButton({ color = colors.white }: { color?: string }) {
  const { open } = useAppMenu();
  return (
    <Pressable
      onPress={() => {
        haptic('light');
        open();
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le menu"
      style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
    >
      <Ionicons name="grid" size={20} color={color} />
    </Pressable>
  );
}

type MenuItem = {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  go: () => void;
};

function AppMenuOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<TabParamList>>();

  function go(name: keyof TabParamList, screen?: string) {
    if (screen) {
      navigation.navigate(name, { screen } as never);
    } else {
      navigation.navigate(name);
    }
    onClose();
  }

  const items: MenuItem[] = [
    {
      key: 'accueil',
      label: 'Recherche',
      subtitle: 'Récents · favoris',
      icon: 'search',
      go: () => go('Accueil', 'AccueilHome'),
    },
    {
      key: 'catalogue',
      label: 'Catalogue',
      subtitle: '6 domaines',
      icon: 'albums',
      go: () => go('Catalogue', 'CatalogueHome'),
    },
    {
      key: 'medicaments',
      label: 'Liste IDE',
      subtitle: 'Éligibilité BDPM',
      icon: 'flask',
      go: () => go('Medicaments', 'MedicamentsHome'),
    },
    {
      key: 'legal',
      label: 'Mentions',
      subtitle: 'Sources · Légifrance',
      icon: 'document-text',
      go: () => go('Accueil', 'Legal'),
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Fermer le menu">
        <Animated.View
          entering={SlideInDown.duration(320)}
          style={[styles.panelWrap, { paddingBottom: insets.bottom + spacing.md }]}
        >
          {/* Absorbe la pression pour que le fond ne ferme pas le panneau. */}
          <Pressable onPress={() => undefined}>
            <LinearGradient
              colors={gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.panel}
            >
              <View style={styles.grabber} />
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderText}>
                  <Text style={styles.kicker}>Inficheck</Text>
                  <Text style={styles.panelTitle}>Navigation</Text>
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer le menu"
                  style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="close" size={22} color={colors.white} />
                </Pressable>
              </View>

              <View style={styles.grid}>
                {items.map((item, i) => (
                  <Animated.View
                    key={item.key}
                    entering={FadeInDown.delay(80 + i * 45).duration(300)}
                    style={styles.gridCell}
                  >
                    <PressableScale
                      onPress={item.go}
                      accessibilityLabel={item.label}
                      style={styles.tile}
                    >
                      <View style={styles.tileIcon}>
                        <Ionicons name={item.icon} size={20} color={colors.white} />
                      </View>
                      <Text style={styles.tileLabel}>{item.label}</Text>
                      <Text style={styles.tileSub}>{item.subtitle}</Text>
                    </PressableScale>
                  </Animated.View>
                ))}
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  panelWrap: { paddingHorizontal: spacing.sm },
  panel: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelHeaderText: { gap: 2 },
  kicker: { ...typography.micro, color: colors.onDarkSoft, letterSpacing: 1.2 },
  panelTitle: { ...typography.title, color: colors.white },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.onDarkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCell: { width: '31%', flexGrow: 1 },
  tile: {
    backgroundColor: colors.onDarkFaint,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.sm,
    gap: 6,
    minHeight: 104,
    justifyContent: 'flex-end',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tileLabel: { color: colors.white, fontWeight: '800', fontSize: 14 },
  tileSub: { color: colors.onDarkSoft, fontSize: 11, lineHeight: 14, fontWeight: '600' },
});
