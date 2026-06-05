import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Button, Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';

import { PROVISIONING_URL } from '../constants';

interface MigrationCompleteProps {
  onStartOver: () => void;
}

/**
 * Success state shown once the migration finishes. Replaces the step-by-step
 * flow entirely so the user sees a clear confirmation rather than the setup UI.
 */
export function MigrationComplete({ onStartOver }: MigrationCompleteProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Stack direction="column" gap={2} alignItems="center">
        <Icon name="check-circle" size="xxxl" className={styles.icon} />
        <Text element="h2" variant="h2" textAlignment="center">
          <Trans i18nKey="provisioning.migrate.complete-title">Migration complete</Trans>
        </Text>
        <Text color="secondary" textAlignment="center">
          <Trans i18nKey="provisioning.migrate.complete-description">
            Your dashboards and folders are now managed in Git. From here on, changes are tracked and reviewed in your
            repository, then provisioned back into Grafana.
          </Trans>
        </Text>
        <Stack direction="row" gap={2}>
          <LinkButton variant="primary" href={PROVISIONING_URL}>
            <Trans i18nKey="provisioning.migrate.complete-view-repositories">View repositories</Trans>
          </LinkButton>
          <Button variant="secondary" onClick={onStartOver}>
            <Trans i18nKey="provisioning.migrate.complete-start-over">Start over</Trans>
          </Button>
        </Stack>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: theme.spacing(6, 3),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.success.borderTransparent}`,
    background: theme.colors.background.primary,
  }),
  icon: css({
    color: theme.colors.success.text,
  }),
});
