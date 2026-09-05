import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ContentUpdateState } from '../content/useContentUpdate';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { haptic } from '../utils/haptics';
import { PressableScale, PrimaryButton, ProgressBar } from './ui';

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

function phaseLabel(phase: 'download' | 'validate' | 'install'): string {
  if (phase === 'download') return 'Téléchargement…';
  if (phase === 'validate') return 'Vérification de la base…';
  return 'Installation…';
}

/** Carte de statut contenu : date locale, MAJ disponible, progression. */
export function ContentUpdateCard({
  state,
  compact,
}: {
  state: ContentUpdateState;
  compact?: boolean;
}) {
  const { configured, checking, applying, progress, availability, local, error, check, apply } =
    state;

  const importedLabel = local?.importedAt?.replace(/\s*\(.*\)$/, '') ?? '—';
  const available = availability?.status === 'available' ? availability : null;

  if (compact && !available && !applying) {
    return null;
  }

  if (!configured) {
    if (compact) return null;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Base locale</Text>
            <Text style={styles.body}>
              Import BDPM {importedLabel}
              {local?.catalogVersion ? ` · catalogue ${local.catalogVersion}` : ''}
            </Text>
            <Text style={styles.hint}>
              Les mises à jour sans republier l’app seront activées dès qu’un serveur de contenu
              sera configuré.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(280)} style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: available ? colors.accentSoft : colors.primaryTint,
            },
          ]}
        >
          <Ionicons
            name={available ? 'cloud-download' : applying ? 'sync' : 'checkmark-circle'}
            size={16}
            color={available ? colors.accent : colors.primary}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>
            {available
              ? 'Mise à jour disponible'
              : availability?.status === 'upToDate'
                ? 'Contenu à jour'
                : 'Données locales'}
          </Text>
          <Text style={styles.body}>
            Sur cet appareil : {importedLabel}
            {local?.cisCount
              ? ` · ${local.cisCount.toLocaleString('fr-FR')} spécialités`
              : ''}
          </Text>
          {available ? (
            <Text style={styles.hint}>
              {available.manifest.notes?.trim() ||
                `Nouveau paquet ${available.manifest.importedAt} (${formatBytes(available.manifest.db.bytes)})`}
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>

      {applying && progress ? (
        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>{phaseLabel(progress.phase)}</Text>
          <ProgressBar value={progress.progress} height={6} />
        </View>
      ) : null}

      <View style={styles.actions}>
        {available && !applying ? (
          <PrimaryButton
            label={`Mettre à jour (${formatBytes(available.manifest.db.bytes)})`}
            icon="download-outline"
            onPress={() => {
              haptic('medium');
              void apply();
            }}
            style={styles.actionGrow}
          />
        ) : null}
        <PressableScale
          disabled={checking || applying}
          accessibilityLabel="Vérifier les mises à jour"
          onPress={() => {
            haptic('select');
            void check();
          }}
          style={[styles.refreshBtn, (checking || applying) && styles.disabled]}
        >
          <Ionicons
            name={checking ? 'hourglass-outline' : 'refresh'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.refreshText}>{checking ? 'Vérification…' : 'Vérifier'}</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}

/** Bannière courte pour l'accueil quand une MAJ attend. */
export function ContentUpdateBanner({ state }: { state: ContentUpdateState }) {
  if (!state.configured || state.availability?.status !== 'available' || state.applying) {
    return null;
  }
  const bytes = formatBytes(state.availability.manifest.db.bytes);
  return (
    <PressableScale
      accessibilityLabel="Mettre à jour la base"
      onPress={() => {
        haptic('medium');
        void state.apply();
      }}
      style={styles.banner}
    >
      <View style={styles.bannerIcon}>
        <Ionicons name="cloud-download" size={16} color={colors.white} />
      </View>
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>Base à mettre à jour</Text>
        <Text style={styles.bannerBody}>
          {state.availability.manifest.importedAt} · {bytes} · hors ligne ensuite
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={colors.accent} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadow.card,
  },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 3 },
  title: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  body: { color: colors.muted, fontSize: 12.5, lineHeight: 17 },
  hint: { color: colors.inkSoft, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  error: { color: colors.danger, fontSize: 12.5, lineHeight: 17, marginTop: 2, fontWeight: '600' },
  progressBlock: { gap: 6 },
  progressLabel: { ...typography.caption, color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  actionGrow: { flexGrow: 1 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.primaryTint,
  },
  refreshText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  disabled: { opacity: 0.5 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E8C4B4',
    padding: spacing.sm,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 1 },
  bannerTitle: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  bannerBody: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
});
