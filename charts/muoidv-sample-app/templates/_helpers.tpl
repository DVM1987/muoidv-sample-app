{{/*
Chart name (truncated to 63 chars for DNS-1123)
*/}}
{{- define "muoidv-sample-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified app name = release name + chart name
*/}}
{{- define "muoidv-sample-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Chart label = chart name + version (slug for label value)
*/}}
{{- define "muoidv-sample-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Common labels — apply to all resources
*/}}
{{- define "muoidv-sample-app.labels" -}}
helm.sh/chart: {{ include "muoidv-sample-app.chart" . }}
{{ include "muoidv-sample-app.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels — minimal, immutable (used in Deployment.spec.selector + Service.spec.selector)
*/}}
{{- define "muoidv-sample-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "muoidv-sample-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
