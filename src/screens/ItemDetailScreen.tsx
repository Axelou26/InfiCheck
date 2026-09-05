import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { FicheChecklist } from '../components/FicheChecklist';
import { MedIdentity } from '../components/MedIdentity';
import { ModalityBadge } from '../components/ModalityBadge';
import { Collapsible } from '../components/controls';
import {
  GhostButton,
  PressableScale,
  SectionHeader,
  Skeleton,
  SkeletonCard,
  Toast,
} from '../components/ui';
import { getDomaine } from '../data/arreteCatalog';
import { EXEMPLES_ORDONNANCE } from '../data/exemplesOrdonnance';
import { getItemById, getMedicamentsByItemId } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { pushRecent } from '../storage/library';
import { colors, domainPalette, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem, BdpmMedicament } from '../types';
import { haptic } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ route, navigation }: Props) {
  const [item, setItem] = useState<ArreteItem | null>(null);
  const [meds, setMeds] = useState<BdpmMedicament[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = route.params.itemId;
    getItemById(id).then((found) => {
      setItem(found);
      if (found) {
        const domaine = getDomaine(found.domaine);
        navigation.setOptions({ title: domaine.titre });
        void pushRecent({
          kind: 'arrete',
          id: found.id,
          title: found.titre,
          subtitle: domaine.titre,
          accent: domainPalette(found.domaine).solid,
        });
      }
    });
    getMedicamentsByItemId(id, 60).then(setMeds);
  }, [route.params.itemId, navigation]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  async function copyText(text: string) {
    await Clipboard.setStringAsync(text);
    haptic('success');
    setCopied(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCopied(null), 1700);
  }

  if (!item) {
    return (
      <View style={styles.loading}>
        <Skeleton width="45%" height={22} radius={radii.full} />
        <Skeleton width="85%" height={28} />
        <Skeleton width="60%" height={16} />
        <SkeletonCard lines={3} delay={120} />
        <SkeletonCard lines={4} delay={240} />
      </View>
    );
  }

  const palette = domainPalette(item.domaine);
  const meta = getDomaine(item.domaine);
  const exemples = EXEMPLES_ORDONNANCE[item.id] ?? [];

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={palette.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroDomain}>
              <Ionicons
                name={meta.icon as keyof typeof Ionicons.glyphMap}
                size={13}
                color={colors.white}
              />
              <Text style={styles.heroDomainText}>
                {item.domaine} · {meta.titre}
              </Text>
            </View>
            <FavoriteToggle
              kind="arrete"
              id={item.id}
              title={item.titre}
              subtitle={meta.titre}
              accent={palette.solid}
            />
          </View>
          <Text style={styles.heroTitle}>{item.titre}</Text>
          <View style={styles.heroBadges}>
            <ModalityBadge modalite={item.modalite} />
            <View style={styles.heroRef}>
              <Ionicons name="bookmark" size={11} color={colors.white} />
              <Text style={styles.heroRefText}>{item.references}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.descCard}>
            <Text style={styles.desc}>{item.description}</Text>
          </View>

          <Collapsible
            title="Conditions"
            subtitle={`${item.conditions.length} point${item.conditions.length > 1 ? 's' : ''} à vérifier`}
            icon="options"
            accent={palette.solid}
            tint={palette.tint}
            defaultOpen
          >
            {item.conditions.length === 0 ? (
              <Text style={styles.noteText}>Aucune condition particulière listée.</Text>
            ) : (
              item.conditions.map((c) => <Bullet key={c} text={c} color={palette.solid} />)
            )}
          </Collapsible>

          <Collapsible
            title="Obligations"
            subtitle="Traçabilité, information, coordination"
            icon="shield-checkmark"
            accent={palette.solid}
            tint={palette.tint}
            defaultOpen
          >
            {item.obligations.map((o) => (
              <Bullet key={o} text={o} color={palette.solid} />
            ))}
          </Collapsible>

          <FicheChecklist item={item} />

          <Animated.View entering={FadeInDown.duration(320)} style={styles.block}>
            <SectionHeader
              label="À copier sur l’ordonnancier"
              hint={
                exemples.length > 0
                  ? 'Touchez un libellé pour le copier dans le presse-papier.'
                  : undefined
              }
            />
            {exemples.length === 0 ? (
              <View style={styles.noteBox}>
                <Ionicons name="information-circle" size={16} color={colors.muted} />
                <Text style={styles.noteText}>
                  Aucun libellé type listé pour cette rubrique — reportez-vous au texte de l’arrêté.
                </Text>
              </View>
            ) : (
              <View style={styles.exemples}>
                {exemples.map((ex) => {
                  const isCopied = copied === ex;
                  return (
                    <PressableScale
                      key={ex}
                      scaleTo={0.96}
                      feedback="none"
                      accessibilityLabel={`Copier ${ex}`}
                      onPress={() => copyText(ex)}
                      style={[
                        styles.exemple,
                        isCopied && { backgroundColor: palette.tint, borderColor: palette.solid },
                      ]}
                    >
                      <Ionicons
                        name={isCopied ? 'checkmark-circle' : 'copy-outline'}
                        size={15}
                        color={isCopied ? palette.solid : colors.mutedLight}
                      />
                      <Text style={styles.exempleText}>{ex}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {meds.length > 0 ? (
            <Collapsible
              title={`Spécialités BDPM (${meds.length}${meds.length >= 60 ? '+' : ''})`}
              subtitle="Copier le nom ou ouvrir la fiche détaillée"
              icon="flask"
              accent={palette.solid}
              tint={palette.tint}
            >
              {meds.map((med) => (
                <View key={med.id} style={styles.medCard}>
                  <MedIdentity
                    nom={med.nom}
                    nomCommercial={med.nomCommercial}
                    substances={med.substances}
                    remboursable={med.remboursable}
                    tauxRemboursement={med.tauxRemboursement}
                    withMonogram
                  />
                  <View style={styles.medActions}>
                    <GhostButton
                      label={copied === med.nom ? 'Copié' : 'Copier'}
                      icon={copied === med.nom ? 'checkmark' : 'copy-outline'}
                      color={palette.solid}
                      onPress={() => copyText(med.nom)}
                      style={styles.medAction}
                    />
                    <GhostButton
                      label="Fiche"
                      icon="open-outline"
                      color={colors.muted}
                      onPress={() =>
                        navigation.navigate('MedicationDetail', { medicationId: med.id })
                      }
                      style={styles.medAction}
                    />
                  </View>
                </View>
              ))}
            </Collapsible>
          ) : null}
        </View>
      </Animated.ScrollView>

      <Toast label="Copié dans le presse-papier" visible={copied !== null} />
    </View>
  );
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: color }]} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: TAB_BAR_CLEARANCE },
  loading: { flex: 1, backgroundColor: colors.bg, padding: spacing.md, gap: spacing.sm },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroDomain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  heroDomainText: { ...typography.micro, color: colors.white },
  heroTitle: { ...typography.title, fontSize: 25, color: colors.white },
  heroBadges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  heroRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  heroRefText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },
  body: { padding: spacing.md, gap: spacing.sm },
  block: { gap: spacing.sm },
  descCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    ...shadow.card,
  },
  desc: { color: colors.inkSoft, fontSize: 15, lineHeight: 23 },
  exemples: { gap: spacing.xs },
  exemple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  exempleText: { flex: 1, color: colors.ink, fontWeight: '600', fontSize: 14, lineHeight: 19 },
  noteBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  noteText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  medCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  medActions: { flexDirection: 'row', gap: spacing.xs },
  medAction: { flex: 1, paddingVertical: 9 },
});
