"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  FileCode2,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { LabStatus } from "@/features/shared/lab-status"

/* ─── Fallback data ─── */
const fallbackStatus: LabStatus = {
  appName: "GitOps Console",
  environment: "loading",
  generatedAt: "",
  summary: "Loading lab state from the backend API…",
  metrics: [],
  flow: [],
  manifests: [],
  steps: [],
}

/* ─── Status colour map ─── */
const statusConfig = {
  done: {
    badge:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    glow: "shadow-[0_0_12px_oklch(0.75_0.18_155_/_0.25)]",
  },
  active: {
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    icon: Zap,
    iconColor: "text-violet-400",
    glow: "shadow-[0_0_12px_oklch(0.63_0.24_270_/_0.25)]",
  },
  queued: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Clock,
    iconColor: "text-amber-400",
    glow: "shadow-[0_0_12px_oklch(0.78_0.18_75_/_0.25)]",
  },
}

/* ─── Main dashboard ─── */
export function GitOpsDashboard() {
  const [status, setStatus] = useState<LabStatus>(fallbackStatus)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  async function loadStatus() {
    setIsLoading(true)
    const response = await fetch("/api/lab-status", { cache: "no-store" })
    const payload = (await response.json()) as LabStatus
    setStatus(payload)
    setIsLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    let isMounted = true
    fetch("/api/lab-status", { cache: "no-store" })
      .then((r) => r.json() as Promise<LabStatus>)
      .then((payload) => {
        if (isMounted) {
          setStatus(payload)
          setIsLoading(false)
          setLastRefresh(new Date())
        }
      })
    return () => { isMounted = false }
  }, [])

  return (
    <main className="min-h-screen text-foreground">
      {/* ── Hero header ── */}
      <header className="hero-gradient relative border-b border-border/40">
        <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-8">
          {/* Top row */}
          <div className="mb-8 flex flex-wrap items-center gap-2 animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400">
              <Sparkles className="size-3" />
              W9 GitOps Lab
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
              {status.environment}
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Left – title + summary */}
            <div className="space-y-6 animate-fade-in-up delay-100">
              <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
                <span className="gradient-text">{status.appName}</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {status.summary}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  id="btn-refresh"
                  onClick={() => void loadStatus()}
                  disabled={isLoading}
                  className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-105 hover:shadow-violet-500/40 disabled:opacity-60"
                  size="lg"
                >
                  <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh API
                </Button>

                <a
                  id="link-view-json"
                  href="/api/lab-status"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-white/5 px-4 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-violet-500/40 hover:bg-white/8 hover:text-foreground"
                >
                  <Server className="size-4" />
                  View JSON
                  <ExternalLink className="size-3 opacity-60" />
                </a>

                {lastRefresh && (
                  <span className="text-xs text-muted-foreground/60">
                    Last updated {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Right – metrics card */}
            <div className="animate-fade-in-up delay-200">
              <div className="glass rounded-2xl p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Runtime contract
                </p>
                <p className="mb-5 text-base font-semibold text-foreground">
                  FE calls BE, BE explains GitOps
                </p>

                <div className="grid gap-3">
                  {status.metrics.map((metric, i) => (
                    <div
                      key={metric.label}
                      className={`group relative overflow-hidden rounded-xl border border-border/40 bg-white/[0.03] p-3 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/5 animate-fade-in-up`}
                      style={{ animationDelay: `${(i + 3) * 100}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
                            {metric.label}
                          </p>
                          <p className="mt-0.5 font-semibold text-foreground">
                            {metric.value}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/80">
                            {metric.detail}
                          </p>
                        </div>
                        <div className="mt-0.5 size-7 shrink-0 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <div className="size-2 rounded-full bg-violet-400 pulse-glow" />
                        </div>
                      </div>
                      {/* shimmer on hover */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content sections ── */}
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 md:px-8">

        {/* ── GitOps flow ── */}
        <section className="animate-fade-in-up delay-200">
          <SectionHeading
            label="How this lab works"
            title="Commit → Cluster Flow"
            icon={GitBranch}
          />
          <div className="mt-5 grid gap-3 lg:grid-cols-5">
            {status.flow.map((stage, index) => (
              <FlowStageCard
                key={stage.order}
                isLast={index === status.flow.length - 1}
                index={index}
                {...stage}
              />
            ))}
          </div>
        </section>

        {/* ── Architecture + Pipeline ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Architecture split */}
          <section className="animate-fade-in-up delay-300">
            <SectionHeading
              label="Architecture"
              title="Frontend / Backend split"
              icon={Code2}
            />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <LayerCard
                icon={Code2}
                title="Frontend"
                path="src/features/frontend"
                accent="violet"
                items={[
                  "Client component",
                  "shadcn/ui cards and buttons",
                  "Tailwind responsive layout",
                ]}
              />
              <LayerCard
                icon={Server}
                title="Backend"
                path="src/features/backend"
                accent="emerald"
                items={[
                  "Server-side data builder",
                  "Environment-aware values",
                  "No UI code",
                ]}
              />
              <LayerCard
                icon={Route}
                title="API boundary"
                path="src/app/api/lab-status"
                accent="amber"
                items={[
                  "Next.js route handler",
                  "JSON response",
                  "Typed JSON contract",
                ]}
              />
            </div>
          </section>

          {/* Pipeline state */}
          <section className="animate-fade-in-up delay-400">
            <SectionHeading
              label="Pipeline state"
              title="Live step status"
              icon={Zap}
              extra={
                status.generatedAt
                  ? `Generated at ${new Date(status.generatedAt).toLocaleTimeString()}`
                  : undefined
              }
            />
            <div className="mt-5 glass rounded-2xl p-5 space-y-0">
              {status.steps.map((step, index) => {
                const cfg = statusConfig[step.status]
                const Icon = cfg.icon
                return (
                  <div key={step.name}>
                    <div className={`group flex gap-4 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-white/[0.03] ${cfg.glow.replace("shadow", "hover:shadow")}`}>
                      <div className="mt-0.5 shrink-0">
                        <Icon className={`size-5 ${cfg.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-sm text-foreground">{step.name}</p>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}
                          >
                            {step.status}
                          </span>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < status.steps.length - 1 && (
                      <Separator className="my-1 opacity-30" />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── Manifest update map ── */}
        <section className="animate-fade-in-up delay-300">
          <SectionHeading
            label="What changes for Kubernetes"
            title="Manifest update map"
            icon={FileCode2}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {status.manifests.map((manifest, i) => (
              <ManifestCard key={manifest.file} manifest={manifest} index={i} />
            ))}
          </div>
        </section>

        {/* ── Review gates ── */}
        <section className="animate-fade-in-up delay-400">
          <SectionHeading
            label="Review gate"
            title="Why the bad manifest PR is blocked"
            icon={ShieldCheck}
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ReviewGateCard
              icon={GitPullRequest}
              title="Pull request required"
              description="Direct changes to main are blocked by branch protection."
              accent="violet"
            />
            <ReviewGateCard
              icon={ShieldCheck}
              title="validate must pass"
              description="Broken YAML cannot merge because GitHub Actions reports failure."
              accent="emerald"
            />
            <ReviewGateCard
              icon={GitBranch}
              title="Argo CD only follows main"
              description="The cluster receives approved desired state, not test branches."
              accent="amber"
            />
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground/50">
        <span>GitOps Console · W9 Lab · Powered by Next.js, Argo CD &amp; Kubernetes</span>
      </footer>
    </main>
  )
}

/* ─── Section heading ─── */
function SectionHeading({
  label,
  title,
  icon: Icon,
  extra,
}: {
  label: string
  title: string
  icon: typeof GitBranch
  extra?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          <Icon className="mr-1.5 inline size-3.5 -mt-0.5" />
          {label}
        </p>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {extra && (
        <p className="text-xs text-muted-foreground/60">{extra}</p>
      )}
    </div>
  )
}

/* ─── Flow stage card ─── */
function FlowStageCard({
  order,
  title,
  owner,
  description,
  file,
  isLast,
  index,
}: {
  order: string
  title: string
  owner: string
  description: string
  file: string
  isLast: boolean
  index: number
}) {
  return (
    <div
      className="relative animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="group h-full rounded-2xl border border-border/40 bg-white/[0.03] p-4 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/[0.04] hover:shadow-lg hover:shadow-violet-500/10">
        {/* Top row */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-2 py-1 font-mono text-xs font-bold text-white shadow-sm shadow-violet-500/30">
            {order}
          </span>
          <span className="rounded-full border border-border/50 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {owner}
          </span>
        </div>
        {/* Body */}
        <div className="space-y-2">
          <p className="font-semibold text-sm text-foreground leading-snug">{title}</p>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          <p className="font-mono text-[10px] text-muted-foreground/50 pt-1">{file}</p>
        </div>
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <div className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-violet-500/30 bg-background text-violet-400 shadow-sm lg:flex">
          <ArrowRight className="size-3.5" />
        </div>
      )}
    </div>
  )
}

/* ─── Layer card (architecture) ─── */
const accentConfig = {
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    dot: "bg-violet-400/60",
    border: "hover:border-violet-500/30",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    dot: "bg-emerald-400/60",
    border: "hover:border-emerald-500/30",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    dot: "bg-amber-400/60",
    border: "hover:border-amber-500/30",
  },
} as const

type AccentKey = keyof typeof accentConfig

function LayerCard({
  icon: Icon,
  title,
  path,
  items,
  accent,
}: {
  icon: typeof Code2
  title: string
  path: string
  items: string[]
  accent: AccentKey
}) {
  const cfg = accentConfig[accent]
  return (
    <div
      className={`group rounded-2xl border border-border/40 bg-white/[0.03] p-4 transition-all duration-300 ${cfg.border} hover:bg-white/[0.05]`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex size-9 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconText}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground/60">{path}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Manifest card ─── */
function ManifestCard({
  manifest,
  index,
}: {
  manifest: { file: string; reason: string; action: "keep" | "update" }
  index: number
}) {
  const isUpdate = manifest.action === "update"
  return (
    <div
      className={`group flex gap-4 rounded-2xl border p-4 transition-all duration-300 animate-fade-in-up ${
        isUpdate
          ? "border-violet-500/25 bg-violet-500/[0.05] hover:border-violet-500/40"
          : "border-border/40 bg-white/[0.03] hover:border-border/60"
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
          isUpdate
            ? "bg-violet-500/15 text-violet-400"
            : "bg-white/5 text-muted-foreground"
        }`}
      >
        <FileCode2 className="size-5" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-semibold text-foreground">
            {manifest.file}
          </p>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isUpdate
                ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                : "border-border/50 bg-white/5 text-muted-foreground"
            }`}
          >
            {manifest.action}
          </span>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">{manifest.reason}</p>
      </div>
    </div>
  )
}

/* ─── Review gate card ─── */
function ReviewGateCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: typeof GitPullRequest
  title: string
  description: string
  accent: AccentKey
}) {
  const cfg = accentConfig[accent]
  return (
    <div
      className={`group rounded-2xl border border-border/40 bg-white/[0.03] p-5 transition-all duration-300 ${cfg.border} hover:bg-white/[0.05]`}
    >
      <div
        className={`mb-4 flex size-11 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconText} transition-transform duration-300 group-hover:scale-110`}
      >
        <Icon className="size-5" />
      </div>
      <div className="space-y-1.5">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
