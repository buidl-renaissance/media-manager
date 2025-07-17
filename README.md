# 📦 Media Manager

A core, reusable module designed to support uploading, processing, tagging, and managing media files across various applications (artist websites, collectives, blogs, etc.).

## ✨ Overview

The Media Manager provides essential functionality for handling media files including uploading from multiple sources, automatic resizing, AI-driven tagging, cloud storage, and a searchable admin interface. V1 focuses on core features to establish a solid foundation for media management across projects.

## 🔧 Core Features

### 1. Upload Sources
- **Local Uploads**: Drag-and-drop and file picker UI
- **Google Drive Integration**: OAuth flow with Google Picker API to import images directly from user's Drive

### 2. Cloud Storage (DigitalOcean Spaces)
- S3-compatible storage with organized file structure:
  ```
  /original/    # Original uploaded files
  /medium/      # 800px width resized images
  /thumb/       # 200px width thumbnails
  ```

### 3. Image Processing
- **Background Processing**: Powered by Ingest queue system
- **Automatic Resizing**: Using Sharp library
  - Medium: 800px width
  - Thumbnail: 200px width

### 4. AI-Powered Tagging
- **OpenAI Vision Integration**: Automatic extraction of:
  - Tags (for search and categorization)
  - Description (short summary)
  - Alt text (accessibility and SEO)

### 5. Search & Discovery
- **Keyword Search**: Search across tags and descriptions
- **Filtering**: By source (local/Google Drive) and creation date

### 6. Admin Dashboard
- **Multiple Views**:
  - Tile view (grid of thumbnails)
  - Card view (image + metadata)
- **Management Features**:
  - Edit tags and alt text
  - Delete images
  - View all image sizes

## 🧱 Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (React) with Styled Components |
| Backend API | Next.js API Routes |
| Storage | DigitalOcean Spaces (S3-compatible) |
| Database | Turso (SQLite edge) with Drizzle ORM |
| Background Jobs | Ingest |
| AI Processing | OpenAI Vision API |
| Package Management | Yarn |

## 📊 Database Schema

```typescript
media = {
  id: uuid,
  originalUrl: text,
  mediumUrl: text,
  thumbnailUrl: text,
  source: text,            // 'local' | 'gdrive'
  tags: string[],
  description: text,
  altText: text,
  createdAt: timestamp
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn package manager
- DigitalOcean Spaces account
- OpenAI API key
- Google Cloud Console project (for Drive integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd media-manager
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   # Database
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   
   # DigitalOcean Spaces
   DO_SPACES_KEY=your_do_spaces_key
   DO_SPACES_SECRET=your_do_spaces_secret
   DO_SPACES_ENDPOINT=your_do_spaces_endpoint
   DO_SPACES_BUCKET=your_bucket_name
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Google Drive
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Ingest
   INGEST_URL=your_ingest_endpoint
   INGEST_TOKEN=your_ingest_token
   ```

4. **Database Setup**
   ```bash
   yarn db:push
   ```

5. **Start Development Server**
   ```bash
   yarn dev
   ```

## 📁 Project Structure

```
src/
├── pages/
│   ├── api/          # API endpoints
│   ├── admin/        # Admin dashboard pages
│   └── index.tsx     # Main upload interface
├── components/
│   ├── Upload/       # Upload components
│   ├── Gallery/      # Gallery and grid views
│   └── Search/       # Search functionality
├── lib/
│   ├── db/           # Database schema and connections
│   ├── storage/      # DigitalOcean Spaces integration
│   ├── ai/           # OpenAI Vision integration
│   └── google/       # Google Drive integration
└── styles/           # Styled components and global styles
```

## 🔌 API Endpoints

### Upload
- `POST /api/upload/local` - Upload local files
- `POST /api/upload/gdrive` - Import from Google Drive

### Media Management
- `GET /api/media` - List media with search/filtering
- `GET /api/media/[id]` - Get specific media item
- `PUT /api/media/[id]` - Update media metadata
- `DELETE /api/media/[id]` - Delete media item

### Processing
- `POST /api/process/resize` - Trigger background resize job
- `POST /api/process/analyze` - Trigger AI analysis job

## ✅ V1 Development Checklist

- [ ] Local file uploads
- [ ] Google Drive integration
- [ ] DigitalOcean file uploads
- [ ] Sharp-based resizing (medium + thumbnail)
- [ ] Ingest background job setup
- [ ] OpenAI tagging + alt text pipeline
- [ ] Drizzle schema + Turso setup
- [ ] Search endpoint (tags + description)
- [ ] Tile and Card views in admin UI
- [ ] Edit/delete image functionality

## 🛠️ Development

### Running Tests
```bash
yarn test
```

### Type Checking
```bash
yarn type-check
```

### Linting
```bash
yarn lint
```

### Database Operations
```bash
yarn db:push     # Push schema changes
yarn db:studio   # Open Drizzle Studio
yarn db:seed     # Seed database with sample data
```

## 📝 Contributing

1. Follow the existing code style (ESLint configuration)
2. Use Styled Components for styling
3. Write TypeScript with strict typing
4. Test API endpoints thoroughly
5. Update documentation for new features

## 📄 License

[Add your license information here]

## 🤝 Support

For questions and support, please [add contact information or issue tracker link].
