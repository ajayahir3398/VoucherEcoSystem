+-----------------------------------------------------------------------+
| **☕ DIGITAL VOUCHER ECOSYSTEM**                                      |
|                                                                       |
| Technical Architecture & Feature Enhancement Documentation            |
+-----------------------------------------------------------------------+
| **Version 2.0 · Angular PWA · Node.js / NestJS · PostgreSQL ·         |
| February 2026**                                                       |
+-----------------------------------------------------------------------+
| **KEY CHANGE IN THIS VERSION**                                        |
|                                                                       |
| **🔄 Employee Scans Seller QR Code for Coupon Redemption & Transfer** |
|                                                                       |
| Reversed scan flow --- employees initiate by scanning the seller\'s   |
| static QR, improving security, UX, and vendor hardware requirements.  |
+-----------------------------------------------------------------------+

**1. Executive Summary**

The Digital Voucher Ecosystem transforms traditional paper-based tea and
coffee coupon management into a high-integrity, closed-loop digital
economy. Built on Angular PWA, Node.js/NestJS, and PostgreSQL, the
platform serves Employees, Sellers, and Administrators through
role-specific interfaces underpinned by ledger-grade financial
integrity.

Version 2.0 introduces a critical architectural change: the coupon
redemption and P2P transfer flow is reversed so that Employees scan the
Seller\'s QR code rather than the Seller scanning the Employee\'s QR
code. This shift simplifies seller-side hardware requirements,
consolidates fraud prevention on the employee-side device, and enables a
more intuitive point-of-sale experience.

  -----------------------------------------------------------------------
  **What\'s New in Version 2.0**

  ✅ FLOW CHANGE: Employee scans Seller QR → no camera hardware required
  at POS terminal

  ✅ FEATURE: Seller displays a static, role-scoped QR code (refreshes
  every 10 minutes for security)

  ✅ FEATURE: Employee app verifies seller identity + submits signed
  redemption request to backend

  ✅ FEATURE: Real-time push confirmation delivered to both employee and
  seller simultaneously

  ✅ FEATURE: Enhanced P2P transfer --- employee scans colleague\'s QR
  code to gift coupons

  ✅ FEATURE: Carbon footprint tracker with gamified Eco-Points
  incentives

  ✅ FEATURE: NFC Tap-to-Redeem (progressive enhancement for supported
  devices)

  ✅ FEATURE: AI-powered anomaly detection for fraud and inventory
  management
  -----------------------------------------------------------------------

**2. Stakeholder Personas & Permission Matrix**

The system implements strict Role-Based Access Control (RBAC). Each
persona has distinct capabilities, ensuring segregation of duties and a
clean audit trail.

  ---------------------------------------------------------------------------
  **Persona**     **Primary              **Performance     **Security
                  Functionalities**      SLA**             Controls**
  --------------- ---------------------- ----------------- ------------------
  Employee        Balance wallet, scan   Wallet load \<    JWT + device
                  Seller QR to           1s, QR            binding, biometric
                  redeem/transfer, P2P   scan-to-confirm   confirmation,
                  coupon gifting,        \< 2s, real-time  encrypted local
                  transaction history,   balance push.     storage, TOTP
                  carbon ledger,                           nonce.
                  gamification                             
                  dashboard.                               

  Seller          Display static seller  QR render \<      Role-scoped JWT,
                  QR code, view          500ms,            QR refresh every
                  real-time transaction  transaction       10 min, unique
                  feed, daily sales      notification \<   vendor UUID, TOTP
                  summary, offline       1s after employee seller token.
                  transaction queue,     confirm.          
                  manual OTP entry                         
                  fallback.                                

  Administrator   Bulk coupon issuance   Bulk issuance \<  MFA (TOTP + email
                  via CSV, user & vendor 5s per 1000       OTP), append-only
                  management, system     records,          audit trail, IP
                  configuration, audit   analytical        allowlisting.
                  log explorer,          queries \< 3s.    
                  reconciliation                           
                  dashboard.                               

  Finance / Audit Automated EOD          Ledger query \<   Row-level
                  reconciliation,        2s, EOD           security, ledger
                  anomaly detection      reconciliation    immutability, role
                  reports, tax           completes in \<   isolation,
                  compliance export,     30s.              read-only replica
                  historical ledger                        access.
                  queries, burn-rate                       
                  analytics.                               
  ---------------------------------------------------------------------------

