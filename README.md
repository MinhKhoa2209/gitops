# W9 GitOps Observability Canary Lab

- Every change goes through Git and Argo CD sync.
- The API is deployed with Argo Rollouts.
- Prometheus scrapes API metrics and evaluates the success-rate SLO.
- `ApiHighErrorRate` fires and sends an email notification.
- A bad canary automatically aborts back to the previous version.
- Rollback is completed with `git revert` in less than 5 minutes.

## Added Files

```text
app/
  Dockerfile
  app.py
argocd/apps/
  api.yaml
  argo-rollouts.yaml
  kube-prometheus-stack.yaml
k8s-api/
  api.yaml
  analysis-template.yaml
  prometheusrule.yaml
  servicemonitor.yaml
evidence/
  *.png
```

## File Purpose

- `app/app.py`: Flask API with `/`, `/healthz`, `/metrics`, `ERROR_RATE`, and `VERSION`.
- `argocd/apps/argo-rollouts.yaml`: installs Argo Rollouts through GitOps.
- `argocd/apps/kube-prometheus-stack.yaml`: installs Prometheus, Grafana, Alertmanager, and the email receiver.
- `argocd/apps/api.yaml`: syncs the `k8s-api/` folder through Argo CD.
- `k8s-api/api.yaml`: API `Rollout` and Service.
- `k8s-api/servicemonitor.yaml`: Prometheus scrape config for API `/metrics`.
- `k8s-api/prometheusrule.yaml`: SLO alert rule `ApiHighErrorRate`.
- `k8s-api/analysis-template.yaml`: canary success-rate analysis.

## Build API Image

```powershell
docker build -t w9-api:1 app
minikube image load w9-api:1 -p w9
```

## Configure Alertmanager Email Secret

The email app password is not stored in Git. Create it as a Kubernetes Secret in the `monitoring` namespace before syncing or restarting Alertmanager:

```powershell
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl -n monitoring create secret generic alertmanager-smtp-auth --from-literal=smtp-auth-password="<gmail-app-password>" --dry-run=client -o yaml | kubectl apply -f -
```

`argocd/apps/kube-prometheus-stack.yaml` mounts that secret into Alertmanager and reads it through:

```text
/etc/alertmanager/secrets/alertmanager-smtp-auth/smtp-auth-password
```

## Check Current Lab State

```powershell
kubectl -n argocd get applications
kubectl -n demo get rollout,analysisrun,pod,svc,servicemonitor,prometheusrule
kubectl -n monitoring get alertmanager,prometheus,pod
```

Expected state:

```text
api / argo-rollouts / kube-prometheus-stack / root / web = Synced, Healthy
rollout api = 4/4 available
Alertmanager = READY 1, RECONCILED True, AVAILABLE True
```

## SLO Query

The SLO is API success rate >= 95%.

`k8s-api/analysis-template.yaml` uses:

```promql
sum(rate(flask_http_request_total{namespace="demo",status!~"5.."}[2m]))
/
clamp_min(sum(rate(flask_http_request_total{namespace="demo"}[2m])), 1)
```

Pass condition:

```text
result[0] >= 0.95
```

If enough measurements fall below `0.95`, the AnalysisRun fails and Argo Rollouts aborts the canary.

## Alert Query

`k8s-api/prometheusrule.yaml` defines `ApiHighErrorRate`:

```promql
1 - (
  sum(rate(flask_http_request_total{namespace="demo",status!~"5.."}[5m]))
  /
  clamp_min(sum(rate(flask_http_request_total{namespace="demo"}[5m])), 1)
) > 0.05
```

Meaning:

- Error rate is greater than 5%.
- The condition must hold for `2m`.
- Alertmanager sends the notification to the configured personal email receiver.

## Evidence

```text
01-argocd-all-apps-synced-healthy.png
  Argo CD apps are Synced and Healthy.

02-alertmanager-ready.png
  Alertmanager is ready and reconciled.

03-prometheus-api-target-up.png
  Prometheus target serviceMonitor/demo/api/0 is UP.

04-prometheus-success-rate-100.png
  Success-rate query returns 1.

05-prometheus-alert-firing.png
  ApiHighErrorRate is FIRING.

06-email-api-high-error-rate-received.png
  The personal email inbox received the alert.

07-git-revert-rollback-under-5min.png
  Rollback with git revert completed in less than 5 minutes.

08-argocd-analysisrun-failed.png
  Argo CD shows the failed AnalysisRun.

09-analysisrun-success-rate-failed-cli.png
  The AnalysisRun success-rate metric failed below 0.95.

10-rollout-aborted-stable-rs-cli.png
  RolloutAborted; the stable ReplicaSet scaled back up and the bad ReplicaSet scaled down.
```

## Reproduce Bad Canary

Change `k8s-api/api.yaml`:

```yaml
- name: ERROR_RATE
  value: "1"
- name: VERSION
  value: "v2-broken"
```

Commit and sync:

```powershell
git add k8s-api/api.yaml
git commit -m "release broken api canary"
git push
kubectl -n argocd annotate application api argocd.argoproj.io/refresh=hard --overwrite
```

Watch and capture:

```powershell
kubectl -n demo get analysisrun -w
kubectl -n demo describe analysisrun
kubectl -n demo describe rollout api
```

Expected evidence:

```text
AnalysisRun Failed
Metric "success-rate" assessed Failed
RolloutAborted
Stable ReplicaSet scaled up
Bad ReplicaSet scaled down to 0
```

## Reproduce Alert Email

Temporarily inject API errors through Git or by patching the API to keep `ERROR_RATE="1"` long enough for the `5m` query and `for: 2m` alert window.

Generate traffic:

```powershell
kubectl -n demo delete pod load --ignore-not-found
kubectl -n demo run load --image=busybox --restart=Never -- sh -c "while true; do wget -qO- http://api:8080/ >/dev/null; sleep 0.2; done"
```

Open:

```text
http://localhost:9090/alerts
http://localhost:9093/#/alerts
```

After capturing the alert and email evidence, revert the fault change.

## Rollback

```powershell
$start = Get-Date
git revert HEAD --no-edit
git push
kubectl -n argocd annotate application api argocd.argoproj.io/refresh=hard --overwrite
kubectl -n argocd get app api
kubectl -n demo get rollout api
"Elapsed: $((Get-Date) - $start)"
```

Pass condition:

```text
Elapsed < 5 minutes
api Synced Healthy
rollout api 4/4 available
```
