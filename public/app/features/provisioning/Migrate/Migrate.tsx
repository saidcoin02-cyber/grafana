import { css } from '@emotion/css';
import { useMemo, useState } from 'react';

import { FeatureState, type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, FeatureBadge, Icon, LoadingPlaceholder, Stack, Text, useStyles2 } from '@grafana/ui';
import { type Repository, type ResourceCount, useGetResourceStatsQuery } from 'app/api/clients/provisioning/v0alpha1';

import { MigrateDrawer } from './MigrateDrawer';

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
 * into a Git repository. Starting a migration opens a drawer (consistent with
 * other provisioning jobs) where the user selects the target repository,
 * confirms, and watches the job's progress and result. When the instance has
 * nothing left to migrate it shows a success state instead. Per-resource
 * selection lands later.
 */
export function Migrate({ repos = [] }: MigrateProps) {
  const styles = useStyles2(getStyles);

  const statsQuery = useGetResourceStatsQuery();
  const unmanagedCount = useMemo(
    () => countMigratableResources(statsQuery.data?.unmanaged),
    [statsQuery.data?.unmanaged]
  );

  const [showDrawer, setShowDrawer] = useState(false);

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

      {showDrawer && (
        <MigrateDrawer repos={repos} onDismiss={() => setShowDrawer(false)} onMigrated={() => statsQuery.refetch()} />
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
        <Stack direction="column" gap={2} alignItems="flex-start">
          <Text>
            <Trans i18nKey="provisioning.migrate.intro">
              Move your existing dashboards and folders into a Git repository. You will pick the target repository and
              review what happens next.
            </Trans>
          </Text>
          <Button variant="primary" onClick={() => setShowDrawer(true)}>
            <Trans i18nKey="provisioning.migrate.start-button">Start migration</Trans>
          </Button>
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