**3. Revised Redemption Flow: Employee Scans Seller QR**

The most significant architectural change in Version 2.0 is the
inversion of the QR scanning responsibility. Previously, the Seller\'s
device scanned the Employee\'s dynamic QR code. In the new flow, the
Employee\'s device scans the Seller\'s QR code. This design decision
delivers meaningful improvements across security, UX, and operational
cost.

**3.1 Why the Flow Was Reversed**

  ----------------------------------------------------------------------------
  **Consideration**   **Old Flow (Seller Scans    **New Flow (Employee Scans
                      Employee QR)**              Seller QR)**
  ------------------- --------------------------- ----------------------------
  Camera Requirement  Seller POS device requires  Employee smartphone camera
                      a camera.                   used --- Seller needs only a
                                                  screen.

  Security Surface    Screenshot fraud risk on    Employee authenticates the
                      employee device; TOTP       seller identity; replay
                      mitigated this but added    attacks prevented via
                      complexity.                 server-side nonce.

  Offline Handling    Seller needed camera +      Employee app queues signed
                      offline queue + sync for    redemption requests; Seller
                      each scan.                  QR is static (offline-safe).

  Hardware Cost       POS terminals needed        Basic display (tablet,
                      camera-capable hardware.    screen, printed QR) is
                                                  sufficient for seller.

  Audit Trail         Redemption event initiated  Redemption event initiated
                      by seller device.           by employee device with
                                                  biometric confirmation ---
                                                  stronger non-repudiation.
  ----------------------------------------------------------------------------

**3.2 Step-by-Step Redemption Flow**

