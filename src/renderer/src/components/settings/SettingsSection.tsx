import type React from 'react'

type SettingsSectionProps = {
  id: string
  title: string
  description: string
  children?: React.ReactNode
  className?: string
  badge?: string
  badgeAccessory?: React.ReactNode
  headerAction?: React.ReactNode
}

/**
 * @deprecated The new settings layout renders panes directly without wrapping
 * sections. This component is kept temporarily for any sub-section usage within
 * individual panes but should not be used for top-level settings sections.
 */
export function SettingsSection({
  id,
  title,
  description,
  children,
  className,
  badge,
  badgeAccessory,
  headerAction
}: SettingsSectionProps): React.JSX.Element {
  return (
    <section id={id} data-settings-section={id} className={className ?? 'space-y-4'}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {title}
            {badge ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {badge}
              </span>
            ) : null}
            {badgeAccessory}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  )
}
