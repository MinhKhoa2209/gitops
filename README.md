# W9 GitOps Observability Canary Lab

Repo nay chung minh pipeline an toan cho API theo de bai `W9-chieu-obs-canary.html`:

- Moi thay doi di qua Git va Argo CD sync.
- API duoc deploy bang Argo Rollouts `Rollout`.
- Prometheus scrape metric API va tinh SLO success rate.
- Alert `ApiHighErrorRate` fire va gui ve email ca nhan.
- Canary ban loi tu abort ve ban cu.
- Rollback bang `git revert` duoi 5 phut.

## Files Added

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

## What Each File Proves

- `app/app.py`: Flask API co `/`, `/healthz`, `/metrics`, `ERROR_RATE`, `VERSION`.
- `argocd/apps/argo-rollouts.yaml`: cai Argo Rollouts qua GitOps.
- `argocd/apps/kube-prometheus-stack.yaml`: cai Prometheus/Grafana/Alertmanager va cau hinh email receiver.
- `argocd/apps/api.yaml`: Argo CD Application sync folder `k8s-api/`.
- `k8s-api/api.yaml`: API `Rollout` + Service, canary chay qua `AnalysisTemplate`.
- `k8s-api/servicemonitor.yaml`: Prometheus scrape `/metrics` cua API.
- `k8s-api/prometheusrule.yaml`: SLO alert `ApiHighErrorRate`.
- `k8s-api/analysis-template.yaml`: rule tu cham canary bang success rate.

## Build Image

```powershell
docker build -t w9-api:1 app
minikube image load w9-api:1 -p w9
```

## Check Lab State

```powershell
kubectl -n argocd get applications
kubectl -n demo get rollout,analysisrun,pod,svc,servicemonitor,prometheusrule
kubectl -n monitoring get alertmanager,prometheus,pod
```

Expected:

```text
api / argo-rollouts / kube-prometheus-stack / root / web = Synced, Healthy
rollout api = 4/4 available
Alertmanager = READY 1, RECONCILED True, AVAILABLE True
```

## SLO Query

SLO: API success rate >= 95%.

Used by `k8s-api/analysis-template.yaml`:

```promql
sum(rate(flask_http_request_total{namespace="demo",status!~"5.."}[2m]))
/
clamp_min(sum(rate(flask_http_request_total{namespace="demo"}[2m])), 1)
```

Canary passes when:

```text
result[0] >= 0.95
```

Canary fails and aborts when success rate drops below `0.95` in enough measurements.

## Alert Query

Used by `k8s-api/prometheusrule.yaml`:

```promql
1 - (
  sum(rate(flask_http_request_total{namespace="demo",status!~"5.."}[5m]))
  /
  clamp_min(sum(rate(flask_http_request_total{namespace="demo"}[5m])), 1)
) > 0.05
```

Meaning:

- Error rate > 5%.
- Must stay bad for `2m`.
- Alert name: `ApiHighErrorRate`.
- Receiver: personal email from Alertmanager config.

## Evidence Mapping

```text
01-argocd-all-apps-synced-healthy.png
  Argo CD apps Synced/Healthy.

02-alertmanager-ready.png
  Alertmanager ready and reconciled.

03-prometheus-api-target-up.png
  Prometheus target serviceMonitor/demo/api/0 is UP.

04-prometheus-success-rate-100.png
  Success-rate query returns 1.

05-prometheus-alert-firing.png
  ApiHighErrorRate is FIRING.

06-email-api-high-error-rate-received.png
  Personal email received alert.

07-git-revert-rollback-under-5min.png
  Rollback by git revert completed under 5 minutes.

08-argocd-analysisrun-failed.png
  Argo CD shows failed AnalysisRun.

09-analysisrun-success-rate-failed-cli.png
  AnalysisRun metric success-rate failed below 0.95.

10-rollout-aborted-stable-rs-cli.png
  RolloutAborted; stable ReplicaSet scaled back up, bad ReplicaSet scaled down.
```

## Reproduce Bad Canary

Change `k8s-api/api.yaml`:

```yaml
- name: ERROR_RATE
  value: "1"
- name: VERSION
  value: "v2-broken"
```

Then:

```powershell
git add k8s-api/api.yaml
git commit -m "release broken api canary"
git push
kubectl -n argocd annotate application api argocd.argoproj.io/refresh=hard --overwrite
```

Watch:

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
Stable RS scaled up
Bad RS scaled down to 0
```

## Reproduce Alert Email

Temporarily create a fault injector through Git or patch the API to keep `ERROR_RATE="1"` long enough for the `5m` query plus `for: 2m` window. Generate traffic:

```powershell
kubectl -n demo delete pod load --ignore-not-found
kubectl -n demo run load --image=busybox --restart=Never -- sh -c "while true; do wget -qO- http://api:8080/ >/dev/null; sleep 0.2; done"
```

Open:

```text
http://localhost:9090/alerts
http://localhost:9093/#/alerts
```

After taking evidence, revert the fault commit.

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

