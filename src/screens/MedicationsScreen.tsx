import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EligibiliteBadge } from '../components/EligibiliteBadge';
import { MedIdentity } from '../components/MedIdentity';
import { FilterChip, SearchField } from '../components/controls';
import { ContentUpdateCard } from '../components/ContentUpdateCard';
import { CountUp } from '../components/motion';
import { EmptyState, Pill, PressableScale, SkeletonCard } from '../components/ui';
import { useContentUpdateContext } from '../content/ContentUpdateProvider';
import { getMedicationStats, getMeta, listMedicaments, searchMedicaments } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { BdpmMedicament, NiveauIde } from '../types';

type Filtre = 'liste' | NiveauIde | 'tous';

const FILTRES: {
  value: Filtre;
  label: string;
  color: string;
  tint: string;
  icon?: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'liste', label: 'Liste IDE', color: colors.primary, tint: colors.primarySoft, icon: 'medkit-outline' },
  { value: 'oui', label: 'Dans la liste', color: colors.ok, tint: colors.okSoft, icon: 'checkmark-circle-outline' },
  { value: 'conditions', label: 'Sous conditions', color: colors.warn, tint: colors.warnSoft, icon: 'alert-circle-outline' },
  { value: 'non', label: 'Hors liste', color: colors.danger, tint: colors.dangerSoft, icon: 'close-circle-outline' },
  { value: 'tous', label: 'Tous', color: colors.muted, tint: colors.surfaceMuted, icon: 'layers-outline' },
];

export function MedicationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const contentUpdate = useContentUpdateContext();
  const [query, setQuery] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('liste');
  const [items, setItems] = useState<BdpmMedicament[]>([]);
  const [importedAt, setImportedAt] = useState('');
  const [stats, setStats] = useState({ total: 0, eligible: 0, autorisees: 0, sousConditions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeta('bdpm_imported_at').then((v) => setImportedAt(v ?? ''));
    getMedicationStats().then(setStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    const niveau = filtre === 'tous' ? null : filtre;
    const timer = setTimeout(() => {
      const run =
        query.trim().length >= 2
          ? searchMedicaments(query, niveau)
          : listMedicaments(80, niveau);
      run.then(setItems).finally(() => setLoading(false));
    }, 180);
    return () => clearTimeout(timer);
  }, [query, filtre]);

  const counts: Record<Filtre, number> = {
    liste: stats.eligible,
    tous: stats.total,
    oui: stats.autorisees,
    conditions: stats.sousConditions,
    non: Math.max(0, stats.total - stats.eligible),
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      data={loading ? [] : items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.sourceCard}>
            <View style={styles.sourceIcon}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={styles.sourceText}>
              <Text style={styles.sourceTitle}>Base publique des médicaments</Text>
              <Text style={styles.sourceSub}>
                <CountUp value={stats.total} style={styles.sourceStrong} /> spécialités
                {importedAt ? ` · import du ${importedAt}` : ''}
              </Text>
            </View>
          </View>

          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Nom commercial ou substance…"
          />

          <ContentUpdateCard state={contentUpdate} compact />

          <View style={styles.chipRow}>
            {FILTRES.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                icon={f.icon}
                color={f.color}
                tint={f.tint}
                count={counts[f.value]}
                active={filtre === f.value}
                onPress={() => setFiltre(f.value)}
              />
            ))}
          </View>

          {!loading && items.length > 0 ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <Text style={styles.resultCount}>
                {items.length} résultat{items.length > 1 ? 's' : ''}
                {items.length >= 80 ? ' (80 max — affinez la recherche)' : ''}
              </Text>
            </Animated.View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} delay={110} />
            <SkeletonCard lines={3} delay={220} />
            <SkeletonCard lines={3} delay={330} />
          </View>
        ) : (
          <EmptyState
            icon="flask-outline"
            title="Aucune spécialité"
            body="Aucune spécialité ne correspond à ce filtre et à cette recherche."
          />
        )
      }
      renderItem={({ item }) => {
        const dispo =
          item.dispoLibelle && item.dispoCode && item.dispoCode !== '4' ? item.dispoLibelle : null;
        return (
          <PressableScale
            scaleTo={0.985}
            accessibilityLabel={item.nomCommercial}
            onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
            style={styles.card}
          >
            <View style={styles.badgeRow}>
              <EligibiliteBadge niveau={item.niveauIde} />
              {dispo ? <Pill label={dispo} tone="danger" icon="warning-outline" /> : null}
              {item.hasInfoImportante ? (
                <Pill label="Info sécurité" tone="warn" icon="information-circle-outline" />
              ) : null}
              {item.isMitm ? <Pill label="MITM" tone="primary" /> : null}
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
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: TAB_BAR_CLEARANCE },
  header: { gap: spacing.sm, paddingBottom: spacing.xs },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: { flex: 1, gap: 2 },
  sourceTitle: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  sourceSub: { color: colors.primaryMid, fontSize: 12, lineHeight: 16 },
  sourceStrong: { color: colors.primary, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  resultCount: { ...typography.section, color: colors.mutedLight, marginTop: spacing.xs },
  skeletons: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
