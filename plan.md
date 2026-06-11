# W9 GitOps Hands-on Lab Plan

Muc tieu: tu chay lab GitOps buoi sang bang terminal tren repo rieng `gitops`.

Repo lab:

```text
https://github.com/MinhKhoa2209/gitops
```

Thu muc local:

```text
D:\AWS\gitops
```

Lab nay di theo luong:

```text
Git -> GitHub -> Argo CD -> Kubernetes -> App
```

Quy tac quan trong:

- Khong `kubectl apply` workload app theo cach binh thuong.
- Thay doi app bang Git commit + push.
- Argo CD la ben dong bo desired state tu Git vao cluster.
- Chi apply bang tay nhung resource bootstrap: Argo CD install, Application dau tien, root Application.

## Cau truc thu muc lab

Luc moi bat dau, repo chi can co file app dau tien:

```text
gitops/
  k8s/
    web.yaml                  # Deployment nginx dau tien, replicas = 2
```

Sau Lab 2, repo co them Argo CD Application dau tien:

```text
gitops/
  argocd/
    apps/
      web.yaml                # Argo CD Application quan ly folder k8s/
  k8s/
    web.yaml                  # Kubernetes manifest duoc Argo CD sync vao cluster
```

Sau Lab 5, repo co them root Application theo mo hinh app-of-apps:

```text
gitops/
  argocd/
    root.yaml                 # Root Application quan ly tat ca app con trong argocd/apps/
    apps/
      web.yaml                # Child Application cho app web
  k8s/
    web.yaml
```

Sau Lab 6, folder `k8s/` duoc tach ro hon va co sync waves:

```text
gitops/
  argocd/
    root.yaml
    apps/
      web.yaml
  k8s/
    namespace.yaml            # Namespace demo, sync-wave -1
    web.yaml                  # ConfigMap wave 0, Deployment wave 1, Service wave 2
```

Sau Lab 7, repo day du se co CI workflow:

```text
gitops/
  .github/
    workflows/
      validate.yml            # GitHub Actions validate manifest bang kubeconform
  argocd/
    root.yaml
    apps/
      web.yaml
  k8s/
    namespace.yaml
    web.yaml
  plan.md                     # Huong dan chay lab bang terminal
```

Y nghia tung nhom thu muc:

- `.github/workflows/`: chua CI/CD workflow. Trong lab nay CI chi validate manifest, khong deploy.
- `argocd/root.yaml`: bootstrap root Application. Apply bang tay mot lan de root quan ly app con.
- `argocd/apps/`: chua cac Argo CD Application con. Them app moi bang cach them file YAML vao day roi push Git.
- `k8s/`: chua desired state cua app demo. Argo CD doc folder nay va sync vao namespace `demo`.
- `plan.md`: tai lieu thao tac lab. File nay khong anh huong den cluster.

## 0. Prerequisites

Can cai san:

- Docker Desktop dang chay.
- Kubernetes/minikube hoat dong duoc.
- `kubectl` co trong PATH.
- `minikube` co trong PATH.
- `git` co trong PATH.
- GitHub repo `gitops` da ton tai va local repo da push duoc.

Kiem tra nhanh:

```powershell
docker --version
kubectl version --client
minikube version
git --version
```

Di vao repo lab:

```powershell
cd D:\AWS\gitops
git status
```

Neu `k8s/web.yaml` chua duoc push:

```powershell
git add k8s/web.yaml
git commit -m "init gitops lab"
git branch -M main
git remote add origin https://github.com/MinhKhoa2209/gitops.git
git push -u origin main
```

Neu remote da co san thi chi can:

```powershell
git push
```

## Lab 0. Tao cluster local va giu app trong Git

Start minikube profile rieng cho W9:

```powershell
minikube start -p w9 --driver=docker
kubectl config use-context w9
kubectl get nodes
```

Trang thai dung:

```text
STATUS = Ready
```

O buoc nay chi can dam bao file app da nam trong Git:

```powershell
Get-Content k8s\web.yaml
git log --oneline -5
```

Khong apply file `k8s/web.yaml` bang tay. Argo CD se lam viec nay tu Lab 2.

## Lab 1. Cai Argo CD

Tao namespace:

```powershell
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
```

Cai Argo CD:

```powershell
kubectl apply --server-side -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Doi Argo CD server san sang:

```powershell
kubectl -n argocd rollout status deployment/argocd-server --timeout=240s
kubectl -n argocd get pods
```

Mo UI tuy chon:

```powershell
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Mo browser:

```text
https://localhost:8080
```

User:

```text
admin
```

Lay password ban dau tren PowerShell:

```powershell
$encoded = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}'
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encoded))
```

## Lab 2. Tao Argo CD Application dau tien

Tao thu muc chua Application:

```powershell
mkdir argocd\apps -Force
```

Tao file `argocd/apps/web.yaml`:

