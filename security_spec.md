# Firestore Security Specification

## 1. Data Invariants
1. Every document under `/learners/{userId}` and `/users/{userId}` MUST have `uid == request.auth.uid` on creation and preserve `uid` immutably on update.
2. PII (`email`) is strictly isolated under `/users/{userId}/private/account` and readable only by the owning user, an Admin, or the bootstrapped Owner (`makeitaakash@gmail.com`).
3. Students cannot self-assign `role: 'admin'` or `role: 'owner'` on `/users/{userId}` or create documents under `/admins/{userId}`. Only the verified Owner (`makeitaakash@gmail.com`) can manage `/admins/{userId}`.
4. All writes require verified authentication (`request.auth != null && request.auth.token.email_verified == true`), server timestamps (`request.time`), strict key allowlists (`hasOnly`), and bounded string/array sizes.

## 2. Adversarial Payloads Blocked
1. Unauthenticated read or write on `/learners/{userId}` -> `PERMISSION_DENIED`.
2. Unverified email attempting to create `/learners/{userId}` -> `PERMISSION_DENIED`.
3. Student attempting to create `/users/{uid}` with `role: 'admin'` or `role: 'owner'` -> `PERMISSION_DENIED`.
4. Student attempting to update `/users/{uid}` to escalate `role` -> `PERMISSION_DENIED` (`affectedKeys().hasOnly(['displayName', 'organization', 'updatedAt'])`).
5. Student attempting to read another student's PII at `/users/{otherUid}/private/account` -> `PERMISSION_DENIED`.
6. Student attempting to list `/learners` or `/users` -> `PERMISSION_DENIED` (list restricted to `isAdmin()`).
7. Student attempting to write `/admins/{uid}` -> `PERMISSION_DENIED` (only `isPlatformOwner()`).
8. Client injecting an unknown ghost field (`isVerified: true`) into `/learners/{uid}` -> `PERMISSION_DENIED` (`hasOnly`).
9. Client forging `createdAt` or `updatedAt` != `request.time` -> `PERMISSION_DENIED`.
10. Oversized `name` (> 120 chars) or unbounded `skills` array (> 40 items) -> `PERMISSION_DENIED`.
11. Invalid path ID containing forbidden characters -> `PERMISSION_DENIED` (`isValidId`).
12. Student attempting to modify `/careers/{roleId}` -> `PERMISSION_DENIED` (Admin/Owner only).
