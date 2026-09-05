import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FavoriteToggle } from '../components/FavoriteToggle';
import { eligibiliteTone } from '../components/EligibiliteBadge';
import { MedMonogram, RemboursementBadge } from '../components/MedIdentity';
import { Collapsible } from '../components/controls';
import {
  GhostButton,
  Pill,
  PressableScale,
  PrimaryButton,
  Skeleton,
  SkeletonCard,
  Toast,
} from '../components/ui';
import { getItemById, getMedicamentDetail } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { pushRecent } from '../storage/library';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { ArreteItem, BdpmAvisHas, BdpmMedicamentDetail, NiveauIde } from '../types';
import { haptic } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetail'>;

const HERO_GRADIENTS: Record<NiveauIde, readonly [string, string]> = {
  oui: ['#4C8259', '#325C41'],
  conditions: ['#A2782B', '#71521A'],
  non: ['#9E4B4B', '#753636'],
};

function formatHasDate(s: string) {
  const d = (s || '').replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
  return s || '—';
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstHref(html: string) {
  const m = html.match(/href=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

export function MedicationDetailScreen({ route, navigation }: Props) {
  const [med, setMed] = useState<BdpmMedicamentDetail | null>(null);
  const [linked, setLinked] = useState<ArreteItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMedicamentDetail(route.params.medicationId).then(async (m) => {
      setMed(m);
      if (m) {
        navigation.setOptions({ title: m.nomCommercial });
        void pushRecent({
          kind: 'med',
          id: m.id,
          title: m.nomCommercial,
          subtitle: m.substances || 'BDPM',
          accent: eligibiliteTone(m.niveauIde).solid,
        });
      }
      if (m?.itemArreteId) {
        setLinked(await getItemById(m.itemArreteId));
      }
    });
  }, [route.params.medicationId, navigation]);

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

  if (!med) {
    return (
      <View style={styles.loading}>
        <Skeleton width="70%" height={26} />
        <Skeleton width="45%" height={16} />
        <SkeletonCard lines={3} delay={100} />
        <SkeletonCard lines={4} delay={220} />
      </View>
    );
  }

  const tone = eligibiliteTone(med.niveauIde);
  const dispo =
    med.dispoLibelle && med.dispoCode && med.dispoCode !== '4' ? med.dispoLibelle : null;

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={HERO_GRADIENTS[med.niveauIde]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroStatus}>
              <Ionicons name={tone.icon} size={16} color={colors.white} />
              <Text style={styles.heroStatusText}>{tone.long}</Text>
            </View>
            <FavoriteToggle
              kind="med"
              id={med.id}
              title={med.nomCommercial}
              subtitle={med.substances || 'BDPM'}
              accent={tone.solid}
            />
          </View>
          {med.conditionsIde ? (
            <View style={styles.heroConditions}>
              <Text style={styles.heroConditionsText}>{med.conditionsIde}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.identityCard}>
            <MedMonogram nomCommercial={med.nomCommercial} size={54} />
            <View style={styles.identityText}>
              <Text style={styles.name}>{med.nomCommercial}</Text>
              <Text style={styles.fullName}>{med.nom}</Text>
              <Text style={styles.meta}>
                CIS {med.cis}
                {med.codeAtc ? ` · ATC ${med.codeAtc}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.chipRow}>
            <RemboursementBadge remboursable={med.remboursable} tauxLabel={med.tauxRemboursement} />
            {dispo ? <Pill label={dispo} tone="danger" icon="warning-outline" /> : null}
            {med.hasInfoImportante ? (
              <Pill label="Info de sécurité" tone="warn" icon="information-circle-outline" />
            ) : null}
            {med.surveillanceRenforcee ? (
              <Pill label="Surveillance renforcée" tone="warn" icon="eye-outline" />
            ) : null}
            {med.isMitm ? <Pill label="MITM" tone="primary" icon="medkit-outline" /> : null}
            {med.etatCommercialisation ? (
              <Pill label={med.etatCommercialisation} tone="neutral" />
            ) : null}
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={copied === med.nom ? 'Nom copié' : 'Copier le nom'}
              icon={copied === med.nom ? 'checkmark-circle' : 'copy-outline'}
              onPress={() => copyText(med.nom)}
              style={styles.actionPrimary}
            />
            <GhostButton
              label="Fiche BDPM"
              icon="open-outline"
              onPress={() => Linking.openURL(med.ficheBdpmUrl)}
              style={styles.actionGhost}
            />
          </View>

          {linked ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <PressableScale
                scaleTo={0.985}
                accessibilityLabel="Voir la fiche arrêté liée"
                onPress={() => navigation.navigate('ItemDetail', { itemId: linked.id })}
                style={styles.linkCard}
              >
                <View style={styles.linkIcon}>
                  <Ionicons name="link" size={17} color={colors.primary} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>Rubrique de l’arrêté liée</Text>
                  <Text style={styles.linkBody} numberOfLines={2}>
                    {linked.titre}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
              </PressableScale>
            </Animated.View>
          ) : null}

          {med.infosImportantes.length > 0 ? (
            <View style={styles.alerts}>
              {med.infosImportantes.map((info, i) => {
                const href = firstHref(info.texte);
                return (
                  <View key={`${info.dateDebut}-${i}`} style={styles.alertCard}>
                    <View style={styles.alertHead}>
                      <Ionicons name="megaphone" size={15} color={colors.warn} />
                      <Text style={styles.alertLabel}>Information importante</Text>
                    </View>
                    <Text style={styles.alertBody}>{stripHtml(info.texte)}</Text>
                    <Text style={styles.caption}>
                      {info.dateDebut}
                      {info.dateFin ? ` → ${info.dateFin}` : ''}
                    </Text>
                    {href ? <ExternalLink label="Voir sur le site ANSM" url={href} /> : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {med.ruptures.length > 0 ? (
            <Collapsible
              title={`Disponibilité / ruptures (${med.ruptures.length})`}
              subtitle="Signalements ANSM"
              icon="alert-circle"
              accent={colors.danger}
              tint={colors.dangerSoft}
              defaultOpen
            >
              {med.ruptures.map((r, i) => (
                <View key={`${r.cip}-${i}`} style={styles.subCard}>
                  <Text style={styles.subTitle}>{r.libelleStatut || 'Information disponibilité'}</Text>
                  {r.cip ? <Text style={styles.caption}>CIP {r.cip}</Text> : null}
                  <Text style={styles.caption}>
                    Début {r.dateDebut || '—'}
                    {r.dateRemise ? ` · remise prévue ${r.dateRemise}` : ''}
                    {r.dateMaj ? ` · MAJ ${r.dateMaj}` : ''}
                  </Text>
                  {r.url ? <ExternalLink label="Fiche ANSM" url={r.url} /> : null}
                </View>
              ))}
            </Collapsible>
          ) : null}

          {med.conditionsDelivrance.length > 0 ? (
            <Collapsible
              title="Prescription et délivrance"
              subtitle={`${med.conditionsDelivrance.length} condition${med.conditionsDelivrance.length > 1 ? 's' : ''}`}
              icon="lock-closed"
              defaultOpen
            >
              {med.conditionsDelivrance.map((c) => (
                <Bullet key={c} text={c} />
              ))}
            </Collapsible>
          ) : null}

          <Collapsible
            title="Composition"
            subtitle={med.compositions.length ? `${med.compositions.length} élément(s)` : 'DCI'}
            icon="water"
            defaultOpen
          >
            {med.compositions.length > 0 ? (
              med.compositions.map((c, i) => (
                <Bullet
                  key={`${c.codeSubstance}-${i}`}
                  text={[
                    c.substance,
                    c.dosage,
                    c.refDosage ? `(${c.refDosage})` : '',
                    c.nature ? `· ${c.nature}` : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))
            ) : (
              <Bullet text={med.substances} />
            )}
          </Collapsible>

          <Collapsible title="Spécialité" subtitle="Forme, voies, AMM, titulaire" icon="information-circle">
            <InfoRow label="Forme" value={med.forme} />
            <InfoRow label="Voie(s)" value={med.voies} />
            <InfoRow label="État" value={med.etatCommercialisation} />
            <InfoRow label="AMM" value={med.statutAmm} />
            <InfoRow label="Date AMM" value={med.dateAmm} />
            <InfoRow label="Procédure" value={med.typeProcedure} />
            <InfoRow label="Titulaire" value={med.titulaire} />
          </Collapsible>

          {med.generiques.length > 0 || med.nomsCommerciauxGroupe.length > 0 ? (
            <Collapsible
              title="Groupe générique"
              subtitle={`${med.nomsCommerciauxGroupe.length} nom(s) commercial(aux)`}
              icon="git-compare"
            >
              {med.generiques.map((g, i) => (
                <Bullet
                  key={`${g.groupeId}-${i}`}
                  text={[g.typeLibelle, g.libelle].filter(Boolean).join(' — ')}
                />
              ))}
              {med.nomsCommerciauxGroupe.length > 0 ? (
                <View style={styles.groupChips}>
                  {med.nomsCommerciauxGroupe.map((n) => (
                    <Pill
                      key={`${n.cis}-${n.nomCommercial}`}
                      label={n.nomCommercial}
                      tone="neutral"
                    />
                  ))}
                </View>
              ) : null}
            </Collapsible>
          ) : null}

          {med.presentations.length > 0 ? (
            <Collapsible
              title={`Présentations (${med.presentations.length})`}
              subtitle="CIP, prix, remboursement"
              icon="cube"
            >
              {med.presentations.slice(0, 12).map((p, i) => (
                <View key={`${p.cip13 || p.cip7}-${i}`} style={styles.subCard}>
                  <Text style={styles.subTitle}>{p.libelle}</Text>
                  <Text style={styles.caption}>
                    {[p.cip13 && `CIP13 ${p.cip13}`, p.etatCommercialisation, p.prix && `${p.prix} €`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {p.tauxRemboursement ? (
                    <Pill label={`Remboursable ${p.tauxRemboursement}`} tone="accent" dot />
                  ) : (
                    <Pill label="Non remboursable" tone="neutral" />
                  )}
                </View>
              ))}
              {med.presentations.length > 12 ? (
                <Text style={styles.caption}>
                  + {med.presentations.length - 12} autre(s) présentation(s) sur la fiche BDPM
                </Text>
              ) : null}
            </Collapsible>
          ) : null}

          <AvisBlock title="Avis SMR (HAS)" avis={med.avisSmr} />
          <AvisBlock title="Avis ASMR (HAS)" avis={med.avisAsmr} />

          <Text style={styles.disclaimer}>
            Données issues de la BDPM (ANSM / HAS / UNCAM), import local de l’ensemble des fichiers
            officiels. Vérifiez toujours la notice et le texte de l’arrêté sur Légifrance.
          </Text>
        </View>
      </Animated.ScrollView>

      <Toast label="Copié dans le presse-papier" visible={copied !== null} />
    </View>
  );
}

function AvisBlock({ title, avis }: { title: string; avis: BdpmAvisHas[] }) {
  if (!avis.length) return null;
  return (
    <Collapsible title={title} subtitle={`${avis.length} avis`} icon="ribbon">
      {avis.map((a, i) => (
        <View key={`${a.codeHas}-${i}`} style={styles.subCard}>
          <Text style={styles.subTitle}>
            {a.valeur || 'Avis'}
            {a.dateAvis ? ` · ${formatHasDate(a.dateAvis)}` : ''}
          </Text>
          {a.motif ? <Text style={styles.caption}>{a.motif}</Text> : null}
          {a.libelle ? (
            <Text style={styles.avisText} numberOfLines={8}>
              {a.libelle}
            </Text>
          ) : null}
          {a.url ? <ExternalLink label="Ouvrir l’avis HAS" url={a.url} /> : null}
        </View>
      ))}
    </Collapsible>
  );
}

function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={label}
      scaleTo={0.96}
      onPress={() => Linking.openURL(url)}
      style={styles.link}
    >
      <Ionicons name="open-outline" size={14} color={colors.primaryMid} />
      <Text style={styles.linkLabel}>{label}</Text>
    </PressableScale>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
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
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  heroStatus: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroStatusText: { flex: 1, color: colors.white, fontWeight: '800', fontSize: 14.5, lineHeight: 20 },
  heroConditions: {
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  heroConditionsText: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 19 },
  body: { padding: spacing.md, gap: spacing.sm },
  identityCard: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  identityText: { flex: 1, gap: 2 },
  name: { ...typography.title, fontSize: 23, color: colors.ink },
  fullName: { color: colors.inkSoft, fontSize: 13.5, lineHeight: 19 },
  meta: { color: colors.mutedLight, fontSize: 11.5, fontWeight: '700', marginTop: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  actionPrimary: { flex: 1.4 },
  actionGhost: { flex: 1 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    padding: spacing.sm,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { flex: 1, gap: 2 },
  linkTitle: { ...typography.micro, color: colors.primaryMid },
  linkBody: { color: colors.ink, fontWeight: '700', fontSize: 14, lineHeight: 19 },
  alerts: { gap: spacing.sm },
  alertCard: {
    backgroundColor: colors.warnSoft,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warn,
    padding: spacing.md,
    gap: 5,
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertLabel: { ...typography.micro, color: colors.warn },
  alertBody: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  subCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 5,
  },
  subTitle: { color: colors.ink, fontWeight: '700', fontSize: 14, lineHeight: 19 },
  avisText: { color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryMid,
    marginTop: 7,
  },
  bulletText: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 21 },
  infoRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  infoLabel: { width: 92, color: colors.mutedLight, fontSize: 12, fontWeight: '800' },
  infoValue: { flex: 1, color: colors.inkSoft, fontSize: 14, lineHeight: 20 },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  link: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  linkLabel: {
    color: colors.primaryMid,
    fontWeight: '700',
    fontSize: 13.5,
    textDecorationLine: 'underline',
  },
  disclaimer: { color: colors.mutedLight, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
});
