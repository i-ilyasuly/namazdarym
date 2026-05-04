# Security Specification - Намаз Тақта

## 1. Data Invariants
- A `prayerRecord` MUST belong to the authenticated user (`userId == request.auth.uid`).
- A `prayerRecord` MUST have a valid `prayerId` (fajr, dhuhr, asr, maghrib, isha).
- A `prayerRecord` MUST have a valid `status` (on_time, jamaat, late, qaza).
- User profile (`/users/{userId}`) can only be modified by the user themselves.
- `createdAt` timestamps must be server-generated and immutable.
- `updatedAt` must match `request.time` on updates.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Spoofing Identity**: Authenticated as UserA, try to create a `prayerRecord` for UserB.
2. **Invalid Prayer ID**: Create a record with `prayerId: 'morning_coffee'`.
3. **Invalid Status**: Create a record with `status: 'super_fast'`.
4. **Shadow Field Injection**: Create a record with extra field `isVerified: true`.
5. **Timestamp Manipulation**: Try to set `createdAt` to a date in the past.
6. **Immutable Field Change**: Try to update `userId` or `date` on an existing record.
7. **Resource Poisoning**: Use a 2KB string for `prayerId` in the path.
8. **Private Data Leak**: UserA tries to read UserB's profile.
9. **Role Escalation**: Try to add `isAdmin: true` to a user profile.
10. **Array Overflow**: Add 1000 items to `reasons` array.
11. **Orphaned Record**: Create a record without a corresponding user profile (if required by rules).
12. **Status Shortcutting**: Directly set status to a terminal value if logic requires transitions (not applicable here yet).

## 3. Test Runner
(I will implement `firestore.rules.test.ts` later if needed, but for now I'll proceed to the rules).
