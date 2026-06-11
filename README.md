# W9 GitOps Hands-on Lab

Standalone GitOps lab for W9 morning practice.

This repository demonstrates the core GitOps workflow:

```text
Git -> GitHub -> Argo CD -> Kubernetes -> App
```

The lab uses a simple nginx web application so the focus stays on GitOps concepts:

- Git as the source of truth
- Argo CD pull-based sync
- Automated prune and self-heal
- Rollback through `git revert`
- App-of-apps
- Sync waves
- GitHub Actions manifest validation

## Repository

```text
https://github.com/MinhKhoa2209/gitops
```

Local path:

```text
D:\AWS\gitops
```

## Folder Structure

```text
gitops/
  .github/
    workflows/
      validate.yml
  argocd/
    root.yaml
    apps/
      web.yaml
  k8s/
    namespace.yaml
    web.yaml
  README.md
```

## What Each File Does

- `.github/workflows/validate.yml`: validates Kubernetes manifests with `kubeconform`.
- `argocd/root.yaml`: root Argo CD Application for the app-of-apps pattern.
- `argocd/apps/web.yaml`: child Argo CD Application that syncs the `k8s/` folder.
- `k8s/namespace.yaml`: creates the `demo` namespace first with sync wave `-1`.
- `k8s/web.yaml`: defines ConfigMap, Deployment, and Service with sync waves.

## Prerequisites

Install or prepare:

- Docker Desktop
- minikube
- kubectl
- git
- A GitHub account with access to this repo

Check tools:

```powershell
docker --version
minikube version
kubectl version --client
git --version
```

## Run The Lab

Start a local Kubernetes cluster:

```powershell
minikube start -p w9 --driver=docker
kubectl config use-context w9
kubectl get nodes
```

Install Argo CD:

```powershell
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deployment/argocd-server --timeout=240s
```

Bootstrap the first Application:

```powershell
kubectl apply -f argocd\apps\web.yaml
```

Then bootstrap app-of-apps:

```powershell
kubectl apply -f argocd\root.yaml
```

Check Argo CD:

```powershell
kubectl -n argocd get applications
kubectl -n argocd get application web
```

Check the demo app:

```powershell
kubectl -n demo get all
```

Port-forward the Service:

```powershell
kubectl -n demo port-forward svc/web 8080:80
```

Open from another terminal:

```powershell
curl.exe http://127.0.0.1:8080/
```

## Validate Manifests

Local Kubernetes dry-run:

```powershell
kubectl apply --dry-run=client --validate=false -f k8s
```

GitHub Actions also runs the `validate` workflow on pushes or pull requests that touch:

- `k8s/**`
- `argocd/**`
- `.github/workflows/**`

## GitOps Practice

Change the desired state in Git, then push:

```powershell
git add .
git commit -m "update desired state"
git push
```

Refresh Argo CD if needed:

```powershell
kubectl -n argocd annotate application web argocd.argoproj.io/refresh=hard --overwrite
```

Rollback with Git:

```powershell
git revert HEAD --no-edit
git push
```

## Completion Checklist

- [x] Public GitHub repo created.
- [x] Initial web manifest committed.
- [x] Argo CD child Application added.
- [x] Root app-of-apps Application added.
- [x] Sync waves added.
- [x] GitHub Actions validation workflow added.
- [x] Validation workflow has completed successfully.
- [x] Kubernetes manifests pass local dry-run validation.
