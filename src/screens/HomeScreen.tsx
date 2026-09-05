import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuButton } from '../components/AppMenu';
import { ContentUpdateBanner } from '../components/ContentUpdateCard';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { FilterChip, SearchField, SegmentedControl } from '../components/controls';
import { Breathe, CountUp } from '../components/motion';
import { ArreteResult, FavoriteTile, LibraryCard, MedResult } from '../components/SearchResults';
import { EmptyState, PressableScale, SectionHeader, SkeletonCard } from '../components/ui';
import { useContentUpdateContext } from '../content/ContentUpdateProvider';
import { ARRETE_ITEMS, DOMAINES } from '../data/arreteCatalog';
import { getMedicationStats, searchArrete, searchMedicaments } from '../db/database';
import { useLibrary } from '../hooks/useLibrary';
import type { AccueilStackParamList, TabParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { pushQuery, type LibraryEntry } from '../storage/library';
import {
  colors,
  domainPalette,
  glow,
  heroGradient,
  momentOfDay,
  MOMENT_GREETING,
  radii,
  shadow,
  spacing,
  typography,
} from '../theme';
import type { ArreteItem, BdpmMedicament, DomaineId } from '../types';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<AccueilStackParamList, 'AccueilHome'>,
  BottomTabNavigationProp<TabParamList>
>;

type Filtre = 'tout' | 'arrete' | 'meds';
type Row = { kind: 'arrete'; item: ArreteItem } | { kind: 'med'; item: BdpmMedicament };

const SUGGESTIONS = [
  'pansement',
  'INR',
  'paracétamol',
  'contraception',
  'nicotine',
  'ECBU',
  'vaccin grippe',
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'search', title: 'Cherchez', body: 'Deux lettres suffisent : DCI, nom commercial ou mot de l’arrêté.' },
  { icon: 'shield-checkmark', title: 'Vérifiez', body: 'Éligibilité IDE, conditions, obligations — et le libellé à recopier.' },
  { icon: 'star', title: 'Étoilez', body: 'Vos fiches du quotidien remontent ici, prêtes pour la prochaine tournée.' },
];

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { recents, favorites, queries } = useLibrary();
  const contentUpdate = useContentUpdateContext();
  const [query, setQuery] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tout');
  const [loading, setLoading] = useState(false);
  const [arrete, setArrete] = useState<ArreteItem[]>([]);
  const [meds, setMeds] = useState<BdpmMedicament[]>([]);
  const [eligibles, setEligibles] = useState(0);
  const lastCommitted = useRef('');
  const moment = useMemo(() => momentOfDay(), []);

  const active = query.trim().length >= 2;

  useEffect(() => {
    getMedicationStats()
      .then((stats) => setEligibles(stats.eligible))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!active) {
      setArrete([]);
      setMeds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const term = query.trim();
      Promise.all([searchArrete(term), searchMedicaments(term)])
        .then(([a, m]) => {
          setArrete(a);
          setMeds(m);
          if (a.length + m.length > 0 && lastCommitted.current !== term) {
            lastCommitted.current = term;
            void pushQuery(term);
          }
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(timer);
  }, [query, active]);

  const rows = useMemo<Row[]>(() => {
    const a: Row[] = arrete.map((item) => ({ kind: 'arrete', item }));
    const m: Row[] = meds.map((item) => ({ kind: 'med', item }));
    if (filtre === 'arrete') return a;
    if (filtre === 'meds') return m;
    return [...a, ...m];
  }, [arrete, meds, filtre]);

  function openEntry(entry: LibraryEntry) {
    if (entry.kind === 'arrete') {
      navigation.navigate('ItemDetail', { itemId: entry.id });
      return;
    }
    navigation.navigate('MedicationDetail', { medicationId: entry.id });
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={heroGradient(moment)}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        <Breathe style={styles.haloWarm} duration={5600} amplitude={0.16} />
        <Breathe style={styles.haloCool} delay={1600} duration={6400} amplitude={0.2} />

        <View style={styles.heroTop}>
          <View style={styles.heroTitles}>
            <Text style={styles.kicker}>{MOMENT_GREETING[moment]}</Text>
            <Text style={styles.brand}>
              <Text style={styles.brandAccent}>Infi</Text>
              <Text style={styles.brandMain}>check</Text>
            </Text>
          </View>
          <MenuButton />
        </View>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Pansement, INR, paracétamol…"
          variant="onDark"
        />

        <View style={styles.heroFoot}>
          <Ionicons name="cloud-offline-outline" size={13} color={colors.onDarkSoft} />
          <Text style={styles.heroFootText}>
            Arrêté du 26 juin 2026 · consultable hors réseau
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        data={active ? (loading ? [] : rows) : []}
        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
        ListHeaderComponent={
          active ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <SegmentedControl
                value={filtre}
                onChange={setFiltre}
                options={[
                  { value: 'tout', label: 'Tout', count: arrete.length + meds.length },
                  { value: 'arrete', label: 'Arrêté', count: arrete.length },
                  { value: 'meds', label: 'BDPM', count: meds.length },
                ]}
              />
            </Animated.View>
          ) : (
            <IdleHome
              favorites={favorites}
              recents={recents}
              queries={queries}
              eligibles={eligibles}
              contentUpdate={contentUpdate}
              onQuery={setQuery}
              onOpen={openEntry}
              onLegal={() => navigation.navigate('Legal')}
              onCatalogue={() => navigation.navigate('Catalogue', { screen: 'CatalogueHome' })}
              onBdpm={() => navigation.navigate('Medicaments', { screen: 'MedicamentsHome' })}
              onDomain={(domaineId) =>
                navigation.navigate('Catalogue', { screen: 'Domain', params: { domaineId } })
              }
            />
          )
        }
        ListEmptyComponent={
          !active ? null : loading ? (
            <View style={styles.skeletons}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} delay={120} />
              <SkeletonCard lines={3} delay={240} />
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title="Aucun résultat"
              body={`Rien pour « ${query.trim()} ». Essayez une DCI, un nom commercial ou un mot de l’arrêté.`}
            />
          )
        }
        renderItem={({ item: row, index }) =>
          row.kind === 'arrete' ? (
            <ArreteResult
              item={row.item}
              index={index}
              onPress={() => navigation.navigate('ItemDetail', { itemId: row.item.id })}
            />
          ) : (
            <MedResult
              item={row.item}
              index={index}
              onPress={() =>
                navigation.navigate('MedicationDetail', { medicationId: row.item.id })
              }
            />
          )
        }
      />
    </View>
  );
}

