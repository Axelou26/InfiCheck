import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, PressableScale, SectionHeader } from '../components/ui';
import { ContentUpdateCard } from '../components/ContentUpdateCard';
import { useContentUpdateContext } from '../content/ContentUpdateProvider';
import { ARRETE_META } from '../data/arreteCatalog';
import { TAB_BAR_CLEARANCE } from '../navigation/TabBar';
import { useConsent } from '../storage/consent';
import {
  readDisclaimerAcceptance,
  type DisclaimerAcceptance,
} from '../storage/preferences';
import { colors, radii, spacing, typography } from '../theme';

function formatAcceptedAt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR');
}

export function LegalScreen() {
  const { reviewTerms } = useConsent();
  const contentUpdate = useContentUpdateContext();
  const [acceptance, setAcceptance] = useState<DisclaimerAcceptance | null>(null);

  useEffect(() => {
    readDisclaimerAcceptance().then(setAcceptance);
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(320)} style={styles.intro}>
        <View style={styles.introIcon}>
          <Text style={styles.introIconText}>§</Text>
        </View>
        <Text style={styles.introText}>
          Inficheck est un outil d’aide à la pratique pour les infirmiers libéraux. Il ne se
          substitue pas au texte officiel, au jugement clinique, ni à la coordination avec le
          médecin.
        </Text>
      </Animated.View>

      <Block label="Référence légale" delay={60}>
        <Text style={styles.body}>{ARRETE_META.titre}</Text>
        <View style={styles.metaRow}>
          <MetaChip label={`NOR ${ARRETE_META.nor}`} />
          <MetaChip label={ARRETE_META.jo} />
        </View>
        <LinkRow
          icon="library-outline"
          label="Ouvrir sur Légifrance"
          url={ARRETE_META.legifrance}
        />
      </Block>

      <Block label="Données médicaments" delay={120}>
        <Text style={styles.body}>
          Les données médicaments proviennent de l’ensemble des fichiers officiels de la Base de
          données publique des médicaments (ANSM / HAS / UNCAM) : spécialités, présentations,
          compositions, avis SMR/ASMR, groupes génériques, conditions de prescription et de
          délivrance, ruptures de stock, MITM et informations importantes.
        </Text>
        <Text style={styles.caption}>
          Licence Ouverte — citer la source et la date de mise à jour, ne pas dénaturer les données.
          Cette réutilisation n’a pas de caractère officiel et ne vaut pas caution de l’ANSM, de la
          HAS ou de l’UNCAM.
        </Text>
        <LinkRow
          icon="cloud-download-outline"
          label="Page Téléchargement BDPM"
          url={`${ARRETE_META.bdpm}/telechargement`}
        />
      </Block>

      <Animated.View entering={FadeInDown.delay(150).duration(320)} style={styles.block}>
        <SectionHeader label="Mise à jour du contenu" />
        <Text style={styles.body}>
          L’arrêté et la BDPM peuvent être rafraîchis sur cet appareil sans republier l’application.
          Le téléchargement se fait en Wi-Fi de préférence (~40 Mo), puis tout reste consultable hors
          réseau.
        </Text>
        <ContentUpdateCard state={contentUpdate} />
      </Animated.View>

      <Block label="Traçabilité" delay={180}>
        <Text style={styles.body}>
          Toute prescription mentionnée par l’arrêté fait l’objet d’une inscription au dossier
          patient ou au dossier médical partagé (Art. 2).
        </Text>
      </Block>

      <Block label="Conditions d’usage" delay={240}>
        <Text style={styles.body}>
          Les quatre points acceptés au premier lancement restent consultables à tout moment.
        </Text>
        <Text style={styles.caption}>
          {acceptance
            ? `Acceptées le ${formatAcceptedAt(acceptance.acceptedAt)} · version ${acceptance.version}`
            : 'Aucune acceptation enregistrée sur cet appareil.'}
        </Text>
        <PressableScale
          accessibilityLabel="Revoir les conditions d’usage"
          scaleTo={0.97}
          onPress={reviewTerms}
          style={styles.linkRow}
        >
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
          <Text style={styles.linkText}>Revoir les conditions d’usage</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.primary} />
        </PressableScale>
      </Block>
    </ScrollView>
  );
}

function Block({
  label,
  children,
  delay,
}: {
  label: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={styles.block}>
      <SectionHeader label={label} />
      <Card style={styles.card}>{children}</Card>
    </Animated.View>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  url,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
}) {
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={label}
      scaleTo={0.97}
      onPress={() => Linking.openURL(url)}
      style={styles.linkRow}
    >
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="arrow-forward" size={15} color={colors.primary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: TAB_BAR_CLEARANCE },
  intro: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.primaryTint,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  introIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introIconText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  introText: { flex: 1, color: colors.inkSoft, fontSize: 14.5, lineHeight: 21 },
  block: { gap: spacing.xs },
  card: { gap: spacing.sm },
  body: { color: colors.inkSoft, fontSize: 14.5, lineHeight: 21 },
  caption: { color: colors.muted, fontSize: 12.5, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  chipText: { ...typography.micro, color: colors.muted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },
  linkText: { flex: 1, color: colors.primary, fontWeight: '800', fontSize: 14 },
});
