import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MedIdentity } from '../components/MedIdentity';
import { ModalityBadge } from '../components/ModalityBadge';
import { Collapsible } from '../components/controls';
import { EmptyState, PressableScale, SectionHeader, SkeletonCard } from '../components/ui';
import { getDomaine } from '../data/arreteCatalog';
import { EXEMPLES_ORDONNANCE } from '../data/exemplesOrdonnance';
import {
  countMedicamentsByItemId,
  getItemsByDomaine,
  getMedicamentsByDomaine,
} from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { colors, domainPalette, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem, BdpmMedicament } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Domain'>;

type ItemWithCount = ArreteItem & { medCount: number };

export function DomainScreen({ route, navigation }: Props) {
  const { domaineId } = route.params;
  const meta = getDomaine(domaineId);
  const palette = domainPalette(domaineId);
  const [items, setItems] = useState<ItemWithCount[]>([]);
  const [domainMeds, setDomainMeds] = useState<BdpmMedicament[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: meta.titre });
  }, [meta.titre, navigation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getItemsByDomaine(domaineId);
      const withCounts = await Promise.all(
        list.map(async (item) => ({
          ...item,
          medCount: await countMedicamentsByItemId(item.id),
        })),
      );
      const meds = await getMedicamentsByDomaine(domaineId, 40);
      if (cancelled) return;
      setItems(withCounts);
      setDomainMeds(meds);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [domaineId]);

  return (
    <Animated.ScrollView
      style={styles.screen}
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
          <View style={styles.heroIcon}>
            <Ionicons
              name={meta.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={colors.white}
            />
          </View>
          <Text style={styles.heroRoman}>{domaineId}</Text>
        </View>
        <Text style={styles.heroTitle}>{meta.titre}</Text>
        <Text style={styles.heroSub}>{meta.sousTitre}</Text>
        <View style={styles.heroStats}>
          <HeroStat value={items.length} label="rubriques" loading={loading} />
          <View style={styles.heroDivider} />
          <HeroStat
            value={domainMeds.length}
            label="spécialités liées"
            loading={loading}
            plus={domainMeds.length >= 40}
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <SectionHeader
          label="Rubriques"
          hint="Ouvrez une rubrique pour les conditions, obligations et libellés à copier."
        />

        {loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} delay={120} />
            <SkeletonCard lines={2} delay={240} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title="Aucune rubrique"
            body="Ce domaine ne contient pas encore de rubrique indexée."
          />
        ) : (
          items.map((item, i) => {
            const exemples = EXEMPLES_ORDONNANCE[item.id] ?? [];
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(Math.min(i, 8) * 45).duration(320)}
              >
                <PressableScale
                  scaleTo={0.985}
                  accessibilityLabel={item.titre}
                  onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                  style={styles.card}
                >
                  <View style={[styles.cardEdge, { backgroundColor: palette.solid }]} />
                  <ModalityBadge modalite={item.modalite} />
                  <Text style={styles.cardTitle}>{item.titre}</Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {item.description}
                  </Text>

                  {exemples.length > 0 ? (
                    <View style={styles.exemples}>
                      {exemples.slice(0, 3).map((ex) => (
                        <View key={ex} style={[styles.exemple, { backgroundColor: palette.tint }]}>
                          <Text
                            numberOfLines={1}
                            style={[styles.exempleText, { color: palette.onTint }]}
                          >
                            {ex}
                          </Text>
                        </View>
                      ))}
                      {exemples.length > 3 ? (
                        <View style={[styles.exemple, styles.exempleMore]}>
                          <Text style={styles.exempleMoreText}>+{exemples.length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    {item.medCount > 0 ? (
                      <Text style={[styles.medCount, { color: palette.onTint }]}>
                        {item.medCount} spécialité{item.medCount > 1 ? 's' : ''} BDPM
                      </Text>
                    ) : (
                      <Text style={styles.noMed}>Dispositifs / examens</Text>
                    )}
                    <Ionicons name="arrow-forward" size={15} color={palette.solid} />
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}

        {!loading && domainMeds.length > 0 ? (
          <Collapsible
            title={`Spécialités BDPM du domaine (${domainMeds.length}${domainMeds.length >= 40 ? '+' : ''})`}
            subtitle="Ouvrir la fiche pour l’éligibilité IDE détaillée"
            icon="flask"
            accent={palette.solid}
            tint={palette.tint}
          >
            {domainMeds.map((med) => (
              <PressableScale
                key={med.id}
                scaleTo={0.985}
                accessibilityLabel={med.nomCommercial}
                onPress={() => navigation.navigate('MedicationDetail', { medicationId: med.id })}
                style={styles.medRow}
              >
                <MedIdentity
                  nom={med.nom}
                  nomCommercial={med.nomCommercial}
                  substances={med.substances}
                  remboursable={med.remboursable}
                  tauxRemboursement={med.tauxRemboursement}
                  withMonogram
                />
              </PressableScale>
            ))}
          </Collapsible>
        ) : null}

        {!loading && domainMeds.length === 0 ? (
          <View style={styles.noMedsBox}>
            <Ionicons name="information-circle" size={16} color={colors.muted} />
            <Text style={styles.noMedsText}>
              Pas de spécialité BDPM rattachée à ce domaine — il s’agit surtout de dispositifs,
              d’examens ou de vaccins. Voir les exemples de chaque rubrique.
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.ScrollView>
  );
}

function HeroStat({
  value,
  label,
  loading,
  plus,
}: {
  value: number;
  label: string;
  loading: boolean;
  plus?: boolean;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatValue}>
        {loading ? '—' : `${value}${plus ? '+' : ''}`}
      </Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: TAB_BAR_CLEARANCE },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: 6,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRoman: { color: 'rgba(255,255,255,0.45)', fontSize: 34, fontWeight: '800' },
  heroTitle: { ...typography.title, color: colors.white, marginTop: 2 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { color: colors.white, fontWeight: '800', fontSize: 19 },
  heroStatLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700' },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  body: { padding: spacing.md, gap: spacing.sm },
  skeletons: { gap: spacing.sm },
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
  cardEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardTitle: { color: colors.ink, fontWeight: '800', fontSize: 16, lineHeight: 21 },
  cardDesc: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  exemples: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  exemple: {
    maxWidth: '100%',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  exempleText: { fontSize: 11.5, fontWeight: '700' },
  exempleMore: { backgroundColor: colors.surfaceMuted },
  exempleMoreText: { fontSize: 11.5, fontWeight: '800', color: colors.muted },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
    marginTop: 2,
  },
  medCount: { fontSize: 12.5, fontWeight: '800' },
  noMed: { color: colors.mutedLight, fontSize: 12.5, fontWeight: '700' },
  medRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  noMedsBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noMedsText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