```powershell
@"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/MinhKhoa2209/gitops.git
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
"@ | Set-Content -Encoding utf8 argocd\apps\web.yaml
```

Commit va push Application vao Git:

```powershell
git add argocd\apps\web.yaml
git commit -m "add web argocd application"
git push
```

Apply Application bang tay mot lan dau:

```powershell
kubectl apply -f argocd\apps\web.yaml
```

Kiem tra Argo CD va app:

```powershell
kubectl -n argocd get applications
kubectl -n argocd get application web
kubectl -n demo get deploy,pod
```

Trang thai dung:

- Application `web` la `Synced` va `Healthy`.
- Namespace `demo` co Deployment `web`.
- Co 2 pod nginx dang chay.

Neu pod chua len ngay, doi vai giay roi chay lai:

```powershell
kubectl -n demo get pods -w
```

## Lab 3. Sync qua Git va self-heal

Doi replica tu 2 len 4 bang Git:

```powershell
(Get-Content k8s\web.yaml) -replace 'replicas: 2', 'replicas: 4' | Set-Content -Encoding utf8 k8s\web.yaml
git diff
git add k8s\web.yaml
git commit -m "scale web from 2 to 4"
git push
```

Doi Argo CD sync. Thuong se mat mot chut thoi gian. Kiem tra:

```powershell
kubectl -n argocd get application web
kubectl -n demo get deploy web
kubectl -n demo get pods
```

Neu muon ep Argo CD refresh nhanh:

```powershell
kubectl -n argocd annotate application web argocd.argoproj.io/refresh=hard --overwrite
```

Test self-heal bang cach co tinh scale sai bang tay:

```powershell
kubectl -n demo scale deployment/web --replicas=9
kubectl -n demo get deploy web -w
```

Ket qua dung: sau mot luc Argo CD se dua replica ve lai gia tri trong Git la `4`.

Dung watch bang `Ctrl + C`.

## Lab 4. Rollback bang Git revert

Rollback commit scale 2 -> 4:

```powershell
git revert HEAD --no-edit
git push
```

Kiem tra cluster quay ve desired state cu:

```powershell
kubectl -n argocd annotate application web argocd.argoproj.io/refresh=hard --overwrite
kubectl -n demo get deploy web
kubectl -n demo get pods
```

Ket qua dung: replica quay ve `2`.

Ghi nho:

- Rollback dung trong GitOps la `git revert`.
- Khong nen dung `kubectl rollout undo` lam rollback chinh, vi Git van la source of truth. Argo CD co the sync lai theo Git va lam mat rollback tam thoi.

## Lab 5. App-of-apps

Muc tieu: tao mot root Application quan ly cac Application con trong `argocd/apps`.

Tao file `argocd/root.yaml`:

```powershell
@"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/MinhKhoa2209/gitops.git
    targetRevision: HEAD
    path: argocd/apps
    directory:
      recurse: false
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
"@ | Set-Content -Encoding utf8 argocd\root.yaml
```

Commit va push root app:

```powershell
git add argocd\root.yaml
git commit -m "add app of apps root"
git push
```

Apply root Application bang tay mot lan:

```powershell
kubectl apply -f argocd\root.yaml
```

Kiem tra:

```powershell
kubectl -n argocd get applications
```

Ket qua dung:

```text
root
web
```

Tu luc nay, neu muon them app moi thi them file Application vao `argocd/apps/`, commit va push. Root app se dong bo cac app con.

## Lab 6. Sync waves

Muc tieu: dua Namespace, ConfigMap, Deployment, Service vao Git va ep thu tu sync.

Tao file `k8s/namespace.yaml`:

```powershell
@"
apiVersion: v1
kind: Namespace
metadata:
  name: demo
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
"@ | Set-Content -Encoding utf8 k8s\namespace.yaml
```

Thay noi dung `k8s/web.yaml` bang 3 resource co sync-wave:

```powershell
@"
apiVersion: v1
kind: ConfigMap
metadata:
  name: web-config
  namespace: demo
  annotations:
    argocd.argoproj.io/sync-wave: "0"
data:
  MESSAGE: "hello from gitops"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: demo
  annotations:
    argocd.argoproj.io/sync-wave: "1"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
          envFrom:
            - configMapRef:
                name: web-config
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: demo
  annotations:
    argocd.argoproj.io/sync-wave: "2"
spec:
  selector:
    app: web
  ports:
    - name: http
      port: 80
      targetPort: 80
"@ | Set-Content -Encoding utf8 k8s\web.yaml
```

Commit va push:

```powershell
git add k8s\namespace.yaml k8s\web.yaml
git commit -m "add sync waves for web app"
git push
```

Ep refresh neu can:

```powershell
kubectl -n argocd annotate application web argocd.argoproj.io/refresh=hard --overwrite
```

