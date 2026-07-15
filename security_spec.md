# Security Specification for Atrévete HealthTech

This document details the security constraints, relational invariants, "Dirty Dozen" exploit payloads, and test strategies for the Atrévete HealthTech Firestore security architecture.

## 1. Data Invariants

1. **User Identity Isolation**: A user's profile (`/users/{userId}`) can only be created or modified by the user who owns that profile (`request.auth.uid == userId`). Users cannot change their own roles to escalate privileges.
2. **Specialist Validation (Therapist Gate)**: A therapist account cannot set `isApproved` to `true` during registration. Only an `admin` can modify `isApproved` to `true`.
3. **Event Ownership**: Only users with the `therapist` or `admin` role can create events. Only the creator of an event or an `admin` can update or delete it, except for a registered patient capacity change which is controlled via strict field-level delta checks.
4. **Assessment Confidentiality**: A nervous system assessment (`/assessments/{assessmentId}`) contains highly sensitive clinical metadata and can only be read or written by the owner of that assessment (`userId == request.auth.uid`) or by an approved clinical administrator/therapist.
5. **Reservation Integrity**: A reservation (`/reservations/{reservationId}`) must enforce that `userId` matches the authenticated caller's UID. The reservation must be linked to a valid `eventId` existing in the database.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve payloads designed to violate the security, state transitions, or identity controls of Atrévete HealthTech:

### Payload 1: Privilege Escalation (Self-Admin Role Registration)
* **Target Collection**: `/users/attacker_uid`
* **Intent**: Attacker registers a user profile with `role: "admin"` to gain total control.
* **Payload**:
```json
{
  "id": "attacker_uid",
  "email": "attacker@gmail.com",
  "name": "Attacker",
  "role": "admin",
  "createdAt": "2026-07-07T00:00:00.000Z",
  "isApproved": true
}
```

### Payload 2: Unauthorized Therapist Self-Approval
* **Target Collection**: `/users/attacker_uid`
* **Intent**: Attacker registers a therapist account and bypasses the validation gate.
* **Payload**:
```json
{
  "id": "attacker_uid",
  "email": "attacker@gmail.com",
  "name": "Attacker",
  "role": "therapist",
  "createdAt": "2026-07-07T00:00:00.000Z",
  "isApproved": true,
  "credentials": "N-Colegiado 111-S"
}
```

### Payload 3: Identity Spoofing in Assessments (Write under other User)
* **Target Collection**: `/assessments/exploit_assessment_1`
* **Intent**: Attacker writes a clinical assessment result to target patient's account.
* **Payload**:
```json
{
  "id": "exploit_assessment_1",
  "userId": "victim_patient_uid",
  "date": "2026-07-07T00:00:00.000Z",
  "sleep": "Muy deficiente",
  "nutrition": "Desbalanceado",
  "anxiety": 10,
  "symptoms": ["rumination"],
  "state": "simpatico",
  "score": 10,
  "diagnosis": "Manipulated diagnosis",
  "recommendations": []
}
```

### Payload 4: Arbitrary ID Injection (Denial of Wallet / Value Poisoning)
* **Target Collection**: `/users/attacker_uid`
* **Intent**: Inject massive junk strings into optional fields to waste storage and inflate read costs.
* **Payload**:
```json
{
  "id": "attacker_uid",
  "email": "attacker@gmail.com",
  "name": "A".repeat(10000),
  "role": "patient",
  "createdAt": "2026-07-07T00:00:00.000Z"
}
```

### Payload 5: Unauthorized Event Creation (Patient publishing Event)
* **Target Collection**: `/events/exploit_event_1`
* **Intent**: Authenticated user with role `patient` attempts to publish a new somatic workshop.
* **Payload**:
```json
{
  "title": "Malicious Somatic Event",
  "description": "Fake event",
  "type": "taller",
  "date": "2026-07-08",
  "time": "12:00",
  "modality": "online",
  "location": "Zoom",
  "capacity": 20,
  "price": 100,
  "createdBy": "attacker_patient_uid",
  "createdByName": "Attacker",
  "registeredUsers": []
}
```

### Payload 6: Event Hijacking (Updating Creator UID)
* **Target Collection**: `/events/legit_event_uid`
* **Intent**: Non-owning therapist tries to change the creator or ownership metadata of an event.
* **Payload**:
```json
{
  "title": "Soma & Calma: Regulación del Sistema Nervioso",
  "createdBy": "attacker_uid",
  "createdByName": "Attacker Therapist"
}
```

### Payload 7: Reservation Spoofing (Registering ticket for another user)
* **Target Collection**: `/reservations/malicious_res_1`
* **Intent**: Attacker books a workshop on behalf of another user's account.
* **Payload**:
```json
{
  "id": "malicious_res_1",
  "eventId": "legit_event_1",
  "userId": "victim_uid",
  "status": "confirmed",
  "bookingCode": "ATH-999999-EV",
  "createdAt": "2026-07-07T00:00:00.000Z"
}
```

### Payload 8: Direct Database Manipulation of Event Capacity
* **Target Collection**: `/events/legit_event_uid`
* **Intent**: Patient registers themselves but manually clears out all other registered users.
* **Payload**:
```json
{
  "registeredUsers": ["attacker_uid"]
}
```

### Payload 9: Temporal Integrity Tampering (Client Spoofed Timestamp)
* **Target Collection**: `/reservations/res_1`
* **Intent**: Attacker injects a fake history or future timestamp instead of server timestamp.
* **Payload**:
```json
{
  "id": "res_1",
  "eventId": "legit_event_1",
  "userId": "attacker_uid",
  "status": "confirmed",
  "bookingCode": "ATH-123456-EV",
  "createdAt": "1999-01-01T00:00:00.000Z"
}
```

### Payload 10: Value Poisoning (Invalid Enums in Assessment)
* **Target Collection**: `/assessments/as_1`
* **Intent**: Writing a non-supported clinical state to corrupt data aggregation pipeline.
* **Payload**:
```json
{
  "id": "as_1",
  "userId": "attacker_uid",
  "date": "2026-07-07T00:00:00.000Z",
  "state": "super_anxious_state_not_supported",
  "diagnosis": "Invalid state test",
  "recommendations": []
}
```

### Payload 11: Shadow Field Injection in Reservations
* **Target Collection**: `/reservations/res_1`
* **Intent**: Create reservation with additional keys like `isAdminApprovalOverridden: true`.
* **Payload**:
```json
{
  "id": "res_1",
  "eventId": "legit_event_1",
  "userId": "attacker_uid",
  "status": "confirmed",
  "bookingCode": "ATH-123456-EV",
  "createdAt": "2026-07-07T00:00:00.000Z",
  "isAdminApprovalOverridden": true
}
```

### Payload 12: Anonymous User Write Access Violation
* **Target Collection**: `/events/legit_event_uid`
* **Intent**: Unauthenticated guest attempts to modify event metadata.
* **Payload**:
```json
{
  "title": "Defaced title"
}
```

---

## 3. Test Assertion Checklist

To ensure all twelve "Dirty Dozen" payloads return `PERMISSION_DENIED`, our rules must enforce:
* Auth verification via `request.auth != null` and `request.auth.token.email_verified == true`.
* Type verification inside `isValidUser()`, `isValidEvent()`, `isValidAssessment()`, and `isValidReservation()`.
* Exact key counts during creation (`data.keys().size() == N`) to block shadow fields.
* Field-level change isolation using `affectedKeys().hasOnly(...)`.
* Verification that sensitive RBAC fields (`role`, `isApproved`) cannot be altered by owners or patients.
