/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then((clients) => {
                    clients.forEach((client) => client.navigate(client.url));
                });
        }
    });

    self.addEventListener("fetch", function (event) {
        if (
            event.request.cache === "only-if-cached" &&
            event.request.mode !== "same-origin"
        ) {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy",
                        coepCredentialless ? "credentialless" : "require-corp"
                    );
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error(e))
        );
    });

} else {
    (() => {
        // You can customize the behavior of this script through a global `cpiConfig` variable.
        const cpiConfig = typeof window.cpiConfig !== 'undefined' ? window.cpiConfig : {};

        const ORIGIN_TRIAL_TOKEN = cpiConfig.originTrialToken || '';

        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coepDegrading = (reloadedBySelf === "coepdegrade");

        // You can customize the path when registering the service worker.
        const swPath = cpiConfig.swPath || "coi-serviceworker.js";

        const isSecureContext = window.isSecureContext;

        if (!isSecureContext) {
            if (!window.location.href.startsWith("http://localhost")) {
                console.log("COOP/COEP Service Worker: Not a secure context. Skipping registration.");
                return;
            }
        }

        // In some environments (e.g. Firefox private mode) service workers are not available.
        if (!window.navigator.serviceWorker) {
            console.log("COOP/COEP Service Worker: Service workers are not available.");
            return;
        }

        if (window.crossOriginIsolated !== false) {
            // Already cross-origin isolated
            return;
        }

        window.navigator.serviceWorker
            .register(swPath)
            .then(
                (registration) => {
                    if (registration.active && !navigator.serviceWorker.controller) {
                        window.sessionStorage.setItem("coiReloadedBySelf", "true");
                        window.location.reload();
                    } else if (registration.installing) {
                        registration.installing.addEventListener("statechange", function () {
                            if (this.state === "activated") {
                                window.sessionStorage.setItem("coiReloadedBySelf", "true");
                                window.location.reload();
                            }
                        });
                    }
                },
                (err) => {
                    console.error("COOP/COEP Service Worker failed to register:", err);
                }
            );

        if (ORIGIN_TRIAL_TOKEN && !coepDegrading) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'origin-trial';
            meta.content = ORIGIN_TRIAL_TOKEN;
            document.head.appendChild(meta);
        }
    })();
}
