import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { FeatureState, type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import {
  Box,
  Button,
  Combobox,
  type ComboboxOption,
  FeatureBadge,
  Field,
  Icon,
  LoadingPlaceholder,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { type Repository, type ResourceCount, useGetResourceStatsQuery } from 'app/api/clients/provisioning/v0alpha1';

import { ConnectRepositoryButton } from '../Shared/ConnectRepositoryButton';

import { MigrateModal } from './MigrateModal';

interface MigrateProps {
  repos?: Repository[];
}

// Resources that Git Sync can migrate: dashboards and folders not yet managed
// by any provisioning manager.
function countMigratableResources(unmanaged?: ResourceCount[]) {
  let count = 0;
  unmanaged?.forEach((stat) => {
    if (stat.group === 'folders' || stat.group === 'folder.grafana.app' || stat.group === 'dashboard.grafana.app') {
      count += stat.count;
    }
  });
  return count;
}

/**
 * Migrate to GitOps tab — a tool for moving existing folders and dashboards
 * into a Git repository. The user picks a target repository and confirms; the
 * migration job then runs and reports its results inside a modal, the same way
 * the onboarding wizard runs it. When the instance has nothing left to migrate
 * it shows a success state instead. Per-resource selection lands later.
 */
export function Migrate({ repos = [] }: MigrateProps) {
  const styles = useStyles2(getStyles);

  const statsQuery = useGetResourceStatsQuery();
  const unmanagedCount = useMemo(
    () => countMigratableResources(statsQuery.data?.unmanaged),
    [statsQuery.data?.unmanaged]
  );

  const repoOptions = useMemo<Array<ComboboxOption<string>>>(
    () =>
      repos
        .filter((repo) => Boolean(repo.metadata?.name))
        .map((repo) => ({
          label: repo.spec?.title || repo.metadata?.name || '',
          value: repo.metadata?.name ?? '',
          description: repo.spec?.type,
        })),
    [repos]
  );

  // Only pre-select a repository when exactly one is connected. With several
  // repositories available we leave the choice to the user rather than guessing.
  const [selectedRepo, setSelectedRepo] = useState<string | undefined>(() =>
    repoOptions.length === 1 ? repoOptions[0].value : undefined
  );

  const [showModal, setShowModal] = useState(false);

  const selectedRepoLabel = repoOptions.find((opt) => opt.value === selectedRepo)?.label ?? selectedRepo ?? '';

  return (
    <Stack direction="column" gap={3}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center">
          <Text element="h2" variant="h2">
            <Trans i18nKey="provisioning.migrate.header-title">Migrate to GitOps</Trans>
          </Text>
          <FeatureBadge featureState={FeatureState.experimental} />
        </Stack>
        <Text color="secondary">
          <Trans i18nKey="provisioning.migrate.header-subtitle">
            Manage your dashboards and folders like code — every change tracked, every update reviewed, every
            environment reproducible. Connect a Git repository to get started.
          </Trans>
        </Text>
      </Stack>

      {renderContent()}

      {showModal && selectedRepo && (
        <MigrateModal
          repoName={selectedRepo}
          repoLabel={selectedRepoLabel}
          onDismiss={() => setShowModal(false)}
          onMigrated={() => statsQuery.refetch()}
        />
      )}
    </Stack>
  );

  function renderContent() {
    if (statsQuery.isLoading) {
      return (
        <LoadingPlaceholder text={t('provisioning.migrate.loading-stats', 'Checking for resources to migrate…')} />
      );
    }

    // Nothing left to migrate — everything is already managed in Git.
    if (unmanagedCount === 0) {
      return (
        <Box
          paddingY={6}
          paddingX={3}
          borderStyle="solid"
          borderColor="success"
          borderRadius="default"
          backgroundColor="primary"
        >
          <Stack direction="column" gap={2} alignItems="center">
            <Icon name="check-circle" size="xxxl" className={styles.successIcon} />
            <Text element="h3" variant="h3" textAlignment="center">
              <Trans i18nKey="provisioning.migrate.success-title">Everything is managed in Git</Trans>
            </Text>
            <Text color="secondary" textAlignment="center">
              <Trans i18nKey="provisioning.migrate.success-description">
                There are no dashboards or folders left to migrate. New changes are tracked and reviewed in your
                repository, then provisioned back into Grafana.
              </Trans>
            </Text>
          </Stack>
        </Box>
      );
    }

    return (
      <Box padding={3} borderStyle="solid" borderColor="weak" borderRadius="default" backgroundColor="secondary">
        <Stack direction="column" gap={3}>
          <Field
            noMargin
            label={t('provisioning.migrate.repo-label', 'Target repository')}
            description={t(
              'provisioning.migrate.repo-description',
              'The repository your dashboards and folders will be migrated into.'
            )}
          >
            <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
              {repoOptions.length > 0 && (
                <Combobox
                  id="migrate-target-repository"
                  width={40}
                  options={repoOptions}
                  value={selectedRepo ?? null}
                  placeholder={t('provisioning.migrate.repo-placeholder', 'Select a repository')}
                  onChange={(option) => setSelectedRepo(option.value)}
                />
              )}
              <ConnectRepositoryButton items={repos} />
            </Stack>
          </Field>

          <Stack direction="column" gap={1} alignItems="flex-start">
            <Button
              variant="primary"
              disabled={!selectedRepo}
              onClick={() => setShowModal(true)}
              tooltip={
                !selectedRepo
                  ? t('provisioning.migrate.migrate-button-disabled-tooltip', 'Select a target repository first')
                  : undefined
              }
            >
              <Trans i18nKey="provisioning.migrate.migrate-button">Migrate everything</Trans>
            </Button>
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="provisioning.migrate.selective-coming-soon">
                Migrating only selected dashboards and folders is coming soon.
              </Trans>
            </Text>
          </Stack>
        </Stack>
      </Box>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  successIcon: css({
    color: theme.colors.success.text,
  }),
});