+----+-----------------------------------------------------------------+
| *  | **Seller Displays QR Code**                                     |
| *1 |                                                                 |
| ** | The Seller opens their PWA dashboard and displays their unique, |
|    | role-scoped Seller QR. The QR encodes the Seller\'s UUID, a     |
|    | server-issued nonce (refreshed every 10 minutes), and a         |
|    | timestamp. It requires no camera or scanning hardware on the    |
|    | seller side.                                                    |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Employee Opens Wallet & Selects Coupon**                      |
| *2 |                                                                 |
| ** | The Employee taps \'Redeem Coupon\' in their wallet app,        |
|    | selects the coupon type (Tea / Coffee / Snack) and quantity,    |
|    | then taps \'Scan Seller QR\'.                                   |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Employee Scans Seller QR**                                    |
| *3 |                                                                 |
| ** | Using the integrated camera scanner (ngx-scanner on Android,    |
|    | zxing-js on iOS), the Employee scans the Seller\'s displayed QR |
|    | code. The app decodes the Seller UUID and nonce.                |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Biometric Confirmation**                                      |
| *4 |                                                                 |
| ** | Before transmitting, the Employee app requests a biometric      |
|    | check (FaceID / Fingerprint / PIN fallback). This step binds    |
|    | the transaction to the authenticated employee and provides      |
|    | non-repudiation.                                                |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Signed Redemption Request Sent to Backend**                   |
| *5 |                                                                 |
| ** | The Employee app constructs a signed payload: { employeeId,     |
|    | sellerUUID, nonce, couponTypeId, quantity, timestamp,           |
|    | deviceSignature } and sends it to POST /api/v1/redemptions. An  |
|    | idempotency key (client UUID) is included to prevent duplicate  |
|    | submissions.                                                    |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Backend Validates & Processes**                               |
| *6 |                                                                 |
| ** | The NestJS backend: (a) validates the seller nonce has not      |
|    | expired, (b) verifies the employee has sufficient balance via   |
|    | SELECT \... FOR UPDATE, (c) deducts balance and inserts ledger  |
|    | entries atomically in a PostgreSQL transaction, (d) marks the   |
|    | nonce as consumed.                                              |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Dual Push Notification**                                      |
| *7 |                                                                 |
| ** | Upon successful commit, the backend dispatches Web Push         |
|    | notifications to both the Employee (\'✅ 1 Coffee redeemed at   |
|    | Cafeteria B\') and the Seller (\'☕ 1 Coffee redeemed by Ankit  |
|    | S.\'). The Seller\'s transaction feed updates in real time via  |
|    | WebSocket.                                                      |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Offline Fallback (Manual OTP)**                               |
| *8 |                                                                 |
| ** | If the Employee camera fails or there is no connectivity, the   |
|    | Seller displays a 6-digit OTP (derived from their seller        |
|    | token). The Employee enters it manually in the app. The request |
|    | is queued in IndexedDB and synced upon reconnection.            |
+----+-----------------------------------------------------------------+

**3.3 Revised P2P Coupon Transfer Flow (Employee Scans Colleague QR)**

The P2P gifting feature mirrors the redemption flow. The receiving
employee displays their personal wallet QR, and the sender scans it to
initiate a transfer.

+----+-----------------------------------------------------------------+
| *  | **Recipient Displays Wallet QR**                                |
| *1 |                                                                 |
| ** | The receiving employee opens \'Receive Coupon\' which displays  |
|    | a personal wallet QR encoding their employeeId + a short-lived  |
|    | nonce (5 minutes).                                              |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Sender Selects \'Gift Coupon\'**                              |
| *2 |                                                                 |
| ** | The sending employee taps \'Gift a Coupon\', selects coupon     |
|    | type and quantity, then taps \'Scan Recipient QR\'.             |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Scan & Biometric Confirm**                                    |
| *3 |                                                                 |
| ** | Sender scans the recipient\'s QR. The app resolves the          |
|    | recipient name from the employee directory and displays a       |
|    | confirmation screen. Sender authenticates via biometrics.       |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Signed Transfer Request**                                     |
| *4 |                                                                 |
| ** | App sends POST /api/v1/transfers with { senderId, recipientId,  |
|    | nonce, couponTypeId, quantity, deviceSignature }. Backend       |
|    | processes as a debit-credit ledger pair --- atomically.         |
+----+-----------------------------------------------------------------+

+----+-----------------------------------------------------------------+
| *  | **Social Appreciation Feed**                                    |
| *5 |                                                                 |
| ** | If both users have enabled public recognition, the transfer     |
|    | posts to the \'Appreciation Wall\': \'❤️ Ankit gifted Maya a    |
|    | Coffee!\'                                                       |
+----+-----------------------------------------------------------------+

**4. Security Architecture**

**4.1 Seller QR Security Model**

Since the Seller QR is now the trust anchor for redemptions, its
integrity is critical. The following measures prevent spoofing and
replay:

-   Server-Signed Nonce: Each Seller QR payload is HMAC-SHA256 signed by
    the backend using a seller-specific secret. The employee app
    verifies the signature before submitting a redemption.

-   Time-Bounded Refresh: Seller QR refreshes every 10 minutes. Nonces
    have a server-side expiry of 10 minutes + 30-second clock-drift
    allowance.

-   Single-Use Nonce: Each nonce can only be used for one successful
    redemption. Subsequent attempts with the same nonce are rejected
    with HTTP 409 Conflict.

-   Seller Identity Verification: The employee app displays the
    seller\'s registered name and photo before the biometric
    confirmation step, allowing the employee to verify they are at the
    correct vendor.

-   Rate Limiting: The backend enforces a maximum of 120 redemptions per
    vendor per minute, with pg_advisory_lock coordinating across
    horizontally scaled instances.

**4.2 Employee Authentication**

-   JWT session tokens are bound to device fingerprint. A new device
    requires re-authentication.

-   Biometric confirmation is required for all redemptions and transfers
    --- PIN fallback is permitted only after 3 biometric failures.

-   All TOTP secrets are encrypted at rest using AES-256-GCM with keys
    stored in a hardware security module (HSM) or cloud KMS.

**5. Frontend Engineering: Angular 21 PWA**

**5.1 Performance Architecture**

Angular 21\'s zoneless change detection
(provideZonelessChangeDetection()) eliminates unnecessary re-render
cycles. Angular Signals provide fine-grained reactivity --- when a
redemption is confirmed, only the specific balance signal and
notification signal update, not the entire dashboard component tree.

**5.2 Scanner Implementation**

  ------------------------------------------------------------------------------------------
  **Platform**   **Scanner Library**                  **Scan Target**      **Fallback**
  -------------- ------------------------------------ -------------------- -----------------
  Android        ngx-scanner                          Seller QR /          Manual 6-digit
  (Chrome)                                            Colleague QR via     OTP entry
                                                      MediaStream API      

  iOS (Safari    zxing-js / Quagga2                   Static image capture Manual 6-digit
  PWA)                                                mode                 OTP entry

  Hybrid         \@capacitor-mlkit/barcode-scanning   Native hardware ML   None required
  (Capacitor)                                         scanner              (highly robust)
  ------------------------------------------------------------------------------------------

**5.3 Service Worker Caching Strategy**

-   App Shell (AssetGroups): HTML, CSS, JS, fonts prefetched --- app
    loads instantly in offline mode.

-   API Data (DataGroups): Freshness-first policy --- network first,
    IndexedDB fallback for coupon balances and transaction history.

-   Background Sync: Offline redemption requests queued in SyncQueue
    (IndexedDB via Dexie.js) and replayed via SyncManager API upon
    reconnection.

-   Seller QR Cache: The Seller QR payload is cached locally and
    re-validated against server nonce on next connectivity --- enabling
    offline QR display.

**6. Backend Architecture: NestJS / Node.js**

**6.1 Module Structure**

  -------------------------------------------------------------------------------------
  **Module**           **Responsibility**             **Key Endpoints**
  -------------------- ------------------------------ ---------------------------------
  AuthModule           JWT issuance, RBAC guards,     POST /auth/login, POST
                       device binding, biometric      /auth/refresh, POST
                       token validation.              /auth/verify-biometric

  RedemptionModule     Process employee-initiated     POST /api/v1/redemptions, GET
                       redemption requests, validate  /api/v1/redemptions/history
                       seller nonce, deduct balance   
                       atomically.                    

  TransferModule       P2P coupon gifting --- debit   POST /api/v1/transfers, GET
                       sender, credit recipient,      /api/v1/transfers/history
                       trigger Appreciation Feed.     

  SellerQRModule       Generate, sign, and refresh    GET /api/v1/seller/qr, POST
                       Seller QR payloads. Nonce      /api/v1/seller/qr/refresh
                       lifecycle management.          

  LedgerModule         Append-only ledger entry       GET /api/v1/ledger/:employeeId
                       management. Balance            
                       computation from ledger sum.   

  GamificationModule   Points, badges, leaderboards,  GET /api/v1/gamification/stats,
                       streak tracking, Eco-Points    POST
                       calculation.                   /api/v1/gamification/eco-points

  ReportingModule      EOD reconciliation, anomaly    GET /api/v1/reports/eod, GET
                       detection, tax exports, admin  /api/v1/reports/anomalies
                       dashboards.                    

  NotificationModule   Web Push dispatch to employee  POST /api/v1/notifications/push
                       and seller upon transaction    
                       events.                        
  -------------------------------------------------------------------------------------

**6.2 Atomic Redemption SQL Transaction**

The following procedure ensures ledger integrity under high concurrency:

+-----------------------------------------------------------------------+
| \-- Atomic Redemption (Employee-Initiated via Seller QR Scan)         |
|                                                                       |
| BEGIN;                                                                |
|                                                                       |
| \-- 1. Validate seller nonce (must exist, not expired, not consumed)  |
|                                                                       |
| SELECT id FROM seller_nonces WHERE nonce = \$1 AND expires_at \>      |
| NOW() AND consumed = FALSE FOR UPDATE;                                |
|                                                                       |
| \-- 2. Lock employee balance row                                      |
|                                                                       |
| SELECT balance FROM employee_coupons WHERE employee_id = \$2 AND      |
| coupon_type_id = \$3 FOR UPDATE;                                      |
|                                                                       |
| \-- 3. Deduct balance, insert ledger & redemption records, consume    |
| nonce                                                                 |
|                                                                       |
| UPDATE employee_coupons SET balance = balance - \$4 WHERE employee_id |
| = \$2 AND coupon_type_id = \$3;                                       |
|                                                                       |
| INSERT INTO ledger_entries (employee_id, seller_id, type, amount,     |
| ref_nonce) VALUES (\$2, \$5, \'REDEMPTION\', -\$4, \$1);              |
|                                                                       |
| UPDATE seller_nonces SET consumed = TRUE WHERE nonce = \$1;           |
|                                                                       |
| COMMIT;                                                               |
+-----------------------------------------------------------------------+

**7. Database Strategy: PostgreSQL Ledger**

**7.1 Core Schema Additions for Reversed Flow**

  -------------------------------------------------------------------------
  **Table**          **Purpose**            **Key Columns**
  ------------------ ---------------------- -------------------------------
  seller_nonces      Stores server-issued,  id, seller_id, nonce (UUID),
                     time-bounded nonces    hmac_signature, expires_at,
                     for each Seller QR     consumed (BOOL), created_at
                     refresh.               

  employee_coupons   Materialized balance   employee_id, coupon_type_id,
                     view --- sum computed  balance, last_updated
                     from ledger_entries.   

  ledger_entries     Append-only source of  id, employee_id, seller_id,
                     truth for all balance  type (ENUM), amount, ref_nonce,
                     changes.               created_at

  redemptions        Denormalized           id, employee_id, seller_id,
                     redemption records for coupon_type_id, quantity,
                     EOD reconciliation.    nonce, device_signature,
                                            status, created_at

  transfers          P2P gifting records    id, sender_id, recipient_id,
                     --- each transfer      coupon_type_id, quantity,
                     creates two ledger     appreciation_message,
                     entries.               created_at

  sync_conflicts     Records offline        id, seller_id, local_txn_id,
                     redemption conflicts   conflict_reason, resolved
                     for admin review.      (BOOL), created_at
  -------------------------------------------------------------------------

**8. Offline & Synchronization Architecture**

With the employee holding the scanner, offline handling is unified on a
single device (the employee\'s smartphone) rather than requiring both
employee and seller devices to manage queues.

**8.1 Employee-Side Offline Queue (IndexedDB via Dexie.js)**

-   Outbox Pattern: When the employee app cannot reach the backend, the
    signed redemption payload is stored in the SyncQueue table in
    IndexedDB.

-   Optimistic UI: The app immediately shows \'Pending\' status and
    decrements the displayed balance. The full deduction is confirmed
    upon sync.

-   Background Sync: The SyncManager API fires a \'redemptionSync\'
    event when connectivity is restored, replaying queued requests with
    their original idempotency keys.

-   Conflict Handling: If the server rejects a queued redemption (e.g.,
    balance was already exhausted), the employee receives a push
    notification and the balance is re-credited. The conflict is logged
    in sync_conflicts.

**8.2 Seller-Side Offline Capability**

-   The Seller QR is cached locally --- the seller can display it
    without connectivity. New nonces are pre-fetched when online and
    stored with their expiry timestamps.

-   The Seller\'s transaction feed shows locally cached transactions;
    new real-time updates sync upon reconnection via WebSocket reconnect
    with delta pull.

**9. Gamification & Behavioral Engagement**

**9.1 Points, Badges & Leaderboards (PBL Framework)**

  ------------------------------------------------------------------------
  **Mechanic**       **Trigger**               **Reward**
  ------------------ ------------------------- ---------------------------
  Engagement Points  Daily app open,           +5 to +50 points per
                     completing profile,       action.
                     referring a colleague.    

  Eco-Points         Choosing plant-based      +10 Eco-Points; unlocks
                     milk, using a reusable    \'Sustainability Champion\'
                     cup.                      badge.

  Streak Bonus       Consecutive daily         Day 7 streak = 1 free
                     redemptions without a     Coffee coupon; Day 30 =
                     miss.                     \'Coffee Addict\' badge.

  Early Bird Badge   Redemption before 8:30 AM Badge + +20 points; helps
                     (off-peak hours).         distribute cafeteria load.

  Appreciation Star  P2P coupon gift sent to a +15 points + post to
                     colleague.                Appreciation Wall (if
                                               public enabled).

  Surprise & Delight Random trigger after      Digital scratch card ---
                     10-50 redemptions.        win a bonus coupon or
                                               Eco-Points.

  Team Leaderboard   Department aggregate      Monthly winner: catered
                     engagement score.         team breakfast coupon
                                               bundle.
  ------------------------------------------------------------------------

**9.2 Endowed Progress & Loss Aversion**

-   New users receive a \'Starter Card\' pre-filled with 2/10 stamps ---
    reducing first-use friction via the Endowed Progress Effect.

-   Streak counters are prominently displayed; a 24-hour warning push
    notification fires when a streak is at risk, leveraging Loss
    Aversion psychology.

**10. Sustainability Module: Carbon Footprint Tracking**

Every redemption is tagged with a CO₂e (Carbon Dioxide Equivalent) value
based on life cycle assessment data for each beverage type. This data
feeds the employee\'s personal Carbon Ledger and company-wide Scope 3
emissions reporting.

  -----------------------------------------------------------------------
  **Beverage**             **CO₂e per Serving**   **Eco-Points Modifier**
  ------------------------ ---------------------- -----------------------
  Black Coffee             21g CO₂e               Baseline

  Coffee with Dairy Milk   200g CO₂e              -5 Eco-Points

  Coffee with Oat/Soy Milk 60g CO₂e               +10 Eco-Points

  Green Tea                15g CO₂e               +12 Eco-Points

  Reusable Cup Used        -30g CO₂e offset       +15 Eco-Points bonus
  -----------------------------------------------------------------------

**11. Reporting, Analytics & Financial Reconciliation**

**11.1 Dashboard Taxonomy**

  ------------------------------------------------------------------------
  **Dashboard     **Audience**     **Key Metrics**
  Type**                           
  --------------- ---------------- ---------------------------------------
  Operational     Shift Manager    Live transaction feed, terminal status,
                                   pending sync queue depth, active seller
                                   count.

  Analytical      HR / Finance     Beverage trend analysis, peak-hour heat
                                   maps, P2P transfer frequency, carbon
                                   footprint by department.

  Strategic       CFO / CHRO       Total issuance vs. redemption burn
                                   rate, program ROI, employee
                                   satisfaction correlation, Scope 3 CSR
                                   report.

  Anomaly         Security / Audit Transaction spikes \> 3σ, failed nonce
                                   attempts, sync conflict patterns,
                                   high-frequency employee accounts.
  ------------------------------------------------------------------------

**11.2 Automated EOD Reconciliation**

-   At 11:59 PM, the backend runs a reconciliation job comparing all
    redemption records against ledger entries using txn_code matching.

-   Unmatched transactions (exist in seller outbox but not in ledger)
    are flagged as Exception Items for admin review.

-   The reconciliation report is auto-emailed to Finance and archived in
    immutable ledger storage.

**12. Future Roadmap: NFC Tap-to-Redeem**

The Version 2.0 QR scan flow establishes the employee-side initiation
model, which aligns perfectly with a future NFC upgrade path. When the
employee\'s device acts in NDEF Reader mode, it can read the Seller\'s
NFC tag (equivalent to the displayed QR) without requiring a camera at
all.

  -------------------------------------------------------------------------
  **Phase**       **Feature**          **Technology**    **Availability**
  --------------- -------------------- ----------------- ------------------
  Current (v2.0)  Employee scans       ngx-scanner /     All platforms
                  Seller QR            zxing-js          

  Phase 4 (2026   Employee taps Seller NDEFReader API    Android only
  Q3)             NFC tag              (Android Chrome)  (progressive
                                                         enhancement)

  Phase 4 (2026   iOS NFC support      iOS Web NFC (via  iOS progressive
  Q4)                                  AppClip or Safari rollout
                                       18+)              
  -------------------------------------------------------------------------

**13. Implementation Roadmap**

  --------------------------------------------------------------------------
  **Phase**        **Deliverables**                           **Duration**
  ---------------- ------------------------------------------ --------------
  Phase 1: Core    PostgreSQL schema (including seller_nonces 6 weeks
  Ledger & Auth    table), NestJS AuthModule +                
                   RedemptionModule with reversed flow, basic 
                   Angular PWA (Employee wallet + Seller QR   
                   display).                                  

  Phase 2: Offline Service worker configuration, Dexie.js     4 weeks
  Resilience       IndexedDB integration, Background Sync for 
                   employee-side outbox, Seller QR nonce      
                   pre-caching.                               

  Phase 3:         PBL engine, Eco-Points module,             5 weeks
  Gamification &   Administrative dashboards (PrimeNG/Angular 
  Dashboards       Material), EOD reconciliation cron jobs.   

  Phase 4:         Web Push API integration (dual             4 weeks
  Notifications,   notifications), Carbon Footprint tracker,  
  NFC &            P2P transfer with Appreciation Wall, NFC   
  Sustainability   pilot on Android.                          
  --------------------------------------------------------------------------

**14. Infrastructure & Operations**

**14.1 Deployment Architecture**

-   NestJS API deployed as stateless Docker containers on Kubernetes ---
    auto-scales during lunch-hour redemption peaks.

-   PostgreSQL managed on RDS (AWS) or Cloud SQL (GCP) with read
    replicas for analytical dashboard queries.

-   Redis used for nonce validation cache (sub-millisecond lookup) and
    WebSocket pub/sub for real-time seller notification.

-   CDN-hosted Angular PWA with service worker --- zero-touch updates
    via cache-busting on deploy.

**14.2 Monitoring & Observability**

-   API latency, nonce validation errors, and sync queue depth tracked
    in OpenTelemetry → Grafana dashboard.

-   Seller QR refresh failure alerts (PagerDuty) --- if nonce generation
    fails, sellers are notified to use manual OTP mode.

-   Angular runtime tracing (Angular DevTools production mode) monitors
    scan UI re-render performance during peak hours.

+-----------------------------------------------------------------------+
| **Conclusion**                                                        |
|                                                                       |
| Version 2.0 of the Digital Voucher Ecosystem redefines the coupon     |
| redemption experience by empowering the employee --- not the seller   |
| --- as the initiating party. By scanning the Seller\'s QR code,       |
| employees leverage their own smartphones as the trust anchor,         |
| eliminating camera hardware requirements at POS terminals,            |
| strengthening non-repudiation, and enabling a seamless offline        |
| experience. Combined with gamified sustainability tracking, P2P       |
| coupon gifting, real-time dual notifications, and a ledger-grade      |
| PostgreSQL backbone, this ecosystem is a secure, scalable, and        |
| engaging digital economy ready for enterprise deployment.             |
+-----------------------------------------------------------------------+
