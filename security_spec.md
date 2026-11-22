# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Authentication & Verification**: All read and write operations on `vehicles` and `trips` require an authenticated Firebase user with `request.auth.token.email_verified == true`.
2. **Ownership Isolation**: Every `Vehicle` and `TripEntry` document must carry `ownerId == request.auth.uid`. `list` queries are enforced server-side via `resource.data.ownerId == request.auth.uid`.
3. **Referential Integrity**: A `TripEntry` cannot be created unless its `vehicleId` references an existing `vehicles/{vehicleId}` document owned by `request.auth.uid`.
4. **Immutability**: `ownerId` and `createdAt` are immutable once created. `createdAt` and `updatedAt` must strictly equal `request.time` on creation, and `updatedAt` must strictly equal `request.time` on update.
5. **Strict Schema & Bounds**: Shadow/extra fields are rejected via `keys().hasAll(...) && keys().hasOnly(...)` on create and `diff(existing()).affectedKeys().hasOnly(...)` on update. All strings have explicit `.size()` limits, `fair` and `cost` must be non-negative numbers (`>= 0`), and `category` must match the strict allowlist.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: Reading `/trips` or creating a trip without `request.auth`. -> `PERMISSION_DENIED`
2. **Unverified Email Write**: Creating a trip with `email_verified: false`. -> `PERMISSION_DENIED`
3. **Cross-Owner Spoofing on Create**: Setting `ownerId` to another user's UID. -> `PERMISSION_DENIED`
4. **Cross-Owner List Scraping**: Querying `/trips` or `/vehicles` belonging to another UID. -> `PERMISSION_DENIED`
5. **Orphaned Trip Injection**: Creating a trip with a non-existent `vehicleId` or another user's `vehicleId`. -> `PERMISSION_DENIED`
6. **Shadow Field Injection**: Adding `"isAdmin": true` or `"balance": 999999` on create/update. -> `PERMISSION_DENIED`
7. **ID Poisoning**: Creating `/trips/invalid@id!or1500chars` failing `isValidId()`. -> `PERMISSION_DENIED`
8. **Negative Currency Poisoning**: Sending `fair: -5000` or `cost: -100`. -> `PERMISSION_DENIED`
9. **Type Poisoning on Update**: Updating `fair` to a string `"5000"` or `place` to a 50KB string. -> `PERMISSION_DENIED`
10. **Immutable Field Tampering**: Updating `ownerId` or `createdAt` on an existing trip or vehicle. -> `PERMISSION_DENIED`
11. **Timestamp Forgery**: Setting `createdAt` or `updatedAt` to a past/future client timestamp instead of `request.time`. -> `PERMISSION_DENIED`
12. **Invalid Category Injection**: Setting `category` to an arbitrary string outside the 5 allowed Bengali categories. -> `PERMISSION_DENIED`
