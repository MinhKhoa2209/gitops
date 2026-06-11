export type LabStep = {
  name: string
  status: "done" | "active" | "queued"
  description: string
}

export type FlowStage = {
  order: string
  title: string
  owner: string
  description: string
  file: string
}

export type ManifestUpdate = {
  file: string
  reason: string
  action: "keep" | "update"
}

export type LabMetric = {
  label: string
  value: string
  detail: string
}

export type LabStatus = {
  appName: string
  environment: string
  generatedAt: string
  summary: string
  metrics: LabMetric[]
  flow: FlowStage[]
  manifests: ManifestUpdate[]
  steps: LabStep[]
}
