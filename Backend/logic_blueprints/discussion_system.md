# Discussion System Logic Blueprint: Anti-Gravity Edition

This blueprint defines the structural logic, permission matrices, and state-flow rules for a course-scoped discussion system. It is designed to be backend-agnostic and UI-independent.

---

## 1. Structural Logic (The Anchor)

### 1.1. Scoping Rules
*   **Primary Anchor:** Every discussion thread **MUST** be bound to a unique `CourseID`.
*   **Secondary Anchor (Optional):** A thread may be bound to a `ModuleID` or `VideoID` to provide granular context.
*   **Flat Hierarchy:** The system follows a **Thread -> Reply** model. Nested replies (replies to replies) are treated as part of the same thread context to maintain simplicity and focus.

### 1.2. Identity Logic
*   Every post (Thread or Reply) must be stamped with:
    *   `AuthorID` (Unique User Reference)
    *   `AuthorRole` (STUDENT, INSTRUCTOR, or ADMIN)
    *   `Timestamp` (Creation and Last Edit)

---

## 2. Permission Logic (The Gatekeeper)

### 2.1. Access Control Matrix

| Action | Student | Instructor | Admin |
| :--- | :--- | :--- | :--- |
| **View Threads** | Only if Enrolled | Only if Course Owner | All Courses |
| **Create Thread** | Only if Enrolled | Only if Course Owner | No |
| **Post Reply** | Only if Enrolled & State=OPEN | Only if Course Owner | No |
| **Edit Own Post** | Yes (within time limit) | Yes | No |
| **Delete Own Post** | Yes | Yes | No |
| **Delete Others' Posts** | No | Yes (Moderation) | Yes (Oversight) |
| **Change State** | No | Yes | Yes |
| **Pin Thread** | No | Yes | No |

### 2.2. Validation Flow (The "Four-Check" Rule)
Before any action is committed, the system must pass these sequential gates:
1.  **Session Check:** Is the user authenticated?
2.  **Role Check:** Does the user hold a valid role for this action?
3.  **Relationship Check:** 
    *   If Student: Is the user actively enrolled in the `CourseID`?
    *   If Instructor: Does the user own the `CourseID`?
4.  **State Check:** Does the current `DiscussionState` allow this action (e.g., no replies on CLOSED threads)?

---

## 3. State Machine Logic (The Lifecycle)

### 3.1. Discussion States
*   **OPEN:** The default state. Allows new replies from Students and Instructors.
*   **RESOLVED:** Triggered by the Instructor. Indicates the doubt is clarified. 
    *   *Logic:* Thread remains visible. Replies are restricted to the Instructor only (for follow-up).
*   **CLOSED:** Triggered by Instructor or Admin. 
    *   *Logic:* Thread becomes Read-Only. No further replies or edits allowed by any role.

### 3.2. Resolution Logic
*   Only an **Instructor** can mark a specific reply as the "Accepted Answer."
*   Marking an answer as "Accepted" automatically transitions the thread state from **OPEN** to **RESOLVED**.

---

## 4. Interaction Flow Logic

### 4.1. Thread Creation Flow
1.  User initiates "New Question."
2.  System captures `CourseID` and optional `ContextID` (Video/Module).
3.  System validates **Relationship Check** (Enrollment/Ownership).
4.  Thread is initialized in **OPEN** state.
5.  Author is flagged as the "Thread Owner."

### 4.2. Moderation Flow
1.  Instructor/Admin identifies inappropriate content.
2.  **Action: Remove.** The post is flagged as `deleted`. 
3.  *Logic:* If the deleted post was a "Thread Starter," all associated replies are recursively hidden/archived to prevent orphaned data.

---

## 5. Visibility & Integrity Rules

### 5.1. Anti-Leakage Rules
*   **No Cross-Pollination:** A student in "Course A" cannot view, search, or link to discussions in "Course B" unless they are also enrolled in "Course B."
*   **No Anonymity:** Every post must be linked to a verified `AuthorID`. Anonymous posting is strictly prohibited to ensure accountability.

### 5.2. Integrity Rules
*   **State Persistence:** If a thread is **CLOSED**, it cannot be reverted to **OPEN** by a Student.
*   **Edit History:** While not visible to students, the system should logically track if a post has been edited to prevent "gaslighting" in academic discussions.

---

## 6. Admin Oversight Logic
*   **Passive Monitoring:** Admins have a "Global View" but cannot participate in the learning process (cannot post replies).
*   **Emergency Intervention:** Admins can force-close any thread across the platform if it violates system-wide policies.

---

## 7. Notification Logic (The Pulse)

### 7.1. Trigger Events
*   **New Thread:** Notify the Course Instructor(s).
*   **New Reply:** 
    *   Notify the Thread Author (Student).
    *   Notify the Instructor (if they are participating).
*   **Mention Logic:** If a user is `@mentioned`, trigger a direct notification regardless of thread ownership.

### 7.2. Delivery Rules
*   **In-App:** Real-time badge/toast notification.
*   **Email (Optional):** Digest-based or immediate for "Accepted Answers."

---

## 8. Engagement & Quality Logic (The Filter)

### 8.1. Upvoting (Helpful Flag)
*   **Logic:** Students and Instructors can mark a reply as "Helpful."
*   **Sorting:** Replies with higher "Helpful" counts are hoisted to the top (below the "Accepted Answer").
*   **Anti-Gaming:** A user cannot upvote their own post.

### 8.2. Instructor Endorsement
*   A special "Instructor Endorsed" badge can be applied to high-quality student replies, even if they aren't the final "Accepted Answer."

---

## 9. Search & Discovery Logic

### 9.1. Scope-Locked Search
*   Search results **MUST** be filtered by the user's `CourseID`.
*   **Keywords:** Search titles and body text.
*   **Status Filter:** Allow filtering by "Unresolved" (to help instructors find pending questions).

---

## 10. Attachment & Media Logic

### 10.1. Security & Scoping
*   **File Types:** Restricted to Images (JPG/PNG) and Code Snippets (Text).
*   **Access Control:** Attachments inherit the permission of the parent thread. If a user cannot view the thread, they cannot access the file URL.
*   **Storage Logic:** Files should be stored in a folder structure matching the course: `/uploads/discussions/{CourseID}/{ThreadID}/`.
