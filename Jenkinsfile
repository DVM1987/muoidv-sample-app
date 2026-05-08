pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-build-agent
spec:
  serviceAccountName: jenkins
  containers:
    - name: docker
      image: docker:24.0-dind
      command: ["dockerd-entrypoint.sh"]
      args: ["--host=tcp://0.0.0.0:2375", "--host=unix:///var/run/docker.sock"]
      env:
        - name: DOCKER_TLS_CERTDIR
          value: ""
      securityContext:
        privileged: true
      tty: true
    - name: tools
      image: alpine/k8s:1.34.7
      command: ["sleep"]
      args: ["infinity"]
      tty: true
'''
    }
  }

  options {
    timeout(time: 15, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
  }

  environment {
    AWS_REGION    = 'ap-southeast-1'
    AWS_ACCOUNT   = '527055790396'
    ECR_REGISTRY  = "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    ECR_REPO      = 'muoidv-sample-app'
    K8S_NAMESPACE = 'muoidv-data'
    HELM_RELEASE  = 'muoidv-sample-app'
    APP_URL       = 'app.muoidv.do2602.click'
    IMAGE_TAG     = "sha-${GIT_COMMIT.take(7)}"
  }

  stages {
    stage('Checkout info') {
      steps {
        container('tools') {
          sh '''
            echo "==== Build context ===="
            echo "Branch:      ${BRANCH_NAME}"
            echo "Commit:      ${GIT_COMMIT}"
            echo "Image tag:   ${IMAGE_TAG}"
            echo "Target:      ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
            echo "======================="
          '''
        }
      }
    }

    stage('Build image') {
      steps {
        container('docker') {
          sh '''
            cd app
            docker build \
              --platform linux/amd64 \
              -t ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG} \
              .
            docker images ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Push to ECR') {
      steps {
        container('tools') {
          sh '''
            aws ecr get-login-password --region ${AWS_REGION} \
              > /home/jenkins/agent/ecr-password.txt
            chmod 600 /home/jenkins/agent/ecr-password.txt
          '''
        }
        container('docker') {
          sh '''
            cat /home/jenkins/agent/ecr-password.txt \
              | docker login --username AWS --password-stdin ${ECR_REGISTRY}
            docker push ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
            rm -f /home/jenkins/agent/ecr-password.txt
          '''
        }
      }
    }

    stage('Helm upgrade') {
      steps {
        container('tools') {
          sh '''
            helm upgrade --install ${HELM_RELEASE} ./charts/muoidv-sample-app \
              --namespace ${K8S_NAMESPACE} \
              --set image.repository=${ECR_REGISTRY}/${ECR_REPO} \
              --set image.tag=${IMAGE_TAG} \
              --wait \
              --timeout 5m
            helm history ${HELM_RELEASE} -n ${K8S_NAMESPACE} --max 5
          '''
        }
      }
    }

    stage('Rollout verify') {
      steps {
        container('tools') {
          sh '''
            kubectl rollout status deployment/${HELM_RELEASE} \
              -n ${K8S_NAMESPACE} --timeout=2m
            kubectl get pods -n ${K8S_NAMESPACE} \
              -l app.kubernetes.io/instance=${HELM_RELEASE} \
              -o wide
          '''
        }
      }
    }

    stage('Smoke test') {
      steps {
        container('tools') {
          sh '''
            for i in 1 2 3 4 5 6; do
              code=$(curl -sk -o /tmp/body -w "%{http_code}" https://${APP_URL}/healthz || true)
              body=$(cat /tmp/body 2>/dev/null || echo "")
              echo "Attempt $i: HTTP $code body=$body"
              if [ "$code" = "200" ] && echo "$body" | grep -q '"status":"ok"'; then
                echo "Smoke test PASS"
                exit 0
              fi
              sleep 5
            done
            echo "Smoke test FAILED after 6 attempts"
            exit 1
          '''
        }
      }
    }
  }

  post {
    success {
      echo "Build #${BUILD_NUMBER} OK — image ${IMAGE_TAG} live at https://${APP_URL}"
    }
    failure {
      echo "Build #${BUILD_NUMBER} FAILED at stage ${env.STAGE_NAME ?: 'unknown'}"
    }
    always {
      echo "Cleanup: pod build agent will be deleted by Jenkins (retention=Never)"
    }
  }
}
