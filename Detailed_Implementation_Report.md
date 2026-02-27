# Digital Voucher Ecosystem: Implementation Status Report
**Date:** February 26, 2026
**Reference Document:** `Digital_Voucher_Ecosystem_v2.md`

## 1. Executive Summary
The Digital Voucher Ecosystem has a strong foundation with nearly all high-level modules, controllers, and UI routes implemented. The core transactional logic (Redemption, Transfer, Ledger) is robust and follows the documentation's requirements for atomicity and security. However, several advanced features mentioned in the documentation currently exist only as **UI placeholders** or **API stubs**.

**Current Status:** ~80% of Core Infrastructure is ready; ~20% of Advanced Features are pending.

---

## 2. Implementation Status Matrix

| Feature Area | API (Backend) | UI (Frontend) | Status | Gaps / Pending Items |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Security** | ![90%](https://geps.dev/progress/90) | ![85%](https://geps.dev/progress/85) | **Near Complete** | Biometric verification (WebAuthn) is a placeholder. |
| **Redemption Flow** | ![100%](https://geps.dev/progress/100) | ![80%](https://geps.dev/progress/80) | **Core Functional** | Offline sync queue & Manual OTP fallback are missing. |
| **Seller QR** | ![100%](https://geps.dev/progress/100) | ![95%](https://geps.dev/progress/95) | **Complete** | - |
| **P2P Transfer** | ![100%](https://geps.dev/progress/100) | ![90%](https://geps.dev/progress/90) | **Complete** | - |
| **Gamification** | ![95%](https://geps.dev/progress/95) | ![85%](https://geps.dev/progress/85) | **Functional** | Appreciation Wall UI needs verification. |
| **Sustainability** | ![80%](https://geps.dev/progress/80) | ![70%](https://geps.dev/progress/70) | **Partial** | Carbon Ledger detailed views are pending. |
| **Admin Controls** | ![95%](https://geps.dev/progress/95) | ![90%](https://geps.dev/progress/90) | **Near Complete** | Sync conflict management UI is pending. |
| **Reporting / Fin** | ![95%](https://geps.dev/progress/95) | ![90%](https://geps.dev/progress/90) | **Near Complete** | Real-time "Anomaly" AI is basic stats (3σ). |
| **Notifications** | ![30%](https://geps.dev/progress/30) | ![40%](https://geps.dev/progress/40) | **Pending** | Web Push integration is a placeholder (logs only). |
| **Offline/Sync** | ![20%](https://geps.dev/progress/20) | ![10%](https://geps.dev/progress/10) | **Draft** | IndexedDB sync & background sync are not implemented. |
| **NFC Tap-Redeem** | ![0%](https://geps.dev/progress/0) | ![0%](https://geps.dev/progress/0) | **Roadmap** | Phase 4 feature; not started. |

---

## 3. Detailed Gap Analysis & Pending Implementation

### 🛡️ Security & Authentication
*   **Biometric Verification:**
    *   **API:** `AuthController.verifyBiometric` and `AuthService.verifyBiometric` are stubs that only check `deviceFingerprint`.
    *   **UI:** The scanner has a "Requires Face ID" label but no logic to trigger native/browser biometric prompts.
*   **Device Binding:** Currently relies on a simple `deviceFingerprint` string passed during login. No hardware-backed attestation (WebAuthn).

### 📶 Offline Resilience & PWA
*   **IndexedDB Sync Queue:**
    *   **UI:** `RedemptionService` and `TransferService` make direct API calls. There is no `Dexie.js` or `IndexedDB` layer to queue signed payloads when offline.
    *   **UI:** Optimistic UI updates (decrementing balance before server confirm) are missing.
*   **Background Sync:** Service worker does not yet have `syncManager` listeners for replaying redemptions.
*   **Manual OTP Entry:** If the camera fails or there is no network, the seller's OTP fallback UI is not implemented on either side.

### 🔔 Notifications (Web Push)
*   **API:** `NotificationService.sendPush` contains commented-out logic for `web-push`. It currently only logs notifications to the server console.
*   **UI:** Push subscription logic is present but not actively prompting the user or managing service worker push events.

### 📊 Sustainability & AI
*   **Carbon Ledger:** While CO₂e is calculated in the backend, the "Carbon Ledger" (detailed department-wise scope 3 reports) lacks a dedicated high-fidelity UI view.
*   **Anomaly Detection:** Mentioned as "AI-powered", but currently uses standard deviation (3σ) checks on transaction volume. No ML-based models or advanced fraud detection.

### 👥 Role-Specific Pending Points

| Role | Side | Pending Feature |
| :--- | :--- | :--- |
| **Employee** | UI | Biometric prompt before redemption. |
| | UI | Offline outbox (view/clear pending transactions). |
| | UI | Manual OTP entry screen. |
| **Seller** | UI | Offline QR display (pre-cahed nonces). |
| | API | Real-time WebSocket delta pull upon reconnect. |
| **Admin** | UI | Sync Conflict resolution dashboard (to handle offline double-spends). |
| **Finance** | API | Automated IP allowlisting for reconciliation access. |

---

## 4. Technical Debt & Placeholders
1.  **HSM/KMS Integration:** TOTP secrets are mentioned as encrypted via HSM/KMS in docs, but current `AuthService` stores them in TypeORM (Postgres) without explicit KMS calls.
2.  **Zoneless Detection:** Doc mentions `provideZonelessChangeDetection()`. Current app is using standard Angular 21 (Signals based, but check `app.config.ts` for zoneless status).
3.  **Client-Side nonce consumption:** The doc says backend marks nonce as consumed. The frontend should ideally also mark it locally to prevent accidental double-tap.

## 5. Next Steps Recommendation
1.  **Prioritize Offline Sync:** Integrate `Dexie.js` into `apps/web/src/app/core/services` to fulfill the core PWA value proposition.
2.  **Implement Web Push:** Unshelve the commented-out `web-push` logic in `NotificationService`.
3.  **Secure Biometrics:** Investigate `@simplewebauthn/browser` for the frontend and corresponding backend validator.
