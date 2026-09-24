# mermify

A Helm chart for [Mermify](https://github.com/tra-sco/mermify), a visual text-to-diagram
hybrid editor for Mermaid.js flowcharts and sequence diagrams.

## Install

```bash
helm install mermify oci://ghcr.io/tra-sco/charts/mermify --version <x.y.z>
```

## Uninstall

```bash
helm uninstall mermify
```

## Exposing Mermify

The Ingress API is no longer under active development upstream, so this chart's primary
mechanism for external access is a Gateway API `HTTPRoute`:

```yaml
httpRoute:
  enabled: true
  parentRefs:
    - name: my-gateway
      namespace: gateway-system
  hostnames:
    - mermify.example.com
```

This requires the Gateway API CRDs and a Gateway API implementation (e.g. envoy-gateway,
Cilium, Istio) already running in the cluster, plus a `Gateway` resource for `parentRefs` to
attach to. If your cluster only has a classic ingress controller, set `ingress.enabled: true`
instead — see the values table below.

## Values

| Key | Default | Description |
|---|---|---|
| `replicaCount` | `1` | Pod replicas (ignored when `autoscaling.enabled`) |
| `image.repository` | `ghcr.io/tra-sco/mermify` | Container image |
| `image.tag` | `""` | Defaults to `.Chart.AppVersion` |
| `image.digest` | `""` | Pin by digest instead of tag |
| `image.pullPolicy` | `IfNotPresent` | |
| `serviceAccount.create` | `true` | |
| `serviceAccount.automount` | `false` | Mermify never calls the Kubernetes API |
| `podSecurityContext` / `securityContext` | non-root uid/gid 101, read-only rootfs | |
| `resources` | `200m`/`128Mi` limits, `10m`/`32Mi` requests | |
| `service.type` | `ClusterIP` | |
| `service.port` | `80` | |
| `service.targetPort` | `8080` | |
| `httpRoute.enabled` | `false` | Gateway API `HTTPRoute` — the recommended way to expose Mermify. Requires the Gateway API CRDs and a `Gateway` resource; see `httpRoute.parentRefs` |
| `ingress.enabled` | `false` | Legacy `networking.k8s.io/v1` Ingress, for clusters without Gateway API support |
| `autoscaling.enabled` | `false` | HPA via `autoscaling/v2` |
| `podDisruptionBudget.enabled` | `false` | |
| `nginx.config` | see `values.yaml` | The full nginx server block, mounted at `/etc/nginx/conf.d/default.conf`. Override to change the Content-Security-Policy without rebuilding the image. |
| `nginx.existingConfigMap` | `""` | Use a pre-existing ConfigMap instead of `nginx.config` |
| `nodeSelector` / `tolerations` / `affinity` / `topologySpreadConstraints` / `priorityClassName` | | Scheduling |
| `extraEnv` / `extraVolumes` / `extraVolumeMounts` / `extraContainerPorts` / `extraObjects` | `[]` | Escape hatches |
| `manifestHash` | `""` | Legacy: rendered into `podAnnotations` to force a rollout. Prefer `podAnnotations` directly. |

See `values.yaml` for the full set of options and `values.schema.json` for validation.

## Renaming note

`replicas` was renamed to `replicaCount` (the Helm convention) as part of generalizing this
chart. If you previously set `replicas`, rename it to `replicaCount`.
