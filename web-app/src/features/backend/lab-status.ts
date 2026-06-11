import type { LabStatus } from "@/features/shared/lab-status"

const steps: LabStatus["steps"] = [
  {
    name: "Commit desired state",
    status: "done",
    description: "Source code and Kubernetes manifests are committed to Git.",
  },
  {
    name: "CI validates YAML",
    status: "done",
    description: "The validate workflow blocks broken manifests before merge.",
  },
  {
    name: "Argo CD reconciles",
    status: "done",
    description: "Root and web Applications pull the approved state into Kubernetes.",
  },
  {
    name: "Service receives traffic",
    status: "active",
    description: "The Service exposes the Next.js app inside the demo namespace.",
  },
]

export function getLabStatus(): LabStatus {
  return {
    appName: "GitOps Console",
    environment: process.env.APP_ENV ?? "local-lab",
    generatedAt: new Date().toISOString(),
    summary:
      "A small full-stack Next.js app that explains how GitHub, CI, Argo CD, and Kubernetes work together in this lab.",
    metrics: [
      {
        label: "Frontend",
        value: "Next.js 16",
        detail: "Client dashboard with shadcn/ui and Tailwind CSS",
      },
      {
        label: "Backend",
        value: "API route",
        detail: "Typed JSON from /api/lab-status",
      },
      {
        label: "Delivery",
        value: "GitOps",
        detail: "Argo CD app-of-apps controls the cluster state",
      },
    ],
    flow: [
      {
        order: "01",
        title: "Developer pushes code",
        owner: "GitHub",
        description:
          "App code and manifests are versioned together so every change has history.",
        file: "web-app/ + k8s/",
      },
      {
        order: "02",
        title: "CI protects main",
        owner: "GitHub Actions",
        description:
          "The validate job checks manifests before a pull request can merge.",
        file: ".github/workflows/validate.yml",
      },
      {
        order: "03",
        title: "Root app finds child apps",
        owner: "Argo CD",
        description:
          "The root Application watches argocd/apps and creates child Applications.",
        file: "argocd/root.yaml",
      },
      {
        order: "04",
        title: "Web app syncs Kubernetes",
        owner: "Argo CD",
        description:
          "The web Application watches k8s and applies Namespace, ConfigMap, Deployment, and Service.",
        file: "argocd/apps/web.yaml",
      },
      {
        order: "05",
        title: "Kubernetes runs the app",
        owner: "Kubernetes",
        description:
          "The Deployment starts the Next.js container and the Service routes traffic to it.",
        file: "k8s/web.yaml",
      },
    ],
    manifests: [
      {
        file: "argocd/root.yaml",
        action: "keep",
        reason: "Still points to argocd/apps, so it does not need to change for a new app image.",
      },
      {
        file: "argocd/apps/web.yaml",
        action: "keep",
        reason: "Still points to k8s, where the desired Kubernetes state lives.",
      },
      {
        file: "k8s/namespace.yaml",
        action: "keep",
        reason: "The namespace remains demo and should continue syncing first.",
      },
      {
        file: "k8s/web.yaml",
        action: "update",
        reason: "Deployment image, container port, probes, and ConfigMap now describe the Next.js app instead of nginx.",
      },
    ],
    steps,
  }
}