function IdleHome({
  favorites,
  recents,
  queries,
  eligibles,
  contentUpdate,
  onQuery,
  onOpen,
  onLegal,
  onCatalogue,
  onBdpm,
  onDomain,
}: {
  favorites: LibraryEntry[];
  recents: LibraryEntry[];
  queries: string[];
  eligibles: number;
  contentUpdate: ReturnType<typeof useContentUpdateContext>;
  onQuery: (value: string) => void;
  onOpen: (entry: LibraryEntry) => void;
  onLegal: () => void;
  onCatalogue: () => void;
  onBdpm: () => void;
  onDomain: (domaineId: DomaineId) => void;
}) {
  const chips = queries.length > 0 ? queries : SUGGESTIONS;
  const fresh = favorites.length === 0 && recents.length === 0;

  return (
    <View style={styles.idle}>
      <ContentUpdateBanner state={contentUpdate} />

      {favorites.length > 0 ? (
        <View style={styles.block}>
          <SectionHeader label="Mes réflexes" hint="Les fiches que vous avez étoilées." />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.railScroll}
            contentContainerStyle={styles.rail}
          >
            {favorites.map((entry, i) => (
              <FavoriteTile
                key={`${entry.kind}-${entry.id}`}
                kind={entry.kind}
                title={entry.title}
                subtitle={entry.subtitle}
                accent={entry.accent}
                index={i}
                onPress={() => onOpen(entry)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {recents.length > 0 ? (
        <View style={styles.block}>
          <SectionHeader label="Reprendre" hint="Vos dernières fiches ouvertes." />
          {recents.slice(0, 6).map((entry, i) => (
            <Animated.View
              key={`${entry.kind}-${entry.id}`}
              entering={FadeInDown.delay(Math.min(i, 6) * 45).duration(320)}
            >
              <LibraryCard
                kind={entry.kind}
                title={entry.title}
                subtitle={entry.subtitle}
                onPress={() => onOpen(entry)}
              />
            </Animated.View>
          ))}
        </View>
      ) : null}

      {fresh ? (
        <View style={styles.steps}>
          <SectionHeader label="Prise en main" title="Trois gestes, c’est tout" />
          {STEPS.map((step, i) => (
            <Animated.View
              key={step.title}
              entering={FadeInDown.delay(i * 90).duration(360)}
              style={styles.step}
            >
              <View style={styles.stepBubble}>
                <Ionicons name={step.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>
                  {i + 1}. {step.title}
                </Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      ) : null}

      <View style={styles.block}>
        <SectionHeader label="Domaines" hint="Les six blocs de l’arrêté." />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.railScroll}
          contentContainerStyle={styles.rail}
        >
          {DOMAINES.map((domaine, i) => {
            const palette = domainPalette(domaine.id);
            return (
              <Animated.View
                key={domaine.id}
                entering={FadeInDown.delay(Math.min(i, 6) * 45).duration(320)}
              >
                <PressableScale
                  scaleTo={0.93}
                  accessibilityLabel={domaine.titre}
                  onPress={() => onDomain(domaine.id)}
                  style={styles.domain}
                >
                  <LinearGradient
                    colors={palette.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.domainDisc, glow(palette.solid)]}
                  >
                    <Ionicons
                      name={domaine.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.domainRoman}>{domaine.id}</Text>
                  </LinearGradient>
                  <Text style={styles.domainLabel} numberOfLines={2}>
                    {domaine.titre}
                  </Text>
                </PressableScale>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.block}>
        <Text style={styles.chipLabel}>
          {queries.length > 0 ? 'Recherches récentes' : 'Suggestions'}
        </Text>
        <View style={styles.chipRow}>
          {chips.map((chip) => (
            <FilterChip
              key={chip}
              label={chip}
              icon="search-outline"
              active={false}
              onPress={() => onQuery(chip)}
            />
          ))}
        </View>
      </View>

      <View style={styles.statRow}>
        <StatTile
          icon="albums"
          value={ARRETE_ITEMS.length}
          label="rubriques de l’arrêté"
          cta="Parcourir"
          accent={colors.primary}
          tint={colors.primaryTint}
          onPress={onCatalogue}
        />
        <StatTile
          icon="flask"
          value={eligibles}
          label="spécialités dans la liste"
          cta="Ouvrir la liste"
          accent={colors.accent}
          tint={colors.accentSoft}
          onPress={onBdpm}
        />
      </View>

      <DisclaimerBanner onPress={onLegal} />
    </View>
  );
}

function StatTile({
  icon,
  value,
  label,
  cta,
  accent,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  cta: string;
  accent: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <PressableScale scaleTo={0.97} accessibilityLabel={cta} onPress={onPress} style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={15} color={accent} />
      </View>
      <CountUp value={value} style={[styles.statValue, { color: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statCta}>
        <Text style={[styles.statCtaText, { color: accent }]}>{cta}</Text>
        <Ionicons name="arrow-forward" size={12} color={accent} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    overflow: 'hidden',
  },
  haloWarm: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(237,179,149,0.16)',
  },
  haloCool: {
    position: 'absolute',
    bottom: -110,
    left: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitles: { gap: 1 },
  kicker: { ...typography.micro, color: colors.onDarkSoft, letterSpacing: 1.1 },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28 },
  brandAccent: { color: '#EDB395' },
  brandMain: { color: colors.white },
  heroFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 2 },
  heroFootText: { color: colors.onDarkSoft, fontSize: 11.5, fontWeight: '700' },
  list: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: TAB_BAR_CLEARANCE },
  idle: { gap: spacing.lg },
  block: { gap: spacing.sm },
  /** Marge négative : les rails touchent les bords de l'écran, la liste garde son padding. */
  railScroll: { marginHorizontal: -spacing.md },
  rail: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 4 },
  chipLabel: { ...typography.section, color: colors.mutedLight },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  domain: { width: 84, alignItems: 'center', gap: 7 },
  domainDisc: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainRoman: {
    position: 'absolute',
    top: 4,
    right: 7,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
  },
  domainLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    fontSize: 11.5,
    textAlign: 'center',
  },
  steps: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { color: colors.ink, fontWeight: '800', fontSize: 14.5 },
  stepBody: { color: colors.muted, fontSize: 12.5, lineHeight: 17.5 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: 4,
    ...shadow.card,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...typography.title, fontSize: 26, lineHeight: 30 },
  statLabel: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  statCta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statCtaText: { fontSize: 11.5, fontWeight: '800' },
  skeletons: { gap: spacing.sm },
});
