"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  FileCode2,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  Route,
  Server,
  ShieldCheck,
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

const fallbackStatus: LabStatus = {
  appName: "GitOps Console",
  environment: "loading",
  generatedAt: "",
  summary: "Loading lab state from the backend API.",
  metrics: [],
  flow: [],
  manifests: [],
  steps: [],
}

const statusTone = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  active: "border-blue-200 bg-blue-50 text-blue-700",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
}

export function GitOpsDashboard() {
  const [status, setStatus] = useState<LabStatus>(fallbackStatus)
  const [isLoading, setIsLoading] = useState(true)

  async function loadStatus() {
    setIsLoading(true)
    const response = await fetch("/api/lab-status", { cache: "no-store" })
    const payload = (await response.json()) as LabStatus
    setStatus(payload)
    setIsLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    fetch("/api/lab-status", { cache: "no-store" })
      .then((response) => response.json() as Promise<LabStatus>)
      .then((payload) => {
        if (isMounted) {
          setStatus(payload)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-muted/25 text-foreground">
      <section className="border-b bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 md:px-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">W9 GitOps lab</Badge>
              <Badge variant="outline">{status.environment}</Badge>
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">
                {status.appName}
              </h1>
              <p className="text-base leading-7 text-muted-foreground md:text-lg">
                {status.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void loadStatus()} disabled={isLoading}>
                <RefreshCw className={isLoading ? "animate-spin" : ""} />
                Refresh API
              </Button>
              <a
                href="/api/lab-status"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Server className="size-4" />
                View JSON
              </a>
            </div>
          </div>

          <Card className="self-start">
            <CardHeader>
              <CardDescription>Runtime contract</CardDescription>
              <CardTitle className="text-xl">FE calls BE, BE explains GitOps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {status.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="text-sm text-muted-foreground">
                      {metric.label}
                    </div>
                    <div className="font-medium">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.detail}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 md:px-8">
        <Card>
          <CardHeader>
            <CardDescription>How this lab works</CardDescription>
            <CardTitle>Commit to cluster flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-5">
              {status.flow.map((stage, index) => (
                <FlowStageCard
                  key={stage.order}
                  isLast={index === status.flow.length - 1}
                  {...stage}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Frontend / Backend split</CardTitle>
              <CardDescription>
                Clear ownership keeps the app easy to explain and extend.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <LayerCard
                icon={Code2}
                title="Frontend"
                path="src/features/frontend"
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
                items={[
                  "Next.js route handler",
                  "JSON response",
                  "Typed JSON contract",
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline state</CardTitle>
              <CardDescription>
                Generated at{" "}
                {status.generatedAt
                  ? new Date(status.generatedAt).toLocaleTimeString()
                  : "loading"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status.steps.map((step, index) => (
                <div key={step.name} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{step.name}</p>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusTone[step.status]}`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < status.steps.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>What changes for Kubernetes</CardDescription>
            <CardTitle>Manifest update map</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {status.manifests.map((manifest) => (
              <div
                key={manifest.file}
                className="flex gap-3 rounded-lg border bg-background p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileCode2 className="size-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-medium">
                      {manifest.file}
                    </p>
                    <Badge
                      variant={
                        manifest.action === "update" ? "default" : "secondary"
                      }
                    >
                      {manifest.action}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {manifest.reason}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Review gate</CardDescription>
            <CardTitle>Why the bad manifest PR is blocked</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <ReviewGate
              icon={GitPullRequest}
              title="Pull request required"
              description="Direct changes to main are blocked by branch protection."
            />
            <ReviewGate
              icon={ShieldCheck}
              title="validate must pass"
              description="Broken YAML cannot merge because GitHub Actions reports failure."
            />
            <ReviewGate
              icon={GitBranch}
              title="Argo CD only follows main"
              description="The cluster receives approved desired state, not test branches."
            />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function FlowStageCard({
  order,
  title,
  owner,
  description,
  file,
  isLast,
}: {
  order: string
  title: string
  owner: string
  description: string
  file: string
  isLast: boolean
}) {
  return (
    <div className="relative">
      <div className="h-full rounded-lg border bg-background p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs font-medium text-primary-foreground">
            {order}
          </span>
          <Badge variant="outline">{owner}</Badge>
        </div>
        <div className="space-y-2">
          <p className="font-medium">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{file}</p>
        </div>
      </div>
      {!isLast ? (
        <div className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground lg:flex">
          <ArrowRight className="size-4" />
        </div>
      ) : null}
    </div>
  )
}

function ReviewGate({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GitPullRequest
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function LayerCard({
  icon: Icon,
  title,
  path,
  items,
}: {
  icon: typeof Code2
  title: string
  path: string
  items: string[]
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {path}
          </p>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 rounded-full bg-foreground/50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
