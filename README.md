# DrawingIQ — Engineering Document Intelligence

DrawingIQ is a full-stack web application that transforms engineering drawing PDFs and Bills of Materials into structured, queryable data. Upload any technical PDF and the AI extracts dimensions, BOM items, GD&T callouts, and title block metadata — displayed in a side-by-side review UI with bounding-box highlighting.

---

## Architecture

```
Browser (React + Vite)
        │
        │  HTTP / REST
        ▼
NestJS Backend (port 3001)
        │
        ├── BullMQ Queue (Redis)
        │       │
        │       └── Worker Process
        │               │
        │               ├── pdf2pic  → page rasterisation
        │               │
        │               ├── Gemini 1.5 Flash API  (primary)
        │               └── Groq LLaMA 3.2 Vision (fallback)
        │
        ├── PostgreSQL  (job + extraction storage)
        └── Redis       (queue + worker coordination)
```

---

## Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, react-pdf  |
| Backend   | NestJS 10, BullMQ, Multer                |
| Database  | PostgreSQL 16 + Prisma ORM               |
| Queue     | Redis 7 + BullMQ                         |
| AI (1)    | Google Gemini 1.5 Flash (free tier)      |
| AI (2)    | Groq LLaMA 3.2 Vision (free fallback)    |
| Infra     | Docker Compose                           |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop)
- **Free Gemini API key** — [aistudio.google.com](https://aistudio.google.com) (no credit card)
- **Free Groq API key** — [console.groq.com](https://console.groq.com) (no credit card)

---

## Setup & Running

### 1. Clone the repo

```bash
git clone <repo-url>
cd drawingiq
```

### 2. Configure API keys

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in your keys:

```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

### 3. Start Docker services (Postgres + Redis)

```bash
docker compose up postgres redis -d
```

### 4. Install ImageMagick (required for pdf2pic rasterisation)

**macOS:**
```bash
brew install imagemagick
```

**Ubuntu / Debian:**
```bash
sudo apt-get install -y imagemagick ghostscript
```

**Windows:**
Download the installer from [imagemagick.org/script/download.php](https://imagemagick.org/script/download.php)

### 5. Start the backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

Backend runs at **http://localhost:3001**

### 6. Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### 7. Open the app

Navigate to **http://localhost:5173** in your browser.

---

## How to Use

1. **Upload** — Drag & drop or click to select an engineering drawing PDF (max 50 MB)
2. **Wait** — Watch the AI extract data in real time (QUEUED → PROCESSING → EXTRACTING → DONE)
3. **Review** — Explore the side-by-side PDF viewer and extracted data table; hover rows to highlight regions on the drawing

---

## Where to Get Free Test PDFs

- **GrabCAD** — [grabcad.com/library](https://grabcad.com/library) (search "engineering drawing", filter by PDF)
- **Google search** — `engineering drawing PDF with BOM filetype:pdf`

---

## Checklist

- [ ] Docker postgres running on 5432
- [ ] Docker redis running on 6379
- [ ] Backend running on 3001 with no errors
- [ ] Frontend running on 5173
- [ ] Can upload a PDF at localhost:5173
- [ ] Job moves QUEUED → PROCESSING → EXTRACTING → DONE
- [ ] Gemini API call logged in backend terminal
- [ ] Review page shows extracted data
- [ ] Hovering a BOM row highlights region on PDF
- [ ] JSON export downloads a file
- [ ] CSV export downloads a file
- [ ] Delete job removes it from the list
