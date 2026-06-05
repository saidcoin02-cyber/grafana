import { css, cx } from '@emotion/css';
import { type ReactNode, useMemo, useState } from 'react';

import { FeatureState, type GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import {
  Alert,
  Badge,
  Button,
  Card,
  Combobox,
  type ComboboxOption,
  FeatureBadge,
  Field,
  Stack,
  Text,
  TextLink,
  useStyles2,
} from '@grafana/ui';
import { type Repository } from 'app/api/clients/provisioning/v0alpha1';

import { ConnectRepositoryButton } from '../Shared/ConnectRepositoryButton';
import { CONFIGURE_GRAFANA_DOCS_URL, GIT_SYNC_DOCS_URL } from '../constants';

type MigrationMode = 'everything' | 'selective';

interface MigrateProps {
  repos?: Repository[];
}

/**
 * Migrate to GitOps tab. This is the entry point for moving existing folders
 * and dashboards into a Git repository. The interactive migration workflow
 * (folder leaderboard, quick wins, the migrate drawer) lands in follow-up
 * changes — for now the tab walks the user through the first steps: choosing
 * the repository to migrate into and how much to migrate.
 */
export function Migrate({ repos = [] }: MigrateProps) {
  const styles = useStyles2(getStyles);

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

  // Selective migration isn't available yet, so "everything" is the only mode.
  const [mode, setMode] = useState<MigrationMode>('everything');

  return (
    <Stack direction="column" gap={2}>
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

      <Step
        number={1}
        highlight
        title={t('provisioning.migrate.step-connect-title', 'Connect a repository')}
        description={t(
          'provisioning.migrate.step-connect-description',
          'Choose the Git repository your dashboards and folders will be migrated into. Start here.'
        )}
      >
        <Stack direction="row" gap={1} alignItems="flex-end" wrap="wrap">
          {repoOptions.length > 0 && (
            <Field noMargin label={t('provisioning.migrate.step-connect-repo-label', 'Target repository')}>
              <Combobox
                id="migrate-target-repository"
                width={40}
                options={repoOptions}
                value={selectedRepo ?? null}
                placeholder={t('provisioning.migrate.step-connect-repo-placeholder', 'Select a repository')}
                onChange={(option) => setSelectedRepo(option.value)}
              />
            </Field>
          )}
          <ConnectRepositoryButton items={repos} />
        </Stack>
      </Step>

      <Step
        number={2}
        title={t('provisioning.migrate.step-scope-title', 'Choose what to migrate')}
        description={t(
          'provisioning.migrate.step-scope-description',
          'Decide how much of your Grafana instance moves into the repository.'
        )}
      >
        <Stack direction="column" gap={1}>
          <Card noMargin isSelected={mode === 'everything'} onClick={() => setMode('everything')}>
            <Card.Heading>
              <Trans i18nKey="provisioning.migrate.scope-everything-title">Migrate everything</Trans>
            </Card.Heading>
            <Card.Description>
              <Trans i18nKey="provisioning.migrate.scope-everything-description">
                Move all of your folders and dashboards into the repository in a single migration. This is the simplest
                way to get your whole instance under version control.
              </Trans>
            </Card.Description>
          </Card>

          <Card noMargin isSelected={mode === 'selective'} disabled>
            <Card.Heading>
              <Trans i18nKey="provisioning.migrate.scope-selective-title">Choose specific folders</Trans>
            </Card.Heading>
            <Card.Tags>
              <Badge color="blue" text={t('provisioning.migrate.scope-selective-badge', 'Coming soon')} />
            </Card.Tags>
            <Card.Description>
              <Trans i18nKey="provisioning.migrate.scope-selective-description">
                Pick individual folders and dashboards to migrate while leaving the rest of your instance untouched.
              </Trans>
            </Card.Description>
          </Card>
        </Stack>
      </Step>

      <Step
        number={3}
        title={t('provisioning.migrate.step-migrate-title', 'Start the migration')}
        description={t(
          'provisioning.migrate.step-migrate-description',
          "When you're ready, run the migration. This is a one-time step — after it completes, future changes are saved to the repository automatically."
        )}
      >
        <Stack direction="column" gap={2}>
          <Alert
            severity="warning"
            title={t(
              'provisioning.migrate.migrate-warning-title',
              'Review Git Sync limitations before migrating'
            )}
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
                    Resources can still be created, edited, or deleted during the migration, but those changes may not
                    be exported.
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
              disabled={!selectedRepo}
              tooltip={
                !selectedRepo
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

      <Text color="secondary">
        <Trans i18nKey="provisioning.migrate.intro">
          New to Git Sync? Read the{' '}
          <TextLink external href={CONFIGURE_GRAFANA_DOCS_URL}>
            provisioning documentation
          </TextLink>{' '}
          to learn how it keeps Grafana and your repository in step.
        </Trans>
      </Text>
    </Stack>
  );
}

interface StepProps {
  number: number;
  title: string;
  description?: string;
  /** Highlight the step with a green accent to signal it's the action to take first. */
  highlight?: boolean;
  children?: ReactNode;
}

function Step({ number, title, description, highlight, children }: StepProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.stepBox, highlight && styles.stepBoxHighlight)}>
      <Stack direction="row" gap={2} alignItems="flex-start">
        <div className={cx(styles.stepNumber, highlight && styles.stepNumberHighlight)} aria-hidden>
          {number}
        </div>
        <Stack direction="column" gap={1} flex={1}>
          <Text element="h3" variant="h4">
            {title}
          </Text>
          {description && <Text color="secondary">{description}</Text>}
          {children}
        </Stack>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  stepBox: css({
    padding: theme.spacing(3),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.primary,
  }),
  // The first step is highlighted with a green accent and soft glow to signal
  // it's the action the user should take first.
  stepBoxHighlight: css({
    border: `1px solid ${theme.colors.success.borderTransparent}`,
    boxShadow: `0 0 0 1px ${theme.colors.success.transparent}, 0 0 16px 0 ${theme.colors.success.transparent}`,
  }),
  stepNumber: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: theme.spacing(4),
    height: theme.spacing(4),
    borderRadius: theme.shape.radius.circle,
    backgroundColor: theme.colors.secondary.main,
    color: theme.colors.secondary.contrastText,
    fontWeight: theme.typography.fontWeightBold,
  }),
  stepNumberHighlight: css({
    backgroundColor: theme.colors.success.main,
    color: theme.colors.success.contrastText,
  }),
  warningList: css({
    marginLeft: theme.spacing(2),
    marginBottom: 0,
  }),
});
