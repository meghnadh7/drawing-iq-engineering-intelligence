# DrawingIQ

## The problem

Every manufacturing company deals with this: an engineer sends over a PDF drawing, and someone on the other end has to manually read through it and type the BOM into a spreadsheet, copy the part numbers into an ERP, pull out the tolerances for a QA checklist. It's the same tedious work every single time a drawing comes in.

The drawings have all the data right there — part numbers, quantities, materials, dimensions, GD&T callouts, title block info — but it's locked inside a PDF that no system can read. So humans end up acting as the bridge between the drawing and whatever software actually needs that data. That's slow, it introduces typos, and it doesn't scale.

DrawingIQ fixes that. You upload the PDF, the AI reads it the way an engineer would, and you get the data back in a structured format in about 15 seconds.

---

I built this because I got tired of manually pulling data out of engineering drawing PDFs. You upload a drawing, it reads it, and spits out the BOM, dimensions, GD&T callouts, and title block info as structured data you can actually use.

It uses Gemini 2.5 Flash to process the PDF in one shot — no page-by-page nonsense — and falls back to Groq LLaMA Vision if Gemini is having a bad day. Both are free with no credit card needed.

![DrawingIQ](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## What it does

You drop in a PDF engineering drawing and it gives you back:

- **BOM table** — every row, with part numbers, quantities, materials
- **Dimensions** — all the callouts on the drawing, with tolerances
- **GD&T callouts** — flatness, true position, perpendicularity etc.
- **Title block** — drawing number, revision, who drew it, company
- **Side-by-side viewer** — hover a row in the table and it highlights where that thing is on the drawing

---

## Stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — NestJS, BullMQ job queue
- **Database** — PostgreSQL + Prisma
- **AI** — Gemini 2.5 Flash (primary), Groq LLaMA 3.2 Vision (fallback)
- **Infra** — Docker, Redis

---

## Getting started

You'll need Node 20+, Docker Desktop, and two free API keys:
- Gemini — [aistudio.google.com](https://aistudio.google.com)
- Groq — [console.groq.com](https://console.groq.com)

```bash
git clone https://github.com/meghnadh7/drawing-iq-engineering-intelligence.git
cd drawing-iq-engineering-intelligence
```

Copy the env file and drop your keys in:

```bash
cp .env.example backend/.env
# edit backend/.env and add GEMINI_API_KEY and GROQ_API_KEY
```

Start the database and queue:

```bash
docker compose up postgres redis -d
```

Start the backend:

```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

Start the frontend in a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you're good.

---

## How to use it

1. Upload any engineering drawing PDF (drag and drop or click to browse)
2. Wait ~15 seconds while Gemini reads it
3. Review the extracted data on the right, with the PDF on the left
4. Download as JSON or CSV when you're happy with it

For test PDFs, [GrabCAD](https://grabcad.com/library) has thousands of real engineering drawings — search for "assembly drawing" and filter by PDF.

---

## Notes

- The free tier on Gemini allows 5 requests per minute, so don't hammer it with huge PDFs back to back
- If the PDF viewer doesn't load in the browser it's a CORS thing — the extracted data still shows up fine on the right
- Groq fallback only works for single-page rasterized images (needs ImageMagick installed)
