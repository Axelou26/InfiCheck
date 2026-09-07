import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ModalityBadge } from '../components/ModalityBadge';
import { FilterChip, SearchField, SegmentedControl } from '../components/controls';
import { EmptyState, PressableScale, SectionHeader } from '../components/ui';
import { TabRootHeader } from '../components/NavChrome';
import { ARRETE_ITEMS, DOMAINES } from '../data/arreteCatalog';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { colors, domainPalette, radii, shadow, spacing, typography } from '../theme';
import type { DomaineId, ItemCategorie, Modalite } from '../types';

type Vue = 'domaines' | 'rubriques';
type DomaineFiltre = 'tous' | DomaineId;
type ModaliteFiltre = 'toutes' | 'prescrire' | 'renouveler';
type CategorieFiltre = 'toutes' | ItemCategorie;

const CATEGORIE_LABEL: Record<ItemCategorie, string> = {
  medicament: 'Médicament',
  dm: 'DM',
  examen: 'Examen',
};

const MODALITE_OPTIONS: { value: 'prescrire' | 'renouveler'; label: string }[] = [
  { value: 'prescrire', label: 'Prescrire' },
  { value: 'renouveler', label: 'Renouveler' },
];

function matchesModalite(itemModalite: Modalite, filtre: ModaliteFiltre): boolean {
  if (filtre === 'toutes') return true;
  return itemModalite === filtre || itemModalite === 'les_deux';
}

