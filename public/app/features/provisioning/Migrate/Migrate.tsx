import { FeatureState } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, FeatureBadge, Spinner, Stack, Text } from '@grafana/ui';

import { FoldersToMigrate } from './FoldersToMigrate';
import { useFolderMigrationData } from './hooks/useFolderMigrationData';

function MigrateToGitopsHeader() {
  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={1} alignItems="center">
        <Text element="h2" variant="h2">
          <Trans i18nKey="provisioning.migrate.header-title">Migrate to GitOps</Trans>
        </Text>
        <FeatureBadge featureState={FeatureState.experimental} />
      </Stack>
      <Text color="secondary">
        <Trans i18nKey="provisioning.migrate.header-subtitle">
          Manage your dashboards and folders like code — every change tracked, every update reviewed, every environment
          reproducible. Connect a Git repository to get started.
        </Trans>
      </Text>
    </Stack>
  );
}

/**
 * Migrate to GitOps tab. Lists the folders and dashboards that aren't yet
 * provisioned so admins can see what's left to migrate into a Git repository.
 * The overview KPIs, quick wins and the migrate drawer land in follow-up
 * changes.
 */
export function Migrate() {
  const { data: folders, isLoading, isError } = useFolderMigrationData();

  if (isLoading) {
    return (
      <Stack direction="row" alignItems="center" gap={1}>
        <Spinner />
        <Trans i18nKey="provisioning.migrate.loading-folders">Loading folders...</Trans>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" title={t('provisioning.migrate.folders-error-title', 'Failed to load folder list')}>
        <Trans i18nKey="provisioning.migrate.folders-error-body">
          The Migrate page needs the list of folders and dashboards to figure out what to migrate. Refresh the page to
          try again.
        </Trans>
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={3}>
      <MigrateToGitopsHeader />
      <FoldersToMigrate folders={folders} />
    </Stack>
  );
}
