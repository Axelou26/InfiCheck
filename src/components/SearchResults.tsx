import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { accentGradient, colors, domainPalette, glow, gradients, radii, shadow, spacing } from '../theme';
import type { ArreteItem, BdpmMedicament } from '../types';
import { EligibiliteBadge } from './EligibiliteBadge';
import { MedIdentity } from './MedIdentity';
import { ModalityBadge } from './ModalityBadge';
import { PressableScale } from './ui';

export function ArreteResult({
  item,
  index,
  onPress,
}: {
  item: ArreteItem;
  index: number;
  onPress: () => void;
}) {
  const palette = domainPalette(item.domaine);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(280)}>
      <PressableScale scaleTo={0.985} accessibilityLabel={item.titre} onPress={onPress} style={styles.card}>
        <View style={[styles.edge, { backgroundColor: palette.solid }]} />
        <View style={styles.cardTop}>
          <View style={[styles.sourceTag, { backgroundColor: palette.tint }]}>
            <Ionicons name="document-text" size={11} color={palette.onTint} />
            <Text style={[styles.sourceTagText, { color: palette.onTint }]}>
              Arrêté · {item.domaine}
            </Text>
          </View>
          <ModalityBadge modalite={item.modalite} />
        </View>
        <Text style={styles.cardTitle}>{item.titre}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

export function MedResult({
  item,
  index,
  onPress,
}: {
  item: BdpmMedicament;
  index: number;
  onPress: () => void;
}) {
  const dispo =
    item.dispoLibelle && item.dispoCode && item.dispoCode !== '4' ? item.dispoLibelle : null;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(280)}>
      <PressableScale
        scaleTo={0.985}
        accessibilityLabel={item.nomCommercial}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={[styles.sourceTag, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="flask" size={11} color={colors.muted} />
            <Text style={[styles.sourceTagText, { color: colors.muted }]}>BDPM</Text>
          </View>
          <EligibiliteBadge niveau={item.niveauIde} suffixe={dispo} />
        </View>
        <MedIdentity
          nom={item.nom}
          nomCommercial={item.nomCommercial}
          substances={item.substances}
          remboursable={item.remboursable}
          tauxRemboursement={item.tauxRemboursement}
          withMonogram
        />
      </PressableScale>
    </Animated.View>
  );
}

export function LibraryCard({
  title,
  subtitle,
  kind,
  onPress,
}: {
  title: string;
  subtitle?: string;
  kind: 'arrete' | 'med';
  onPress: () => void;
}) {
  return (
    <PressableScale scaleTo={0.985} accessibilityLabel={title} onPress={onPress} style={styles.libraryCard}>
      <View
        style={[
          styles.libraryIcon,
          { backgroundColor: kind === 'arrete' ? colors.primaryTint : colors.accentSoft },
        ]}
      >
        <Ionicons
          name={kind === 'arrete' ? 'document-text' : 'flask'}
          size={16}
          color={kind === 'arrete' ? colors.primary : colors.accent}
        />
      </View>
      <View style={styles.libraryText}>
        <Text style={styles.libraryTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.librarySub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
    </PressableScale>
  );
}

/** Tuile colorée du carrousel de favoris : reconnaissable d'un coup d'œil en tournée. */
export function FavoriteTile({
  title,
  subtitle,
  kind,
  accent,
  index,
  onPress,
}: {
  title: string;
  subtitle?: string;
  kind: 'arrete' | 'med';
  accent?: string;
  index: number;
  onPress: () => void;
}) {
  const base = accent ?? (kind === 'arrete' ? colors.primary : colors.accent);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(340)}>
      <PressableScale
        scaleTo={0.96}
        accessibilityLabel={title}
        onPress={onPress}
        style={[styles.tileShadow, glow(base)]}
      >
        <LinearGradient
          colors={accentGradient(base)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tile}
        >
          <LinearGradient
            colors={gradients.glassLight}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tileTop}>
            <View style={styles.tileBubble}>
              <Ionicons
                name={kind === 'arrete' ? 'document-text' : 'flask'}
                size={14}
                color={colors.white}
              />
            </View>
            <Ionicons name="star" size={13} color="#F3D38A" />
          </View>
          <Text style={styles.tileTitle} numberOfLines={3}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.tileSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
    gap: 8,
    overflow: 'hidden',
    ...shadow.card,
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  sourceTagText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
  cardTitle: { color: colors.ink, fontWeight: '800', fontSize: 15.5, lineHeight: 21 },
  cardDesc: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    ...shadow.card,
  },
  libraryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryText: { flex: 1, gap: 2, minWidth: 0 },
  libraryTitle: { color: colors.ink, fontWeight: '800', fontSize: 14.5 },
  librarySub: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  tileShadow: { borderRadius: radii.md },
  tile: {
    width: 176,
    height: 132,
    borderRadius: radii.md,
    overflow: 'hidden',
    padding: spacing.sm + 2,
    gap: 5,
  },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileBubble: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    flex: 1,
    color: colors.white,
    fontWeight: '800',
    fontSize: 13.5,
    lineHeight: 18,
  },
  tileSub: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '700' },
});
