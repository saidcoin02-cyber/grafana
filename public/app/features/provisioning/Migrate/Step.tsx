import { css, cx } from '@emotion/css';
import { type ReactNode } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';

interface StepProps {
  number: number;
  title: string;
  description?: string;
  /** Highlight the step with a green accent to signal it's the action to take first. */
  highlight?: boolean;
  children?: ReactNode;
}

/**
 * A single numbered step in the Migrate to GitOps flow. When `highlight` is set
 * the box and number get a green accent to draw the user to the first action.
 */
export function Step({ number, title, description, highlight, children }: StepProps) {
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
});
