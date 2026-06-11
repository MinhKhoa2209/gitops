# GitOps Console

A small full-stack Next.js app for the W9 GitOps lab.

## Stack

- Next.js `16.2.9`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- shadcn/ui

## Structure

```text
src/
  app/
    api/
      health/
        route.ts              # Kubernetes health endpoint
      lab-status/
        route.ts              # Backend API endpoint
    layout.tsx
    page.tsx                  # Page shell
  components/
    ui/                       # shadcn/ui components
  features/
    backend/
      lab-status.ts           # Server-side data builder
    frontend/
      gitops-dashboard.tsx    # Client UI
    shared/
      lab-status.ts           # Shared TypeScript contract
```

## Run Locally

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Backend endpoint:

```text
http://localhost:3000/api/lab-status
```

Health endpoint:

```text
http://localhost:3000/api/health
```

## Verify

```powershell
npm run lint
npm run build
```

## Build Container Image

The Kubernetes manifest expects this local image tag:

```text
gitops-console:0.1.0
```

Build it from the repository root:

```powershell
docker build -t gitops-console:0.1.0 web-app
```

If you use minikube, load the image into the `w9` profile:

```powershell
minikube image load gitops-console:0.1.0 -p w9
```