export function CatalogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [vue, setVue] = useState<Vue>('domaines');
  const [query, setQuery] = useState('');
  const [domaineFiltre, setDomaineFiltre] = useState<DomaineFiltre>('tous');
  const [modaliteFiltre, setModaliteFiltre] = useState<ModaliteFiltre>('toutes');
  const [categorieFiltre, setCategorieFiltre] = useState<CategorieFiltre>('toutes');

  const countByDomain = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of ARRETE_ITEMS) {
      counts.set(item.domaine, (counts.get(item.domaine) ?? 0) + 1);
    }
    return counts;
  }, []);

  const filtreActif =
    domaineFiltre !== 'tous' || modaliteFiltre !== 'toutes' || categorieFiltre !== 'toutes';

  const rubriques = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...ARRETE_ITEMS]
      .filter((item) => {
        if (domaineFiltre !== 'tous' && item.domaine !== domaineFiltre) return false;
        if (!matchesModalite(item.modalite, modaliteFiltre)) return false;
        if (categorieFiltre !== 'toutes' && item.categorie !== categorieFiltre) return false;
        if (needle.length < 2) return true;
        return (
          item.titre.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => a.domaine.localeCompare(b.domaine) || a.titre.localeCompare(b.titre, 'fr'));
  }, [query, domaineFiltre, modaliteFiltre, categorieFiltre]);

  function resetFiltres() {
    setDomaineFiltre('tous');
    setModaliteFiltre('toutes');
    setCategorieFiltre('toutes');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <TabRootHeader
        title="Catalogue de l’arrêté"
        subtitle="6 domaines · liste fermée Art. 1"
        icon="albums-outline"
      />
      <SectionHeader
        title="Liste fermée de l’article 1"
        hint="Seuls ces domaines peuvent être prescrits ou renouvelés par l’infirmier."
      />

      <SegmentedControl
        value={vue}
        onChange={setVue}
        options={[
          { value: 'domaines', label: 'Domaines', count: DOMAINES.length },
          { value: 'rubriques', label: 'Rubriques', count: ARRETE_ITEMS.length },
        ]}
      />

      {vue === 'domaines' ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.grid}>
          {DOMAINES.map((d, i) => {
            const palette = domainPalette(d.id);
            const count = countByDomain.get(d.id) ?? 0;
            return (
              <Animated.View
                key={d.id}
                entering={FadeInDown.delay(i * 45).duration(320)}
                style={styles.gridCell}
              >
                <PressableScale
                  accessibilityLabel={`Domaine ${d.id} — ${d.titre}`}
                  onPress={() => navigation.navigate('Domain', { domaineId: d.id })}
                  style={styles.domainShadow}
                >
                  <View style={styles.domainCard}>
                    <LinearGradient
                      colors={palette.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.domainHead}
                    >
                      <View style={styles.domainIcon}>
                        <Ionicons
                          name={d.icon as keyof typeof Ionicons.glyphMap}
                          size={19}
                          color={colors.white}
                        />
                      </View>
                      <Text style={styles.domainRoman}>{d.id}</Text>
                    </LinearGradient>
                    <View style={styles.domainBody}>
                      <Text style={styles.domainTitle} numberOfLines={2}>
                        {d.titre}
                      </Text>
                      <Text style={styles.domainSub} numberOfLines={2}>
                        {d.sousTitre}
                      </Text>
                      <View style={[styles.domainCount, { backgroundColor: palette.tint }]}>
                        <Text style={[styles.domainCountText, { color: palette.onTint }]}>
                          {count} rubrique{count > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={styles.list}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrer les rubriques…"
          />

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Domaine</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="Tous"
                active={domaineFiltre === 'tous'}
                onPress={() => setDomaineFiltre('tous')}
                count={ARRETE_ITEMS.length}
              />
              {DOMAINES.map((d) => {
                const palette = domainPalette(d.id);
                return (
                  <FilterChip
                    key={d.id}
                    label={d.id}
                    active={domaineFiltre === d.id}
                    onPress={() => setDomaineFiltre(d.id)}
                    color={palette.solid}
                    tint={palette.tint}
                    count={countByDomain.get(d.id)}
                  />
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Modalité</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="Toutes"
                active={modaliteFiltre === 'toutes'}
                onPress={() => setModaliteFiltre('toutes')}
              />
              {MODALITE_OPTIONS.map((m) => (
                <FilterChip
                  key={m.value}
                  label={m.label}
                  active={modaliteFiltre === m.value}
                  onPress={() => setModaliteFiltre(m.value)}
                  color={
                    m.value === 'prescrire' ? colors.badgePrescribe : colors.badgeRenew
                  }
                  tint={colors.primarySoft}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterBlock}>
            <Text style={styles.filterLabel}>Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="Tous"
                active={categorieFiltre === 'toutes'}
                onPress={() => setCategorieFiltre('toutes')}
              />
              {(Object.keys(CATEGORIE_LABEL) as ItemCategorie[]).map((c) => (
                <FilterChip
                  key={c}
                  label={CATEGORIE_LABEL[c]}
                  active={categorieFiltre === c}
                  onPress={() => setCategorieFiltre(c)}
                  icon={
                    c === 'medicament'
                      ? 'flask-outline'
                      : c === 'dm'
                        ? 'hardware-chip-outline'
                        : 'water-outline'
                  }
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.resultBar}>
            <Text style={styles.resultCount}>
              {rubriques.length} rubrique{rubriques.length > 1 ? 's' : ''}
            </Text>
            {filtreActif ? (
              <PressableScale
                accessibilityLabel="Réinitialiser les filtres"
                onPress={resetFiltres}
                scaleTo={0.95}
              >
                <Text style={styles.resetFiltres}>Réinitialiser</Text>
              </PressableScale>
            ) : null}
          </View>

          {rubriques.length === 0 ? (
            <EmptyState
              icon="funnel-outline"
              title="Aucune rubrique trouvée"
              body="Élargissez les filtres ou essayez un autre mot-clé."
            />
          ) : (
            rubriques.map((item, i) => {
              const palette = domainPalette(item.domaine);
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInDown.delay(Math.min(i, 8) * 35).duration(300)}
                >
                  <PressableScale
                    scaleTo={0.985}
                    accessibilityLabel={item.titre}
                    onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                    style={styles.rubrique}
                  >
                    <View style={[styles.rubriqueEdge, { backgroundColor: palette.solid }]} />
                    <View style={styles.rubriqueText}>
                      <View style={styles.rubriqueTop}>
                        <View style={[styles.rubriqueDomain, { backgroundColor: palette.tint }]}>
                          <Text style={[styles.rubriqueDomainText, { color: palette.onTint }]}>
                            {item.domaine}
                          </Text>
                        </View>
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{CATEGORIE_LABEL[item.categorie]}</Text>
                        </View>
                        <ModalityBadge modalite={item.modalite} />
                      </View>
                      <Text style={styles.rubriqueTitle}>{item.titre}</Text>
                      <Text style={styles.rubriqueDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={colors.mutedLight} />
                  </PressableScale>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCell: { width: '48%', flexGrow: 1 },
  domainShadow: { borderRadius: radii.md, ...shadow.card },
  domainCard: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  domainHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  domainIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainRoman: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '800' },
  /** Hauteur fixe : garde toutes les tuiles de la grille au même gabarit. */
  domainBody: { padding: spacing.sm, gap: 4, height: 122 },
  domainTitle: { ...typography.label, fontSize: 15, lineHeight: 20, color: colors.ink },
  domainSub: { color: colors.mutedLight, fontSize: 12, lineHeight: 16, fontWeight: '600', flex: 1 },
  domainCount: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  domainCountText: { fontSize: 11, fontWeight: '800' },
  list: { gap: spacing.sm },
  filterBlock: { gap: 6 },
  filterLabel: { ...typography.caption, color: colors.muted, fontWeight: '700' },
  chipRow: { gap: 8, paddingRight: spacing.md },
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  resultCount: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  resetFiltres: { color: colors.accent, fontSize: 13, fontWeight: '800' },
  rubrique: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.md + 4,
    overflow: 'hidden',
    ...shadow.card,
  },
  rubriqueEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  rubriqueText: { flex: 1, gap: 5 },
  rubriqueTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rubriqueDomain: {
    width: 26,
    height: 22,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rubriqueDomainText: { fontSize: 11, fontWeight: '800' },
  catBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  catBadgeText: { fontSize: 10, fontWeight: '800', color: colors.muted },
  rubriqueTitle: { color: colors.ink, fontWeight: '700', fontSize: 15, lineHeight: 20 },
  rubriqueDesc: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
});
