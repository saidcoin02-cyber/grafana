import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Button, Field, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';

import { GIT_SYNC_DOCS_URL } from '../constants';

import { Step } from './Step';

interface StartMigrationStepProps {
  number: number;
  /** Disabled until a target repository has been selected in the first step. */
  disabled: boolean;
  onMigrate: () => void;
}

/**
 * Final step: surface the Git Sync limitations (mirroring the onboarding
 * wizard) and let the user kick off the migration once a repository is chosen.
 */
export function StartMigrationStep({ number, disabled, onMigrate }: StartMigrationStepProps) {
  const styles = useStyles2(getStyles);

  return (
    <Step
      number={number}
      title={t('provisioning.migrate.step-migrate-title', 'Start the migration')}
      description={t(
        'provisioning.migrate.step-migrate-description',
        "When you're ready, run the migration. This is a one-time step — after it completes, future changes are saved to the repository automatically."
      )}
    >
      <Stack direction="column" gap={2}>
        <Alert
          severity="warning"
          title={t('provisioning.migrate.migrate-warning-title', 'Review Git Sync limitations before migrating')}
        >
          <Stack direction="column" gap={1}>
            <Text>
              <Trans i18nKey="provisioning.migrate.migrate-warning-intro">
                Please be aware of the following limitations. For more details, see the{' '}
                <TextLink external href={GIT_SYNC_DOCS_URL}>
                  Git Sync documentation
                </TextLink>
                .
              </Trans>
            </Text>
            <ul className={styles.warningList}>
              <li>
                <Trans i18nKey="provisioning.migrate.migrate-warning-point-resources">
                  Resources can still be created, edited, or deleted during the migration, but those changes may not be
                  exported.
                </Trans>
              </li>
              <li>
                <Trans i18nKey="provisioning.migrate.migrate-warning-point-unsupported">
                  Alerts and library panels are not supported in provisioned folders and will not be migrated.
                </Trans>
              </li>
              <li>
                <Trans i18nKey="provisioning.migrate.migrate-warning-point-duration">
                  The duration of the migration depends on the number of resources involved.
                </Trans>
              </li>
            </ul>
          </Stack>
        </Alert>
        <Field noMargin>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={onMigrate}
            tooltip={
              disabled
                ? t(
                    'provisioning.migrate.migrate-button-disabled-tooltip',
                    'Select a target repository in step 1 first'
                  )
                : undefined
            }
          >
            <Trans i18nKey="provisioning.migrate.migrate-button">Begin migration</Trans>
          </Button>
        </Field>
      </Stack>
    </Step>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  warningList: css({
    marginLeft: theme.spacing(2),
    marginBottom: 0,
  }),
});
