# Job Portal API Reference

REST API for the Job Portal backend. For the request pipeline (middleware order, error flow) see [REQUEST_FLOW.md](./REQUEST_FLOW.md). Interactive docs are served by the running app at `/api-docs`.

## Contents

1. [Conventions](#1-conventions)
2. [Endpoint summary](#2-endpoint-summary)
3. [Auth](#3-auth)
4. [Users](#4-users)
5. [Jobs](#5-jobs)
6. [Applications](#6-applications)
7. [System](#7-system)
8. [Reference data](#8-reference-data)
9. [Errors](#9-errors)

---

## 1. Conventions

| Item | Value |
|---|---|
| Base URL | `http://localhost:5000/api/v1` (port from `PORT`) |
| Content type | `application/json` (request and response) |
| Authentication | `Authorization: Bearer <JWT>` obtained from `POST /auth/login` or `POST /auth/register` |
| Token lifetime | `JWT_EXPIRES_IN` (default `1d`) |
| IDs | 24-character MongoDB ObjectId strings |
| Timestamps | ISO 8601 UTC (`createdAt`, `updatedAt`) |
| Rate limit | 100 requests / 15 min per IP (`RATE_LIMIT_MAX`); `/auth/*` is stricter at 20 / 15 min. Exceeding returns `429`. |
| Body size limit | 1 MB |

### Roles

| Role | Description | How obtained |
|---|---|---|
| `candidate` | Job seeker. Can apply to jobs and manage own applications. | Self-register (default) |
| `employer` | Posts jobs and reviews applications for own jobs. | Self-register with `"role": "employer"` |
| `admin` | Full access to users, jobs and applications. | Cannot be self-registered; assign directly in the database |

### Success envelope

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

`meta` is present only on paginated list endpoints.

### Pagination

Paginated endpoints accept `page` (default `1`) and `limit` (default `10`, maximum `100`).

---

## 2. Endpoint summary

Legend: **Public** = no token needed. **Own** = the resource must belong to the caller (admins bypass this).

| # | Method | Endpoint | Access | Purpose |
|--:|---|---|---|---|
| 1 | POST | `/auth/register` | Public | Create a candidate or employer account |
| 2 | POST | `/auth/login` | Public | Authenticate and receive a JWT |
| 3 | GET | `/users/me` | Any authenticated user | Get the current user's profile |
| 4 | PATCH | `/users/me` | Any authenticated user | Update own profile |
| 5 | GET | `/users` | `admin` | List all users (paginated) |
| 6 | GET | `/users/:id` | `admin` | Get a user by ID |
| 7 | DELETE | `/users/:id` | `admin` | Delete a user |
| 8 | GET | `/jobs` | Public | Search, filter and list jobs (paginated) |
| 9 | GET | `/jobs/:id` | Public | Get a single job with poster details |
| 10 | POST | `/jobs` | `employer`, `admin` | Create a job posting |
| 11 | PATCH | `/jobs/:id` | `employer` (Own), `admin` | Update a job posting |
| 12 | DELETE | `/jobs/:id` | `employer` (Own), `admin` | Delete a job posting |
| 13 | POST | `/jobs/:jobId/applications` | `candidate` | Apply to an open job |
| 14 | GET | `/jobs/:jobId/applications` | `employer` (Own job), `admin` | List applications received for a job |
| 15 | GET | `/applications/me` | `candidate` | List the caller's own applications |
| 16 | PATCH | `/applications/:id/status` | `employer` (Own job), `admin` | Move an application through the hiring pipeline |
| 17 | DELETE | `/applications/:id` | `candidate` (Own), `admin` | Withdraw an application |
| 18 | GET | `/health` | Public | Liveness / readiness probe |

Outside the `/api/v1` prefix: `GET /api-docs` (Swagger UI) and `GET /api-docs.json` (OpenAPI 3 spec).

---

## 3. Auth

### 3.1 `POST /auth/register`

Creates an account and returns the user together with a JWT, so the client is logged in immediately.

| Field | Type | Required | Rules |
|---|---|:---:|---|
| `name` | string | Yes | 2–100 characters, trimmed |
| `email` | string | Yes | Valid email; stored lowercase; must be unique |
| `password` | string | Yes | 8–72 characters; stored as a bcrypt hash |
| `role` | string | No | `candidate` (default) or `employer`. `admin` is rejected. |

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "Passw0rd123", "role": "candidate" }
```

| Status | Meaning |
|---|---|
| `201` | Registered. `data` = `{ user, token }` |
| `400` | Validation failed |
| `409` | Email already registered |
| `429` | Auth rate limit exceeded |

### 3.2 `POST /auth/login`

| Field | Type | Required | Rules |
|---|---|:---:|---|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Non-empty |

| Status | Meaning |
|---|---|
| `200` | Logged in. `data` = `{ user, token }` |
| `400` | Validation failed |
| `401` | Invalid email or password (same message for both, to avoid account enumeration) |
| `429` | Auth rate limit exceeded |

### 3.3 Social login — `GET /auth/:provider` and `GET /auth/:provider/callback`

Sign in or sign up with `google`, `github` or `linkedin`. These are **browser redirects**, not JSON endpoints: open `/auth/:provider` (optionally `?role=candidate|employer` for new accounts) and the user is sent to the provider, then back to `FRONTEND_URL/auth/callback#token=<jwt>&new=<0|1>` (or `#error=<code>`). Setup, account-linking rules and error codes are in [SOCIAL_LOGIN.md](./SOCIAL_LOGIN.md).

Users created this way have no password; `GET /users/me` includes `authProviders` (e.g. `["google"]`) and `avatar` may be a full external URL.

---

## 4. Users

All user endpoints require a valid token.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | Any role | Return the authenticated user's profile |
| PATCH | `/users/me` | Any role | Update own profile (multipart) |
| GET | `/users` | `admin` | Paginated list of users, newest first |
| GET | `/users/:id` | `admin` | Fetch one user |
| DELETE | `/users/:id` | `admin` | Permanently remove a user |

**`PATCH /users/me` body** — `multipart/form-data`, send only the fields to change. Unknown fields are rejected, so role and email cannot be changed here. Uploaded images are served from `/uploads/avatars/<file>`.

| Field | Type | Applies to | Rules |
|---|---|---|---|
| `avatar` | file | All | Profile image or company logo. JPG, PNG or WEBP, up to 2 MB. Replaces the previous image. |
| `name` | string | All | 2–100 characters |
| `phone` | string | All | 7–15 digits, optional leading `+` |
| `about` | string | All | Up to 1000 characters |
| `address`, `city`, `state`, `country` | string | All | Address up to 300 characters |
| `totalEmployees` | integer | `employer` | At least 1 |
| `educationLevel` | string | `candidate` | `high-school`, `diploma`, `bachelor`, `master`, `doctorate`, `other` |
| `educationField`, `educationInstitution` | string | `candidate` | |

Sending a field meant for the other role returns `400`.

**`GET /users` query**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer | `1` | |
| `limit` | integer | `10` | Max `100` |

| Status | Applies to | Meaning |
|---|---|---|
| `200` | all | Success |
| `400` | PATCH, `:id` routes | Validation failed or malformed ID |
| `401` | all | Missing/invalid token |
| `403` | admin routes | Caller is not an admin |
| `404` | GET/DELETE `:id` | User not found |

---

## 5. Jobs

### 5.1 `GET /jobs` — search and list (public)

By default only jobs with `status=open` are returned.

| Query param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `10` | Page size, max `100` |
| `search` | string | – | Full-text search across title, description and company |
| `location` | string | – | Case-insensitive partial match |
| `type` | enum | – | `full-time`, `part-time`, `contract`, `internship`, `remote` |
| `status` | enum | `open` | `open` or `closed` |
| `sort` | enum | `newest` | `newest`, `oldest`, or `salary` (highest `salaryMax` first) |

Response: `200` with `data` = array of jobs and `meta` pagination block.

### 5.2 `GET /jobs/:id` — job details (public)

Returns the job with `postedBy` populated as `{ name, email }`. `404` if not found.

### 5.3 `POST /jobs` — create (`employer`, `admin`)

| Field | Type | Required | Rules |
|---|---|:---:|---|
| `title` | string | Yes | 3–150 characters |
| `description` | string | Yes | At least 10 characters |
| `company` | string | Yes | 2–150 characters |
| `location` | string | Yes | 2–150 characters |
| `type` | enum | No | Default `full-time` |
| `salaryMin` | number | No | `>= 0`; must not exceed `salaryMax` |
| `salaryMax` | number | No | `>= 0` |
| `skills` | string[] | No | Up to 30 items |
| `status` | enum | No | Default `open` |

`postedBy` is set automatically from the token. Returns `201` with the created job.

```json
{
  "title": "Backend Engineer",
  "description": "Build and maintain Node.js services.",
  "company": "Acme Inc",
  "location": "Kolkata",
  "type": "full-time",
  "salaryMin": 600000,
  "salaryMax": 1200000,
  "skills": ["node", "mongodb"]
}
```

### 5.4 `PATCH /jobs/:id` — update (owner `employer`, `admin`)

Partial update: send only the fields to change (same rules as create). Unknown fields are rejected. Use `"status": "closed"` to stop accepting applications.

### 5.5 `DELETE /jobs/:id` — delete (owner `employer`, `admin`)

Removes the job.

| Status | Applies to | Meaning |
|---|---|---|
| `200` / `201` | all | Success (`201` for create) |
| `400` | create, update, list, `:id` routes | Validation failed or malformed ID |
| `401` | write routes | Missing/invalid token |
| `403` | write routes | Wrong role, or employer does not own the job |
| `404` | `:id` routes | Job not found |

---

## 6. Applications

### 6.1 `POST /jobs/:jobId/applications` — apply (`candidate`)

| Field | Type | Required | Rules |
|---|---|:---:|---|
Send as `multipart/form-data`.

| Field | Type | Required | Rules |
|---|---|:---:|---|
| `resume` | file | Yes | PDF, DOC or DOCX, up to 5 MB |
| `coverLetter` | string | No | Up to 5000 characters |
| `noticePeriodDays` | integer | Yes | 0–365 (0 = immediately available) |
| `experienceYears` | number | Yes | 0–60 (0 = fresher) |
| `skills` | string | No | Comma-separated, e.g. `node, mongodb` |

The candidate is taken from the token. New applications start with status `applied`.

| Status | Meaning |
|---|---|
| `201` | Application submitted |
| `400` | Validation failed, or the job is closed |
| `401` / `403` | Not logged in / not a candidate |
| `404` | Job not found |
| `409` | Already applied (one application per candidate per job) |

### 6.2 `GET /jobs/:jobId/applications` — applications for a job (`employer`, `admin`)

Returns every application for the job, newest first, with `candidate` populated as `{ name, email }`. Employers can only view applications for jobs they posted (`403` otherwise).

### 6.3 `GET /applications/me` — my applications (`candidate`)

Returns the caller's applications, newest first, with `job` populated as `{ title, company, location, status }`.

### 6.4 `PATCH /applications/:id/status` — update status (`employer`, `admin`)

| Field | Type | Required | Rules |
|---|---|:---:|---|
| `status` | enum | Yes | `applied`, `reviewing`, `shortlisted`, `rejected`, `hired` |

Only the poster of the related job (or an admin) may change the status.

### 6.5 `DELETE /applications/:id` — withdraw (`candidate`, `admin`)

Candidates can withdraw only their own applications (`403` otherwise).

| Status | Applies to | Meaning |
|---|---|---|
| `200` | 6.2 – 6.5 | Success |
| `400` | 6.4, 6.5 | Validation failed or malformed ID |
| `401` | all | Missing/invalid token |
| `403` | all | Wrong role or not the owner |
| `404` | 6.4, 6.5 | Application not found |

---

## 7. System

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Returns `{ status, uptime, db }`. `200` when MongoDB is connected, `503` when it is not. Use for load-balancer and container health checks. Excluded from request logs. |
| GET | `/api-docs` | Public | Swagger UI (interactive documentation with an **Authorize** button for the bearer token) |
| GET | `/api-docs.json` | Public | Raw OpenAPI 3.0.3 specification, for client generation and tooling |

---

## 8. Reference data

| Name | Allowed values |
|---|---|
| Job `type` | `full-time`, `part-time`, `contract`, `internship`, `remote` |
| Job `status` | `open`, `closed` |
| Application `status` | `applied` → `reviewing` → `shortlisted` → `hired` / `rejected` |
| User `role` | `candidate`, `employer`, `admin` |

Application statuses are not forced into a strict sequence; an employer may set any valid value.

---

## 9. Errors

All errors share one shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "in": "body", "field": "email", "message": "Invalid email" }
  ]
}
```

`errors` appears only for validation and duplicate-key failures. In production, `500` responses return a generic message and never include a stack trace.

| Status | Name | Typical cause |
|---|---|---|
| `400` | Bad Request | Schema validation failed, malformed ID, malformed JSON, applying to a closed job |
| `401` | Unauthorized | Missing, invalid or expired token; wrong login credentials; user deleted |
| `403` | Forbidden | Role not permitted, or resource belongs to someone else |
| `404` | Not Found | Unknown resource ID or unknown route |
| `409` | Conflict | Duplicate email or duplicate application |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected failure |
