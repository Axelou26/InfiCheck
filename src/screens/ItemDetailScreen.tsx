import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AntalgiqueCalculator } from '../components/AntalgiqueCalculator';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { FicheChecklist } from '../components/FicheChecklist';
import { GuidePrescription } from '../components/GuidePrescription';
import { MedGroupList } from '../components/MedGroupList';
import { ModalityBadge } from '../components/ModalityBadge';
import { BackButton } from '../components/NavChrome';
import { PansementParcours } from '../components/PansementParcours';
import { Collapsible, SearchField } from '../components/controls';
import {
  PressableScale,
  SectionHeader,
  Skeleton,
  SkeletonCard,
  Toast,
} from '../components/ui';
import { getDomaine } from '../data/arreteCatalog';
import { EXEMPLES_ORDONNANCE } from '../data/exemplesOrdonnance';
import { getGuideForItem, vaccinCorrespondAuChoix } from '../data/guidesPrescription';
import {
  countMedicamentsByItemId,
  getItemById,
  getMedicamentsByItemId,
  type MedAvailability,
} from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { pushRecent } from '../storage/library';
import { colors, domainPalette, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem, BdpmMedicament } from '../types';
import { haptic } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<ArreteItem | null>(null);
  const [meds, setMeds] = useState<BdpmMedicament[]>([]);
  const [medQuery, setMedQuery] = useState('');
  const [medAvailability, setMedAvailability] = useState<MedAvailability>({
    total: 0,
    commercialisees: 0,
  });
  const [showRetired, setShowRetired] = useState(false);
  const [guideSituation, setGuideSituation] = useState('');
  const [medsLoading, setMedsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = route.params.itemId;
    setMedQuery('');
    setShowRetired(false);
    setGuideSituation('');
    getItemById(id).then((found) => {
      setItem(found);
      if (found) {
        const domaine = getDomaine(found.domaine);
        void pushRecent({
          kind: 'arrete',
          id: found.id,
          title: found.titre,
          subtitle: domaine.titre,
          accent: domainPalette(found.domaine).solid,
        });
      }
    });
  }, [route.params.itemId]);

  useEffect(() => {
    const id = route.params.itemId;
    let cancelled = false;
    setMedsLoading(true);
    const timer = setTimeout(() => {
      countMedicamentsByItemId(id)
        .then((counts) => {
          if (cancelled) return;
          setMedAvailability(counts);
          const onlyCommercial = !showRetired && counts.commercialisees > 0;
          return getMedicamentsByItemId(id, 80, medQuery, { commercialise: onlyCommercial });
        })
        .then((list) => {
          if (cancelled || !list) return;
          setMeds(list);
        })
        .finally(() => {
          if (!cancelled) setMedsLoading(false);
        });
    }, medQuery.trim().length >= 2 ? 180 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [route.params.itemId, medQuery, showRetired]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const filtreVaccin = item?.id === 'vac-calendrier' && guideSituation.length > 0;
  const medsAffiches = useMemo(() => {
    if (!filtreVaccin) return meds;
    return meds.filter((med) => vaccinCorrespondAuChoix(guideSituation, med.nom));
  }, [filtreVaccin, meds, guideSituation]);

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
  const retiredCount = Math.max(0, medAvailability.total - medAvailability.commercialisees);
  const listingCommercialise = !showRetired && medAvailability.commercialisees > 0;
  const medHeadingCount = listingCommercialise
    ? medAvailability.commercialisees
    : medAvailability.total;
  const exemples = EXEMPLES_ORDONNANCE[item.id] ?? [];
  const guide = getGuideForItem(item.id);
  const isPansementParcours = item.id === 'plaie-pansements';
  const situationLabel = guide?.situations.find((s) => s.id === guideSituation)?.label;
  const listeTronquee =
    !filtreVaccin && medQuery.trim().length < 2 && medHeadingCount > medsAffiches.length;

  function handleCopied(text: string) {
    setCopied(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setCopied(null), 1700);
  }

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
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
        >
          <View style={styles.heroTop}>
            <BackButton light />
            <FavoriteToggle
              kind="arrete"
              id={item.id}
              title={item.titre}
              subtitle={meta.titre}
              accent={palette.solid}
            />
          </View>
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

          {!isPansementParcours ? <FicheChecklist item={item} /> : null}

          {guide && !isPansementParcours ? (
            <Collapsible
              title={guide.titre}
              subtitle={guide.sousTitre}
              icon="options-outline"
              accent={palette.solid}
              tint={palette.tint}
            >
              <GuidePrescription
                itemId={item.id}
                accent={palette.solid}
                tint={palette.tint}
                onCopied={handleCopied}
                onSituationChange={setGuideSituation}
                onOpenItem={(nextId) => navigation.navigate('ItemDetail', { itemId: nextId })}
              />
            </Collapsible>
          ) : null}

          {item.id === 'prod-antalgiques' ? (
            <Collapsible
              title="Calculateur palier I"
              subtitle="Dose, intervalle et max journalier"
              icon="calculator-outline"
              accent={palette.solid}
              tint={palette.tint}
            >
              <AntalgiqueCalculator
                accent={palette.solid}
                tint={palette.tint}
                onCopied={handleCopied}
              />
            </Collapsible>
          ) : null}

          <Collapsible
            title="Obligations"
            subtitle="Traçabilité, information, coordination"
            icon="shield-checkmark"
            accent={palette.solid}
            tint={palette.tint}
          >
            {item.obligations.map((o) => (
              <Bullet key={o} text={o} color={palette.solid} />
            ))}
          </Collapsible>

          {medAvailability.total > 0 ? (
            <Collapsible
              title="Médicaments"
              subtitle={
                filtreVaccin && situationLabel
                  ? `Pour le choix « ${situationLabel} »`
                  : item.id === 'plaie-antiseptiques'
                    ? 'Mêmes produits que « Sérum physio et antiseptiques » — ici, plaie récente ≤ 5 jours, hors pied diabétique'
                    : 'Les noms possibles pour cette rubrique.'
              }
              icon="flask"
              accent={palette.solid}
              tint={palette.tint}
            >
              <SearchField
                value={medQuery}
                onChangeText={setMedQuery}
                placeholder="Nom ou molécule…"
              />
              {retiredCount > 0 ? (
                <PressableScale
                  scaleTo={0.98}
                  accessibilityLabel={
                    showRetired
                      ? 'Masquer les médicaments qui ne sont plus vendus'
                      : 'Voir les médicaments qui ne sont plus vendus'
                  }
                  onPress={() => setShowRetired((value) => !value)}
                >
                  <Text style={styles.medSearchHint}>
                    {showRetired
                      ? 'Masquer ceux qui ne sont plus vendus'
                      : `Voir ceux qui ne sont plus vendus (${retiredCount})`}
                  </Text>
                </PressableScale>
              ) : null}
              {medsLoading ? (
                <Text style={styles.medSearchHint}>Recherche…</Text>
              ) : medsAffiches.length === 0 ? (
                <Text style={styles.medSearchHint}>
                  {filtreVaccin && guideSituation === 'mineur'
                    ? 'Hors cadre avant 11 ans — aucun vaccin à proposer ici.'
                    : filtreVaccin
                      ? 'Aucun vaccin pour ce choix.'
                      : `Aucun médicament pour « ${medQuery.trim()} » dans cette rubrique.`}
                </Text>
              ) : (
                <>
                  {listeTronquee ? (
                    <Text style={styles.medSearchHint}>
                      La liste est longue. Cherchez le nom pour le trouver plus vite.
                    </Text>
                  ) : null}
                  {medQuery.trim().length >= 2 ? (
                    <Text style={styles.medSearchHint}>
                      {medsAffiches.length} résultat{medsAffiches.length > 1 ? 's' : ''}
                    </Text>
                  ) : null}
                  <MedGroupList
                    meds={medsAffiches}
                    copied={copied}
                    accent={palette.solid}
                    forceOpen={medQuery.trim().length >= 2}
                    onCopy={copyText}
                    onOpen={(id) => navigation.navigate('MedicationDetail', { medicationId: id })}
                  />
                </>
              )}
            </Collapsible>
          ) : null}

          {!isPansementParcours ? (
            <Animated.View entering={FadeInDown.duration(320)} style={styles.block}>
              <SectionHeader
                label="Sur l’ordonnance"
                hint={
                  exemples.length > 0
                    ? 'Le libellé à écrire, une fois le cadre vérifié. Touchez pour copier.'
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
          ) : (
            <Collapsible
              title="Parcours pansements"
              subtitle="Vérifier la plaie, puis le texte à écrire"
              icon="git-branch-outline"
              accent={palette.solid}
              tint={palette.tint}
              defaultOpen
            >
              <PansementParcours
                item={item}
                accent={palette.solid}
                tint={palette.tint}
                onCopied={handleCopied}
              />
            </Collapsible>
          )}
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
    alignSelf: 'flex-start',
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
  medSearchHint: { color: colors.muted, fontSize: 12.5, fontWeight: '600' },
});
