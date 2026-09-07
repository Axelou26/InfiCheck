import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MedIdentity } from '../components/MedIdentity';
import { ModalityBadge } from '../components/ModalityBadge';
import { BackButton } from '../components/NavChrome';
import { Collapsible, FilterChip, SearchField } from '../components/controls';
import { EmptyState, PressableScale, SectionHeader, SkeletonCard } from '../components/ui';
import { getDomaine, getSousGroupes } from '../data/arreteCatalog';
import { EXEMPLES_ORDONNANCE } from '../data/exemplesOrdonnance';
import {
  countMedicamentsByItemId,
  getItemsByDomaine,
  getMedicamentsByDomaine,
} from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { colors, domainPalette, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem, BdpmMedicament, DomaineSousGroupe } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Domain'>;

type ItemWithCount = ArreteItem & { medCount: number };

type GroupedSection = {
  key: string;
  label: string;
  hint?: string;
  icon?: string;
  items: ItemWithCount[];
};

export function DomainScreen({ route, navigation }: Props) {
  const { domaineId } = route.params;
  const meta = getDomaine(domaineId);
  const palette = domainPalette(domaineId);
  const sousGroupes = getSousGroupes(domaineId);
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ItemWithCount[]>([]);
  const [domainMeds, setDomainMeds] = useState<BdpmMedicament[]>([]);
  const [domainMedTotal, setDomainMedTotal] = useState(0);
  const [medQuery, setMedQuery] = useState('');
  const [medsLoading, setMedsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtreGroupe, setFiltreGroupe] = useState<string>('tous');

  useEffect(() => {
    let cancelled = false;
    setFiltreGroupe('tous');
    setMedQuery('');
    setLoading(true);
    (async () => {
      const list = await getItemsByDomaine(domaineId);
      const withCounts = await Promise.all(
        list.map(async (item) => ({
          ...item,
          medCount: await countMedicamentsByItemId(item.id),
        })),
      );
      if (cancelled) return;
      setItems(withCounts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [domaineId]);

  useEffect(() => {
    let cancelled = false;
    setMedsLoading(true);
    const timer = setTimeout(() => {
      getMedicamentsByDomaine(domaineId, 80, medQuery)
        .then((meds) => {
          if (cancelled) return;
          setDomainMeds(meds);
          if (medQuery.trim().length < 2) setDomainMedTotal(meds.length);
        })
        .finally(() => {
          if (!cancelled) setMedsLoading(false);
        });
    }, medQuery.trim().length >= 2 ? 180 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [domaineId, medQuery]);

  const sections = useMemo(
    () => buildSections(items, sousGroupes, filtreGroupe),
    [items, sousGroupes, filtreGroupe],
  );

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
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        <View style={styles.heroTop}>
          <BackButton light />
          <Text style={styles.heroRoman}>{domaineId}</Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons
            name={meta.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={colors.white}
          />
        </View>
        <Text style={styles.heroTitle}>{meta.titre}</Text>
        <Text style={styles.heroSub}>{meta.sousTitre}</Text>
        <View style={styles.heroStats}>
          <HeroStat value={items.length} label="rubriques" loading={loading} />
          <View style={styles.heroDivider} />
          <HeroStat
            value={domainMedTotal}
            label="spécialités liées"
            loading={loading || (medsLoading && medQuery.trim().length < 2)}
            plus={domainMedTotal >= 80}
          />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <SectionHeader
          label="Rubriques"
          hint={
            sousGroupes
              ? 'Sous-groupes d’affichage — le domaine légal reste l’Art. 1-V.'
              : 'Ouvrez une rubrique pour les conditions, obligations et libellés à copier.'
          }
        />

        {sousGroupes && !loading ? (
          <View style={styles.chipRow}>
            <FilterChip
              label="Tous"
              active={filtreGroupe === 'tous'}
              onPress={() => setFiltreGroupe('tous')}
              color={palette.solid}
              tint={palette.tint}
              count={items.length}
            />
            {sousGroupes.map((g) => (
              <FilterChip
                key={g.id}
                label={g.label}
                active={filtreGroupe === g.id}
                onPress={() => setFiltreGroupe(g.id)}
                color={palette.solid}
                tint={palette.tint}
                icon={g.icon as keyof typeof Ionicons.glyphMap}
                count={g.itemIds.filter((id) => items.some((it) => it.id === id)).length}
              />
            ))}
          </View>
        ) : null}

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
        ) : sections.length === 0 ? (
          <EmptyState
            icon="funnel-outline"
            title="Aucune rubrique dans ce sous-groupe"
            body="Réessayez « Tous » ou un autre sous-groupe."
          />
        ) : (
          sections.map((section, sectionIndex) => (
            <View key={section.key} style={styles.section}>
              {sousGroupes && filtreGroupe === 'tous' ? (
                <View style={styles.sectionHead}>
                  {section.icon ? (
                    <View style={[styles.sectionIcon, { backgroundColor: palette.tint }]}>
                      <Ionicons
                        name={section.icon as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color={palette.onTint}
                      />
                    </View>
                  ) : null}
                  <View style={styles.sectionText}>
                    <Text style={[styles.sectionLabel, { color: palette.onTint }]}>
                      {section.label}
                    </Text>
                    {section.hint ? <Text style={styles.sectionHint}>{section.hint}</Text> : null}
                  </View>
                  <Text style={styles.sectionCount}>{section.items.length}</Text>
                </View>
              ) : null}

              {section.items.map((item, i) => {
                const exemples = EXEMPLES_ORDONNANCE[item.id] ?? [];
                const delay = Math.min(sectionIndex * 2 + i, 8) * 45;
                return (
                  <Animated.View key={item.id} entering={FadeInDown.delay(delay).duration(320)}>
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
                            <View
                              key={ex}
                              style={[styles.exemple, { backgroundColor: palette.tint }]}
                            >
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
              })}
            </View>
          ))
        )}

        {!loading && domainMedTotal > 0 ? (
          <Collapsible
            title={`Spécialités BDPM du domaine (${domainMedTotal}${domainMedTotal >= 80 ? '+' : ''})`}
            subtitle="Ouvrir la fiche pour l’éligibilité IDE détaillée"
            icon="flask"
            accent={palette.solid}
            tint={palette.tint}
            defaultOpen
          >
            <SearchField
              value={medQuery}
              onChangeText={setMedQuery}
              placeholder="Chercher une spécialité ou DCI…"
            />
            {medsLoading ? (
              <Text style={styles.medSearchHint}>Recherche…</Text>
            ) : domainMeds.length === 0 ? (
              <Text style={styles.medSearchHint}>
                Aucune spécialité pour « {medQuery.trim()} » dans ce domaine.
              </Text>
            ) : (
              <>
                {medQuery.trim().length >= 2 ? (
                  <Text style={styles.medSearchHint}>
                    {domainMeds.length} résultat{domainMeds.length > 1 ? 's' : ''}
                  </Text>
                ) : null}
                {domainMeds.map((med) => (
                  <PressableScale
                    key={med.id}
                    scaleTo={0.985}
                    accessibilityLabel={med.nomCommercial}
                    onPress={() =>
                      navigation.navigate('MedicationDetail', { medicationId: med.id })
                    }
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
              </>
            )}
          </Collapsible>
        ) : null}

        {!loading && !medsLoading && domainMedTotal === 0 ? (
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

function buildSections(
  items: ItemWithCount[],
  sousGroupes: DomaineSousGroupe[] | undefined,
  filtreGroupe: string,
): GroupedSection[] {
  if (!sousGroupes || sousGroupes.length === 0) {
    return [{ key: 'all', label: 'Rubriques', items }];
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const assigned = new Set<string>();

  const groups = sousGroupes
    .filter((g) => filtreGroupe === 'tous' || filtreGroupe === g.id)
    .map((g) => {
      const groupItems = g.itemIds
        .map((id) => byId.get(id))
        .filter((item): item is ItemWithCount => Boolean(item));
      for (const item of groupItems) assigned.add(item.id);
      return {
        key: g.id,
        label: g.label,
        hint: g.hint,
        icon: g.icon,
        items: groupItems,
      };
    })
    .filter((g) => g.items.length > 0);

  if (filtreGroupe === 'tous') {
    const orphan = items.filter((item) => !assigned.has(item.id));
    if (orphan.length > 0) {
      groups.push({
        key: 'autres',
        label: 'Autres',
        hint: 'Hors sous-groupes',
        icon: 'ellipsis-horizontal',
        items: orphan,
      });
    }
  }

  return groups;
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: { flex: 1, gap: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionHint: { fontSize: 12, color: colors.mutedLight, fontWeight: '600' },
  sectionCount: { fontSize: 12, fontWeight: '800', color: colors.mutedLight },
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
  medSearchHint: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
  noMedsBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noMedsText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
