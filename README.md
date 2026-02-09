# Backend – School Dashboard API

Node.js + Express API for multi-tenant school content management.

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod (shared schemas) |
| File Upload | multer + cloudinary |
| Security | helmet, cors, express-rate-limit (later) |

> [!IMPORTANT]
> No TypeScript. All validation via shared Zod schemas.

---

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cloudinary.js         # Cloudinary setup
│   │
│   ├── middleware/
│   │   ├── auth.js               # Verify JWT, attach user
│   │   ├── tenant.js             # Attach schoolCode & features
│   │   ├── checkFeature.js       # Block if feature disabled
│   │   ├── validate.js           # Zod validation
│   │   └── upload.js             # Multer config
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── schoolController.js
│   │   ├── newsController.js
│   │   ├── eventsController.js
│   │   └── galleryController.js
│   │
│   ├── models/
│   │   ├── School.js
│   │   ├── News.js
│   │   ├── Event.js
│   │   └── Gallery.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── school.js
│   │   ├── news.js
│   │   ├── events.js
│   │   └── gallery.js
│   │
│   ├── utils/
│   │   └── cloudinaryUpload.js   # Upload helper
│   │
│   └── app.js                    # Express app setup
│
├── shared/
│   └── schemas/
│       ├── authSchema.js
│       ├── newsSchema.js
│       ├── eventSchema.js
│       └── gallerySchema.js
│
├── .env
├── package.json
└── server.js                     # Entry point
```

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://sinhavikas234:****@cluster0.hzzrrkp.mongodb.net/dashboard?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dcautgf6c
CLOUDINARY_API_KEY=627354124233487
CLOUDINARY_API_SECRET=****
```

---

## MongoDB Collections

### School

```js
{
  _id: ObjectId,
  schoolCode: String,       // Unique, used for login
  schoolName: String,
  password: String,         // bcrypt hashed
  features: {
    news: Boolean,
    events: Boolean,
    gallery: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### News / Event (similar structure)

```js
{
  _id: ObjectId,
  schoolCode: String,       // Foreign key to School
  title: String,
  description: String,
  fromDate: Date,
  toDate: Date,             // Optional
  images: [String],         // Array of Cloudinary URLs (0-5)
  attachment: String,       // Single PDF URL (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### Gallery

```js
{
  _id: ObjectId,
  schoolCode: String,
  title: String,            // Optional
  description: String,      // Optional
  date: Date,
  images: [String],         // Required (1-5)
  attachment: String,       // Optional PDF
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes (Required)

```js
// School
{ schoolCode: 1 }  // unique

// News, Events
{ schoolCode: 1, createdAt: -1 }
{ schoolCode: 1, fromDate: 1, toDate: 1 }

// Gallery
{ schoolCode: 1, date: -1 }
```

---

## API Endpoints

### Auth Routes (Public)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | `{ schoolCode, schoolName, password }` | Create school account |
| POST | `/api/auth/login` | `{ schoolCode, password }` | Login, returns JWT |

### School Routes (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/school/me` | Get current school info |
| PATCH | `/api/school/features` | Update features toggle |
| PATCH | `/api/school/password` | Change password |
| PATCH | `/api/school/profile` | Update schoolName |

### News Routes (Protected + Feature Check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | List news (paginated) |
| GET | `/api/news/:id` | Get single news |
| POST | `/api/news` | Create news (FormData) |
| PATCH | `/api/news/:id` | Update news |
| DELETE | `/api/news/:id` | Delete news + Cloudinary files |

### Events Routes (Protected + Feature Check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (paginated) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event (FormData) |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event + Cloudinary files |

### Gallery Routes (Protected + Feature Check)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gallery` | List gallery (paginated) |
| GET | `/api/gallery/:id` | Get single gallery |
| POST | `/api/gallery` | Create gallery (FormData) |
| PATCH | `/api/gallery/:id` | Update gallery |
| DELETE | `/api/gallery/:id` | Delete gallery + Cloudinary files |

### Public API (For School Websites)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/news/:schoolCode` | Public news list |
| GET | `/api/public/events/:schoolCode` | Public events list |
| GET | `/api/public/gallery/:schoolCode` | Public gallery list |

**Query params:** `?page=1&limit=10&status=active` or `?status=all`

---

## Middleware Chain (Protected Routes)

```
Request
   │
   ▼
┌─────────────────┐
│  auth.js        │  ← Verify JWT, attach req.user
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  tenant.js      │  ← Attach schoolCode & features from DB
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  checkFeature   │  ← Return 403 if feature disabled
│  ('news')       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  validate.js    │  ← Zod schema validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  ← Business logic
└─────────────────┘
```

---

## File Upload Flow

```
Frontend (FormData)
       │
       ▼
┌─────────────────┐
│  multer         │  ← Parse multipart, save to temp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Controller     │  ← Upload each file to Cloudinary
│                 │     Delete temp files
│                 │     Save URLs to MongoDB
└─────────────────┘
```

### Upload Rules

| Type | Field Name | Max Count | Max Size | Formats |
|------|------------|-----------|----------|---------|
| Images | `images` | 5 | 1 MB each | jpg, jpeg, png, webp |
| Attachment | `attachment` | 1 | 1 MB | pdf |

### Cloudinary Folder Structure

```
cloudinary/
├── dashboard/
│   ├── news/
│   │   └── {schoolCode}_{timestamp}_{filename}
│   ├── events/
│   │   └── {schoolCode}_{timestamp}_{filename}
│   └── gallery/
│       └── {schoolCode}_{timestamp}_{filename}
```

---

## Error Response Format

```js
// Error
{
  success: false,
  message: "Validation failed",
  errors: [
    { field: "title", message: "Title is required" }
  ]
}

// Success
{
  success: true,
  data: { ... },
  pagination: {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3
  }
}
```

---

## Security Rules

1. **Every tenant query MUST filter by `req.user.schoolCode`**
2. **Feature disabled → return 403 early (no DB hit)**
3. **Validate with Zod before any DB operation**
4. **Hash passwords with bcrypt (10 rounds)**
5. **Delete files from Cloudinary when deleting items**
6. **Remove temp files after upload**

---

## Scripts

```bash
npm install
npm run dev      # nodemon for development
npm start        # Production start
```

---

## Shared Zod Schemas

Located in `backend/shared/schemas/`:

```js
// newsSchema.js
const { z } = require('zod');

const newsSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime().optional(),
});

module.exports = { newsSchema };
```

Used in:
- Backend: `validate.js` middleware
- Frontend: `react-hook-form` with `zodResolver`