Kiem tra resource:

```powershell
kubectl -n demo get configmap,deploy,svc,pod
kubectl -n argocd get application web
```

Kiem tra app qua port-forward:

```powershell
kubectl -n demo port-forward svc/web 8080:80
```

Mo terminal khac:

```powershell
curl.exe http://127.0.0.1:8080/
```

Thu tu sync mong muon:

```text
Namespace wave -1 -> ConfigMap wave 0 -> Deployment wave 1 -> Service wave 2
```

## Lab 7. CI validate manifest tren Pull Request

Tao workflow:

```powershell
mkdir .github\workflows -Force
@"
name: validate

on:
  pull_request:
    paths:
      - "k8s/**"
  push:
    branches:
      - main
    paths:
      - "k8s/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install kubeconform
        run: |
          curl -sSLo kubeconform.tar.gz https://github.com/yannh/kubeconform/releases/download/v0.6.7/kubeconform-linux-amd64.tar.gz
          tar -xzf kubeconform.tar.gz
          sudo mv kubeconform /usr/local/bin/kubeconform

      - name: Validate Kubernetes manifests
        run: kubeconform -strict -summary k8s
"@ | Set-Content -Encoding utf8 .github\workflows\validate.yml
```

Commit va push:

```powershell
git add .github\workflows\validate.yml
git commit -m "add manifest validation workflow"
git push
```

Cau hinh branch protection tren GitHub:

1. Mo repo: `https://github.com/MinhKhoa2209/gitops`.
2. Vao `Settings` -> `Branches`.
3. Add branch protection rule cho `main`.
4. Bat:
   - Require a pull request before merging.
   - Require approvals neu muon tap quy trinh review.
   - Require status checks to pass before merging.
   - Chon job `validate` sau khi workflow da chay it nhat 1 lan.

Test CI fail bang branch rieng:

```powershell
git switch -c test-bad-manifest
(Get-Content k8s\web.yaml) -replace 'replicas: 2', 'replicas: wrong' | Set-Content -Encoding utf8 k8s\web.yaml
git add k8s\web.yaml
git commit -m "test invalid manifest"
git push -u origin test-bad-manifest
```

Tao Pull Request tren GitHub tu branch `test-bad-manifest` vao `main`.

Ket qua mong muon:

- GitHub Actions job `validate` fail.
- Branch protection chan merge neu da cau hinh status check.

Sau khi test xong, quay ve `main`:

```powershell
git switch main
git branch -D test-bad-manifest
```

Co the xoa remote branch test neu khong can nua:

```powershell
git push origin --delete test-bad-manifest
```

## Cac lenh kiem tra nhanh

Kiem tra context:

```powershell
kubectl config current-context
```

Kiem tra Argo CD:

```powershell
kubectl -n argocd get pods
kubectl -n argocd get applications
kubectl -n argocd get application web
```

Kiem tra app:

```powershell
kubectl -n demo get all
kubectl -n demo get configmap
kubectl -n demo get svc web
```

Kiem tra Git:

```powershell
git status
git log --oneline --decorate -10
git remote -v
```

## Troubleshooting

Neu Argo CD chua sync:

```powershell
kubectl -n argocd annotate application web argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd get application web -o yaml
```

Neu pod khong chay:

```powershell
kubectl -n demo get pods
kubectl -n demo describe pod <pod-name>
kubectl -n demo logs <pod-name>
```

Neu namespace `demo` chua co:

```powershell
kubectl get ns demo
kubectl -n argocd get application web
```

Neu Git push fail:

```powershell
git remote -v
git status
git pull --rebase origin main
git push
```

Neu minikube loi:

```powershell
minikube status -p w9
minikube logs -p w9
```

## Cleanup khi hoan thanh lab

Chi chay neu muon xoa moi thu trong cluster lab:

```powershell
kubectl delete -f argocd\root.yaml --ignore-not-found
kubectl delete -f argocd\apps\web.yaml --ignore-not-found
kubectl delete namespace demo --ignore-not-found
kubectl delete namespace argocd --ignore-not-found
minikube delete -p w9
```

## Checklist hoan thanh

- [ ] Repo `gitops` da push len GitHub.
- [ ] Minikube profile `w9` dang chay.
- [ ] Argo CD da cai trong namespace `argocd`.
- [ ] Application `web` Synced/Healthy.
- [ ] Deployment `web` chay trong namespace `demo`.
- [ ] Thay doi replica qua Git duoc Argo CD sync.
- [ ] Scale sai bang tay bi Argo CD self-heal.
- [ ] Rollback dung `git revert`.
- [ ] Root app quan ly app con theo app-of-apps.
- [ ] Sync waves duoc them vao Namespace/ConfigMap/Deployment/Service.
- [ ] GitHub Actions validate manifest da duoc them.
- [ ] Branch protection chan merge khi CI fail.
