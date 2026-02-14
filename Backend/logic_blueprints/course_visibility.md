# Backend Logic Blueprint: Course Visibility & Enrollment Gates

## 1. Core Logic Requirement

A course must be visible to a student on their dashboard IF AND ONLY IF:

1. The student has a valid, active `Enrollment` record for the course.
2. The `Course` itself is in `published` status.

## 2. Status Enforcement Flow

| Entity | Action | State Change | Visibility Consequence |
| :--- | :--- | :--- | :--- |
| **Course** | Created | `status: 'draft'` | ❌ Hidden everywhere |
| **Course** | Published | `status: 'published'` | ✅ Visible in Catalog, ❌ Hidden in Dashboard (until enrolled) |
| **Student** | Enrolls | `Enrollment` created | ✅ Visible in Dashboard (if Course is Published) |
| **Course** | Unpublished | `status: 'draft'` | ❌ Hidden in Catalog, ❌ **MUST BE HIDDEN in Dashboard** |

## 3. Critical Validation Logic (Backend)

### A. Catalog Fetch (`getAllCourses`)

- **Input**: Query parameters (search, category).
- **Logic**:
  - Query database for courses.
  - **MANDATORY FILTER**: `status: 'published'`.
- **Output**: List of published courses only.

### B. Enrollment Action (`enrollCourse`)

- **Input**: `courseID`, `studentID`.
- **Validations**:
  1. Validate `studentID` exists.
  2. Validate `courseID` exists.
  3. **CHECK**: Course `status` is `'published'`. If `draft`, **REJECT** (404/403).
  4. Check for existing enrollment.
- **Action**: Create `Enrollment` record.

### C. Dashboard Fetch (`getEnrolledCourses`)

- **Input**: `studentID`.
- **Logic**:
  1. Find all `Enrollment` records for `studentID`.
  2. Populate `courseID` details.
  3. **CRITICAL FILTER**: Filter out any enrollment where `courseID.status !== 'published'`.
      - *Current common failure*: Returning courses that were enrolled but later unpublished.
  4. Filter out null courses (deleted).
- **Output**: List of enrolled, **currently published** courses.

## 4. Implementation Checklist

- [x] Course Schema includes `status` ('draft', 'published').
- [x] Enrollment Schema links Student and Course.
- [x] `publishCourse` / `unpublishCourse` endpoints exist.
- [x] `enrollCourse` validates `status === 'published'`.
- [ ] `getEnrolledCourses` filters results by `course.status === 'published'`. **(PENDING FIX)**

## 5. Security & integrity

- **Role Guard**: Ensure only `student` role accesses these endpoints.
- **Data Integrity**: Never return draft course metadata (title, content) to student via API.
