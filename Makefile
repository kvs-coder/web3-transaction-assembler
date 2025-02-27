SKAFFOLD_WEB3SERVICE_REPO=web3service:5050

build:
	skaffold build

check_context:
	@if [ "$$(docker context show)" != "web3service" ]; then \
		echo "Switching Docker context to 'web3service'"; \
		docker context use web3service; \
	fi
	@if [ "$$(kubectx --current)" != "k3d-web3service" ]; then \
		echo "Switching Kubernetes context to 'k3d-web3service'"; \
		kubectx k3d-web3service; \
	fi

skaffold_run:
	skaffold run --profile=web3service --default-repo=${SKAFFOLD_WEB3SERVICE_REPO}

skaffold_clean:
	skaffold delete --profile=web3service --default-repo=${SKAFFOLD_WEB3SERVICE_REPO}

run: check_context skaffold_run

clean: check_context skaffold_clean