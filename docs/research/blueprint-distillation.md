# Layout Brief — Page-by-Page Structure and Content Blocks

**What this is:** a build-ready distillation of the portfolio blueprint's menu, layout and content parts, written for the person implementing the Astro routes. It answers one question per route: what sections, in what order, with which copy fields, in which states.

**Scope and premises**
- Source: `AI-Portfolio-Website-Blueprint-v4-Research-Upgraded.md` (v4.0, October 2026) — Part 3 §3.1–3.2 (lines 457–569), Part 5 §5.1–5.3 (lines 734–1375), Part 7 §7.1–7.7 (lines 1496–~1817; the tail of that range is the typography system, not page content). Three later sections of the same document bind these layouts and are included where they change a requirement: §15.3 (case-study fields), §15.6 (UX state matrix), §15.7 (search, comments, `/now`). Every borrowed item is tagged with its section.
- Target: static Astro build, content in zod collections, no server at request time. Where the blueprint assumes a live API (GitHub, reading tracker, model inference), the static substitute is flagged.
- Paths: only `/now`, `/resume`, `/about` and `/admin` are named literally in the source. Every other path below is a **proposed** slug derived from the menu label and is marked `proposed`; renaming is an implementation decision, not a spec change.
- Precedence used when the document contradicts itself: Part 7 (content detail) wins over Part 5 (wireframe sketch) wins over Part 3 (menu tree). Each conflict is listed in §16 rather than silently resolved.

**Version**

| Date | Version | Change |
|---|---|---|
| 2026-10-24 | 1.0 | First distillation of Parts 3, 5, 7 + cross-part constraints; open questions registered. |

**Legend**

| Tag | Meaning |
|---|---|
| `R` | Required field — page is incomplete without it |
| `C` | Conditional — only rendered when its condition holds |
| `A` | Auto-generated at build time or from a synced data file |
| `OQ-nn` | Ambiguous in the source; see §16 |
| `§x.y` | Source section in the blueprint |

---

## 1. Route inventory

Ten menu entries in Part 3 §3.2 (Home, Now, About, Projects, AI Lab, Blog, Gallery, Resume, Ask My AI, Contact), of which one (Project Detail) is a child route and one (Now) is absent from both the primary nav graphic and Part 5.

| # | Route | Nav label (§3.1) | Page type | Source for structure | Islands / JS |
|---|---|---|---|---|---|
| 1 | `/` | Home | Static | §5.3 Home, §7.1 | chat widget (named in §15.8) |
| 2 | `/now` | not in nav graphic; §15.7 says link "alongside `/about`" | Static, CMS singleton | §3.2 Now, §15.7 | none |
| 3 | `/about` | About | Static | §5.3 About, §7.2 | Leaflet map — interactive, not on the §15.8 list |
| 4 | `/projects` | Projects | Static + client filter | §5.3 Projects, §7.3 | filter — not on the §15.8 list (OQ-06) |
| 5 | `/projects/[slug]` `proposed` | — (child) | Static, one page per project | §5.3 Project Detail, §7.3, §15.3 | none |
| 6 | `/ai-lab` | AI Lab | Static shell + 3 demo islands | §5.3 AI Lab, §7.4 | 3 demo islands (named in §15.8) |
| 7 | `/blog` | Blog | Static + search island | §5.3 Blog, §7.5 | search (named in §15.8) |
| 8 | `/blog/[slug]` `proposed` | — (child) | Static, one page per post | not in Part 5 — see OQ-08 | giscus comments (named in §15.7) |
| 9 | `/gallery` | Gallery | Static + lightbox island | §5.3 Gallery, §3.2 | lightbox — not on the §15.8 list (OQ-16) |
| 10 | `/resume` | Resume | Static (+ print CSS) | §5.3 Resume, §7.6, §13.5 | none |
| 11 | `/ask-my-ai` `proposed` | Ask My AI | Chat island | §5.3 Ask My AI | chat (named in §15.8) |
| 12 | `/contact` | Contact | Static form + embed | §5.3 Contact, §7.7 | form island + Calendly embed (third party, OQ-21) |
| 13 | `/blog/tag/[tag]`, `/blog/category/[category]` `proposed` | — (children of Blog) | Static index pages | only implied by §3.2 Tags Cloud / Categories | none |
| 14 | `/404` `proposed` | — | Static | not specified — OQ-09 | none |

Nav membership differs between the three places it is drawn (§3.1 nine items; §5.2 desktop six items + theme + chat toggles; §5.2 mobile eight items + Connect block). Treated as OQ-01.

---

## 2. Global chrome

### 2.1 Responsive frame (§5.1)

| Breakpoint | Nav | Content grid |
|---|---|---|
| Desktop ≥1200px | fixed bar, inline links | max-width 1200px, centred, auto margins |
| Tablet 768–1199px | hamburger | 2-column grid |
| Mobile <768px | hamburger | 1 column |

Nav is fixed, described as "Glassmorphic", `z-index: 100` (§5.3 Home).

### 2.2 Navigation bar (§5.2)

| Element | Desktop | Mobile (expanded) |
|---|---|---|
| Brand | `[Logo/Name]` — "Initials in gradient or custom monogram" | `[Logo]` |
| Links | Home, About, Projects, AI Lab, Blog, Gallery | Home, About, Projects, AI Lab, Blog, Gallery, Resume, Contact |
| Utility | Dark/Light toggle `[🌙/☀️]`, AI Chat toggle `[💬]` | `── Connect ──` block: `[GitHub] [LinkedIn] [Email] [Twitter]`, then `[🌙/☀️ Toggle]` |
| Close control | — | `[✕]` |

`R` Every nav item must exist as a route or be removed; the menu cannot advertise a dead link (§3.1 is the canonical item list).

### 2.3 Footer (§5.3 Home)

| Field | Content |
|---|---|
| `[Name]` | owner name |
| Quick Links | link column |
| Social Icons | icon row |
| Signature | `"Built with AI & ❤️"` |
| Copyright | `© 2025` — render current year, see OQ-10 |
| Freshness | `Last auto-updated: [timestamp]` — `A` from heartbeat commit (§3.2, §15.7) |
| Status | `[Status: 🟢]` availability dot |

### 2.4 AI chat widget

Fixed, bottom-right, label `💬 Ask My AI` (§5.3 Home). Lazy-loaded on first open (§15.8) so the landing page is effectively zero-JS.

---

## 3. `/` — Home

**Purpose:** prove competence in one screen, then route to Projects, Blog, or the chatbot. Structure fixed by §5.3; copy fixed by §7.1.

| # | Section (doc name) | `R` copy fields | States | Source |
|---|---|---|---|---|
| 1 | `HERO SECTION` (100vh) | `HEADLINE`; `ROTATING SUBTITLE` (typing animation, 5 strings); `TAGLINE`; `SUBTEXT`; `PRIMARY CTA`; `SECONDARY CTA`; portrait (3D avatar or professional photo, gradient border); background animation | typing + background motion must respect `prefers-reduced-motion` (§15.6) | §5.3, §7.1 |
| 2 | `Quick Stats Bar` | 3–4 metrics, each label + value | `A`; values may be static fallback — OQ-02 | §5.3, §7.1 |
| 3 | `01. Featured Projects` | 3 cards: image, `Title`, `Description`, tags, `[View →]` | fewer than 3 qualifying projects → OQ-03 | §5.3, §7.1 |
| 4 | `02. Skills & Expertise` | radar chart + 6 skill categories | chart needs JS — OQ-04 | §5.3, §7.1 |
| 5 | `03. What I'm Up To` | activity feed, 5 item types | `A`; stale-data badge per §15.6 | §5.3, §7.1 |
| 6 | `04. Latest from the Blog` | 1 large card + 2 small cards | no posts published → OQ-03 | §5.3 |
| 7 | `05. Let's Connect` | availability sentence + 3 CTAs | — | §5.3 |
| 8 | `FOOTER` | §2.3 | — | §5.3 |

### 3.1 Exact copy

| Field | Value |
|---|---|
| `HEADLINE` | `"Hi, I'm [First Name] 👋"` |
| `ROTATING SUBTITLE` | `"AI/ML Engineer"` → `"Software Engineer"` → `"Data Scientist"` → `"Problem Solver"` → `"Lifelong Learner"` |
| `TAGLINE` | `"I build intelligent systems that solve real problems — and I built this portfolio as proof."` |
| `SUBTEXT` | `"CSE Graduate \| Associate Data Scientist \| Prompt Engineer \| Currently seeking opportunities"` |
| `PRIMARY CTA` | `"Explore My Work ↓"` |
| `SECONDARY CTA` | `"Ask My AI About Me 💬"` |
| Section 5 quote | `"I'm currently looking for opportunities in AI/ML and Software Engineering"` |
| Section 5 CTAs | `[Download Resume]`, `[Send Email]`, `[Ask My AI 💬]` |

### 3.2 Stats bar — two competing metric sets

| §7.1 (content spec) | §5.3 (wireframe) |
|---|---|
| `📂 X Projects Built` | `🔨 X+ Projects` |
| `💻 Y,000+ Lines of Code` | `📊 Y+ Commits` |
| `📜 Z Certifications` | `📜 Z Certs` |
| `📚 W Books Read This Year` | — |

Marked `(Auto-calculated from APIs)`. Pick one set — OQ-02.

### 3.3 Featured project selection rule (§7.1)

Show the top 3 most impressive projects. Criteria, in this order:
1. Has a live demo
2. Uses the most relevant tech stack
3. Demonstrates problem-solving ability

### 3.4 Skills categories — exact names and members (§7.1)

| Category (exact) | Members (exact) |
|---|---|
| `🧠 AI & Machine Learning` | Python, PyTorch, scikit-learn, NLP, Deep Learning, Machine Learning Algorithms |
| `💻 Software Engineering` | C, C++ (OOP, DSA), Java (Basic), FastAPI, Git |
| `📊 Data Science` | Pandas, NumPy, Matplotlib, Plotly, Seaborn, Data Analysis, Data Visualization |
| `🌐 Web Technologies` | HTML, CSS, PHP (Basic), REST APIs |
| `🤖 AI Tools & Prompt Engineering` | Claude, GPT, Prompt Engineering, AI Integration, Automation |
| `📋 Soft Skills` | Adaptive Learning, Research, Technical Writing, Problem Solving, Continuous Improvement |

### 3.5 Activity feed item types (§7.1)

| Icon | Event template | Time format |
|---|---|---|
| `🔨` | `Pushed to [repo]` | `2 hours ago` |
| `📖` | `Started reading "[book]"` | `Today` |
| `📊` | `Completed [module] on DataCamp` | `Yesterday` |
| `📸` | `Added [n] photos to gallery` | `2 days ago` |
| `✍️` | `Published: "[post title]"` | `Last week` |

Each row = icon + sentence + relative timestamp. `A` from APIs; static build consumes a committed snapshot (§15.6 requires the last-synced snapshot to render immediately).

---

## 4. `/now` — Now

**Purpose:** answer "what is this person focused on right now" (nownownow standard, §15.7).

| # | Section (doc name) | `R` copy fields | Notes |
|---|---|---|---|
| 1 | `Current Focus` | "what I'm doing now" — free text | §3.2 |
| 2 | `Last-updated stamp` | date, `A` from the weekly heartbeat commit | §3.2, §15.7 |

Rules: linked in nav alongside `/about` (§15.7); CMS singleton editable from a phone; config gate `now_page: true`; its value is freshness — a stale now-page is worse than none (§15.7). No Part 5 wireframe exists, so section count, ordering beyond the two named blocks, and copy length are OQ-05.

---

## 5. `/about` — About

**Purpose:** convert a reader who liked the work into someone who trusts the person. §7.2 is explicit that the narrative must reframe inexperience as growth mindset and intellectual humility.

| # | Section (doc name) | `R` copy fields | States | Source |
|---|---|---|---|---|
| 1 | `STORY SECTION` (2-column) | pull quote; `[2-3 paragraphs of authentic personal narrative]`; professional photo ("Natural, warm not corporate"); `Fun fact:` line | — | §5.3, §7.2 |
| 2 | `Education` | vertical `TIMELINE`: year, institution, degree; per-entry bullets `Key Coursework:`, `GPA:`, `Notable:`; terminal nodes `Graduation`, `Continuous Learning Phase` | — | §5.3 |
| 3 | `Certifications` | 4 cards, each with 6 fields (§5.2 below) | verify link optional per credential | §5.3, §7.2 |
| 4 | `Beyond Code` | `📚 Currently Reading`; `📸 Latest Photo`; `🎌 Anime Corner`; `🗺️ TRAVEL MAP` | each block `C` — omit if no data | §5.3, §7.2 |
| 5 | `Core Values` | 3 cards: `🌱 Growth`, `🎯 Purpose`, `🤝 Impact`, each with a one-line quote | — | §5.3 |

### 5.1 Narrative copy (§7.2)

Five paragraphs are supplied verbatim in the source, opening `"I'm a Computer Science & Engineering graduate who sees technology through the lens of curiosity — not just capability."` and closing `"What I'm looking for: A team where I can contribute my AI/ML skills, grow alongside brilliant people, and build systems that actually matter."` Ship as written or as the zod default; do not paraphrase the opening and closing lines.

Four content principles the copy must satisfy (§7.2): does not claim "I'm the best"; uses specific examples instead of vague claims; integrates hobbies naturally; addresses the job search directly.

### 5.2 Certification card fields (§7.2)

| Field | Note |
|---|---|
| `CERTIFICATION TITLE` | exact |
| `Issuing Organization` | exact |
| `Date Earned` | exact |
| `[Badge Image]` | asset |
| Brief | `"What I learned and how I apply it"` — one short paragraph |
| `[Verify Credential →]` | external link |

Cards named in §5.3: DataCamp / `Assoc DS`; `Prompt Eng` / `Certified`; `ML Course` / `Prog Hero`; `Claude 101` / `+ MCP`.

### 5.3 Beyond Code blocks (§5.3, §7.2)

| Block | Fields |
|---|---|
| `📚 Currently Reading` | book cover, title, author, `★★★★★ (My Rating)`, `Previously Read:` list (3 shown), `[View Full List →]` |
| `📸 Latest Photo` | one image `A` pulled from gallery, `[View Gallery→]` |
| `🎌 Anime Corner` | `Currently:` `[Current anime]` |
| `🗺️ TRAVEL MAP` | interactive map of places visited / want to visit, Leaflet + OpenStreetMap |

Reading block also carries `2025 Goal: X/Y books read` (§7.2) — hard-coded year, see OQ-10.

### 5.4 Education timeline nodes (§5.3)

`2020` B.Sc. CSE — university, `Key Coursework: ML, AI, Algorithms, DSA`, `GPA: X.XX`, `Notable:`; `2024` Graduation; `2024-25` Continuous Learning Phase with four bullets: DataCamp Associate Data Scientist, Prompt Engineer Certification, ML Course (Programming Hero), Claude 101 + MCP Course.

---

## 6. `/projects` — Projects index

**Purpose:** let a reviewer filter to the two or three projects relevant to their role, then open one case study.

| # | Section (doc name) | `R` copy fields | States | Source |
|---|---|---|---|---|
| 1 | Page intro | `"Every project is a problem I chose to solve."` | — | §5.3 |
| 2 | `FILTER BAR` | type filters; `Sort:` control; `Search:` input | filter returns 0 → OQ-06 | §5.3 |
| 3 | `FEATURED` (full-width spotlight) | `★ FEATURED PROJECT` badge; preview (live preview / screenshot / GIF); `Project Title`; description paragraph; tech tags; `[Live Demo] [GitHub] [→]` | none pinned → hide section | §5.3 |
| 4 | `PROJECT GRID` (3 / 2 / 1 columns) | per card: preview, `Title`, brief description, tags, GitHub link | — | §5.3, §7.3 |
| 5 | `Auto-Generated Summary` | `📊 Project Analytics`: `Total Projects`, `Languages Used`, `Stars`, `Most Used Tech`, `Active Projects`, `Last Contribution` | `A`; API failure → OQ-07 | §5.3 |

### 6.1 Filter bar values (§5.3)

`[All] [ML/AI] [Web] [Data Science] [Tools] [University]` · `Sort: [Most Recent ▼]` · `Search: [🔍 ____________]`

### 6.2 Project card fields (§7.3, supersedes the sketch)

| Field | Requirement |
|---|---|
| `Title` | "Clear, descriptive" |
| One-line summary | "What does it DO?" |
| `Screenshot/GIF preview` | asset |
| `Tech stack tags` | chips |
| `Status badge` | one of `Active` / `Complete` / `In Progress` |
| `Links` | `Demo`, `GitHub`, `Documentation` — each optional |
| `Auto-generated "Last updated" badge` | `A` |

### 6.3 Grouping

§3.2 groups the index as `Featured Projects (Pinned)`, `University Projects`, `Personal Projects`, `Open Source Contributions`. §5.3 replaces grouping with a filter bar plus one featured spotlight and one grid. Conflict → OQ-06. Content rule from §15.3 that still applies: three to five polished projects with live demos beat ten tutorial derivatives.

---

## 7. `/projects/[slug]` — Project detail (case study)

**Purpose:** survive the thirty-minute interview conversation — problem, decisions, trade-offs, what you would change (§15.3).

Section order below merges §5.3 (wireframe) with §7.3 (content) and §15.3 (mandatory additions). §7.3 is the binding order; §5.3's hero and link row are its header.

| # | Section | `R` copy fields | Condition |
|---|---|---|---|
| 0 | Back link | `[← Back to Projects]` | always |
| 1 | Title block | `PROJECT TITLE`; `[Tag] [Tag] [Tag]` | always |
| 2 | Media | `HERO IMAGE / LIVE DEMO EMBED / VIDEO` | one of three |
| 3 | Link row | `[🔗 Live Demo]`, `[📂 GitHub]`, `[📄 Paper/Docs]` | each `C` |
| 4 | `Overview` | 2–3 paragraphs: what problem it solves; why I built it; what makes it interesting | always |
| 5 | `Technical Deep Dive` / `Technical Architecture` | architecture diagram; `Key technical decisions and why`; `Data pipeline explanation`; `Model performance metrics` | diagram always; pipeline + metrics `C` if ML |
| 6 | `Tech Stack` | icons + names | always |
| 7 | `Challenges & Solutions` | repeated triple: `"Challenge: [Specific problem]"`, `"Approach: [How I thought about it]"`, `"Solution: [What I implemented]"` | ≥1 entry |
| 8 | `Outcomes` | result + named measurement method: tool, sample size, baseline (§15.3) | `R` per §15.3 |
| 9 | `Evidence` | links to commit history and README decisions (§15.3) | `R` per §15.3 |
| 10 | `Key Learnings` | what I learned; challenges I overcame; `"If I rebuilt this, I would..."` | always |
| 11 | `What I'd do differently` | explicit field — "the honesty marker reviewers read as seniority" (§15.3) | `R` per §15.3 |
| 12 | `Demo/Screenshots/Video` | gallery or embed | `C` |
| 13 | `Related Projects` | 2 cards | `C` if fewer than 2 siblings |

Field-name discipline: §5.3 says `Key Learnings` and lists `"What I'd do differently"` as its third bullet; §7.3 says `Key Learnings` → `"If I rebuilt this, I would..."`; §15.3 says `What I'd do differently` is an explicit field and `Outcomes` + `Evidence` are mandatory. Treat `What I'd do differently` as its own section (it is the §15.3 requirement) and keep the §7.3 sentence as its prompt. OQ-11 records the double-listing.

Content rule (§7.3): reframe every project as a learning vehicle, not a product — state what was built, the measurable result, and what the real learning was. Draft copy style shown in the source: `"Built a sentiment analysis pipeline from scratch — training a custom model on 50k movie reviews, achieving 87% accuracy..."`.

---

## 8. `/ai-lab` — AI Lab

**Purpose:** let a visitor run three small models and see that they were built and deployed by the owner.

| # | Section (doc name) | `R` copy fields | States |
|---|---|---|---|
| 1 | Page intro | headline `"Try my AI models. Yes, I built and deployed these."`; longer intro in §7.4 | — |
| 2 | `🧠 SENTIMENT ANALYZER` | label `"Type or paste any text:"`; textarea; `[Analyze →]`; result line `Result: 😊 Positive (92.3% confidence)`; confidence bar; `── How it works ──` block | input empty, inference pending, inference error — OQ-12 |
| 3 | `🖼️ IMAGE CLASSIFIER` | `[Drag & drop image or upload]`; `[Result display with confidence bars]`; `[How it works expandable section]` | no file, wrong type, pending, error — OQ-12 |
| 4 | `📊 DATA VISUALIZATION PLAYGROUND` | `[Choose a dataset]`; `[Choose chart type]`; interactive plot; `[Auto-generated insights using LLM]` paragraph | dataset unselected, chart unselected, insight generation failed — OQ-12 |
| 5 | `"How This Works" Explanation` | per-demo `How It Works` + stack, or one page-level block | §3.2 lists it as a top-level child; §5.3/§7.4 place it inside each demo — OQ-13 |

### 8.1 Per-demo required fields (§7.4)

| Demo | `Description` | `How It Works` | `Interactive element` | Extra |
|---|---|---|---|---|
| Sentiment Analyzer | "Type any text and this model will analyze its emotional tone using a fine-tuned NLP model." | built with PyTorch, trained on `[dataset]`, deployed via FastAPI | text input → result | `Technical note:` latency, model size, accuracy; `[View Source Code →]` |
| Image Classifier | "Upload any image and the model will identify what's in it." | transfer learning with ResNet-18, fine-tuned on `[dataset]` | image upload → classification | source code link |
| Data Viz Playground | "Select a dataset and chart type. The AI will generate insights automatically." | Plotly for visualization, Claude API for natural-language insights | dataset + chart selection | auto-generated insight paragraph |

`Model:` / `Training:` / `Stack:` line labels are drawn in §5.3 (`Model: Fine-tuned BERT | Training: IMDb dataset | Stack: PyTorch → FastAPI → This UI`) — these are example values, not fixed claims; they must match what the demo actually runs.

Intro copy conflict: §5.3 one-liner vs §7.4 four-sentence paragraph. Pick one, OQ-14.

---

## 9. `/blog` — Blog index

**Purpose:** show thinking and teaching ability; the index doubles as proof that the owner writes.

| # | Section (doc name) | `R` copy fields | States |
|---|---|---|---|
| 1 | Page intro | `"Notes from my learning journey — some auto-generated from my notebooks, all reviewed by me."` | — |
| 2 | `CATEGORY TABS` | `[All] [Technical] [Learning Journey] [Book Reviews] [Notes]` | tab with 0 posts → hide, OQ-06 |
| 3 | `FEATURED POST` (full-width) | large image; title; preview text; `📅 Date \| ⏱️ 5 min read \| 🏷️ Machine Learning`; `[Read →]` | no posts → OQ-03 |
| 4 | `POST LIST` | per row: title; preview excerpt; `📅 Date \| ⏱️ Read time \| Tags` | — |
| 5 | Sidebar | `Search [🔍____]`; `Tags [cloud]`; `Archive by month` | search: §15.6 states |
| 6 | `AI-Generated Note` | `"Some posts are auto-generated from my Jupyter notebooks using AI. They're marked with 🤖. I review all content before publishing."` | hide if no 🤖 posts |

### 9.1 Categories and mix (§7.5)

| Pillar | Share | Tab label (§5.3) |
|---|---|---|
| `TECHNICAL TUTORIALS` | 40% | `Technical` |
| `LEARNING JOURNEY` | 30% | `Learning Journey` |
| `BOOK REVIEWS` | 20% | `Book Reviews` |
| `NOTES & THOUGHTS` | 10% | `Notes` |

§3.2 names them `Technical / Tutorials`, `Learning Journey`, `Book Reviews`, `Notes & Thoughts`. Shipped taxonomy needs one spelling — OQ-15.

`R` Every auto-generated post carries the `🤖` marker (§5.3, §7.5). Auto-generation pipeline named in §7.5: Jupyter notebook → post; GitHub commit summary → "This Week in My Code"; reading-list update → "Currently Reading" micro-post.

Search is Pagefind (§15.7), static index built at build time, `/admin` excluded. `R` Search states (§15.6): empty `"No hits — try fewer words"`; success shows count + highlighted matches; loading is instant (local index).

---

## 10. `/blog/[slug]` — Post detail

No Part 5 wireframe exists for this route; OQ-08. Requirements that are stated:

| Requirement | Source |
|---|---|
| `📅 Date \| ⏱️ Read time \| Tags` metadata row | §5.3 post row |
| Category badge from the four-pillar taxonomy | §7.5 |
| `🤖` marker when AI-generated, plus the review disclaimer | §5.3, §7.5 |
| `BlogPosting` JSON-LD: `headline`, `datePublished`, `dateModified`, `author` (Person, ties to site-level Person block), `image` = the post's OG card | §15.7 |
| giscus comments below post, config `comments: true \| per_post \| false`, `Announcements`-type category, hideable per post | §15.7 |
| Included in RSS/Atom feed | §15.7 |
| Comments states: loading = skeleton rows; empty = `"Be the first — comment on GitHub"`; error = GitHub auth failure note + retry | §15.6 |

Body content model, table of contents, prev/next, and reading-progress are not specified anywhere in the read sections — do not add without a decision.

---

## 11. `/gallery` — Gallery

**Purpose:** show visual attention; doubles as evidence for the photography interest claimed on About.

| # | Section (doc name) | `R` copy fields | States |
|---|---|---|---|
| 1 | Page intro | `"Perspectives I capture — auto-tagged by my AI model."` | — |
| 2 | `FILTER` | `[All] [Travel] [Nature] [Urban] [People] [AI-Tagged]` | 0 matches → OQ-06 |
| 3 | `MASONRY GRID` | photo, alt text, dimensions, LQIP | see state table |
| 4 | `LIGHTBOX` (on click) | full-size photo; prev/next; AI tags; camera; location; AI description | see 11.2 |

### 11.1 Grid states (§15.6)

| Loading | Empty | Error | Success |
|---|---|---|---|
| blurred LQIP thumbnails | `"Photos coming soon"` (admin-editable copy) | broken image → placeholder + alt | lightbox with EXIF story |

### 11.2 Lightbox fields (§5.3)

| Element | Content |
|---|---|
| Controls | `[← Prev]`, `[Full-size Photo]`, `[Next →]` |
| `AI Tags:` | `#sunset #mountains #travel #warm-tones` style chip row |
| `Camera:` | `[If available from EXIF]` |
| `Location:` | `[If available]` |
| `AI Description:` | one sentence, e.g. `"A golden sunset over mountain peaks..."` |

Rules: keyboard-operable with `aria-live`; respects `prefers-reduced-motion` (§15.6). Escape-to-close, arrow-key navigation, focus trap and swipe are **not** specified — OQ-16. `"Shot with"` metadata is named in §3.2 and by `Camera:` here; treat them as the same field.

---

## 12. `/resume` — Resume

**Purpose:** one page that serves both a recruiter skimming and a print/PDF download, driven from one data file.

| # | Section (doc name) | `R` copy fields | Condition |
|---|---|---|---|
| 1 | Header actions | `[📄 Download PDF]`; `[Last auto-updated: Jan 15, 2025]` | always |
| 2 | `Template Switch` | tabs `Standard` / `Europass` | `C` — see 12.1 |
| 3 | `INTERACTIVE TIMELINE` | year nodes with label (`Start CSE`, `Project 1`, `Project 2`, `Internship`, `Grad`, `Certs`, `Job Hunt`); `[Click any node for details]` | always |
| 4 | `SKILLS MATRIX` | table: `Category` / `Skill` / `Level` / `Evidence` | always |
| 5 | `AVAILABILITY` | availability line; `📍 Open to:`; `🎯 Looking for:` | always |

### 12.1 Template switch behaviour (§13.5)

| Config | Visitor sees |
|---|---|
| `active` set, `allow_visitor_toggle: false` | exactly one resume — admin fully defines it; no tabs |
| both templates enabled, toggle on | two tabs (`Standard` / `Europass`) + one PDF download button **per enabled template** |

§3.2 annotates the switch as `(Standard / Europass — admin-defined)` and the download as `(Auto-generated, per enabled template)`. Rationale to keep in the page copy or README: Standard is ATS-safe and the default for tech roles; Europass is for EU public-sector, institutional, academic and Erasmus+ applications (§13.4). PDF filenames: `Name-Role-Resume.pdf`, `Name-Europass-CV.pdf` (§13.6).

### 12.2 Skills matrix columns (§5.3)

`Category` groups shown in the sketch: `Programming`, `AI/ML`, `Data Science`. Rows pair a `Skill` with a `Level` bar and an `Evidence` link whose label is the evidence type — `[GitHub]`, `[LeetCode]`, `[Projects]`, `[DataCamp]`. Evidence links are the point of the table; a level with no evidence link should not ship.

### 12.3 Availability block copy (§5.3)

`🟢 Currently available for full-time opportunities` · `📍 Open to: Remote / [City] / Relocation` · `🎯 Looking for: AI/ML Engineer, Data Scientist, Software Engineer, AI Engineer roles`

### 12.4 PDF content structure (§7.6)

Ordered: `[NAME]` → `[Contact Info: Email | LinkedIn | GitHub | Portfolio URL]` → `SUMMARY` (supplied paragraph: "CSE graduate with hands-on experience in Machine Learning, Deep Learning, and Software Engineering…") → `TECHNICAL SKILLS` with six labelled lines (`Languages`, `ML/AI`, `Data`, `Web`, `Tools`, `AI Tools`) → `CERTIFICATIONS` (4) → `PROJECTS` ("Auto-pulled from projects page, top 4-5") → `EDUCATION` (`B.Sc. in Computer Science & Engineering`, university, year).

`R` Web page and PDF must render from the same source record so they cannot drift (§13.2 single `resume.json`).

---

## 13. `/ask-my-ai` — Chatbot

**Purpose:** a working RAG demo that also answers recruiter questions in the owner's absence.

| # | Section (doc name) | `R` copy fields |
|---|---|---|
| 1 | Page intro | `"I trained an AI on my resume, projects, and experiences. Ask it anything about me. This is a project in itself."` |
| 2 | `CHAT INTERFACE` | greeting bubble; message list; input `"Type your question..."`; `[Send]` |
| 3 | `SUGGESTED QUESTIONS` | 4–5 chips, exact strings below |
| 4 | `── How I Built This ──` | `Built with:` Claude API + RAG (ChromaDB) + FastAPI; `Knowledge base:` Resume, project docs, blog posts; `[View Source Code →]` |
| 5 | Provenance note | "This AI was built by me" (§3.2) |

### 13.1 Suggested question strings

| §5.3 | §15.3 addition |
|---|---|
| `"Tell me about his projects"` | `"walk me through how this portfolio was built"` |
| `"What are his strongest technical skills?"` | |
| `"Why should we hire him?"` | |
| `"What's he currently learning?"` | |

### 13.2 States (§15.6)

| Loading | Empty | Error | Success |
|---|---|---|---|
| streaming placeholder + `aria-live` | greeting + suggested questions | `"AI is resting — email me"` card | reply + follow-up chips |

`R` Chat is an island, lazy-loaded on first open (§15.8). Greeting copy given in §5.3: `"Hi! I'm [Name]'s AI assistant. I've been trained on their portfolio, projects, and experiences. What would you like to know?"`

OQ-17: the page prose is first person ("I trained an AI") while the bot speaks in third person ("his projects", "their portfolio"). One voice must be chosen and applied to every string.

---

## 14. `/contact` — Contact

**Purpose:** turn interest into a message or a booked call, with honest availability.

| # | Section (doc name) | `R` copy fields |
|---|---|---|
| 1 | Heading | §7.7 `"Let's Build Something Together"` (sketch: `Let's Connect` — OQ-18) |
| 2 | Subtext | `"I'm currently looking for opportunities in AI/ML Engineering, Data Science, and Software Engineering. Whether you have a role, a question, or just want to connect — I'd love to hear from you."` |
| 3 | `AVAILABILITY STATUS` (Auto-updated) | `🟢 Open to opportunities`; `📍 Location: [City/Remote]`; `⏰ Response time: Usually within 24 hours` |
| 4 | `CONTACT FORM` | `Name` (required), `Email` (required), `Subject` (dropdown), `Message` (required), `[Send Message →]` |
| 5 | `QUICK LINKS` | `📧 email@example.com`, `💼 linkedin.com/in/...`, `🐱 github.com/...`, `🐦 twitter.com/...` |
| 6 | `📅 BOOK A CALL` | Calendly embed, `Pick a time slot` |
| 7 | Availability badge | `🟢 Available for hire` |

### 14.1 `Subject` dropdown options (exact, in order)

`Job Opportunity` · `Freelance Project` · `Collaboration` · `Speaking/Workshop` · `Just Saying Hi`

### 14.2 Form states (§15.6)

| Loading | Error | Success |
|---|---|---|
| button → pending state | inline field errors + provider failure retry | `"Sent — reply within 24h"` confirmation |

Empty state is `n/a` in the source matrix. OQ-19: pre-submit validation copy, the success region's `aria-live` wording, and whether the Calendly embed loads on interaction (JS budget) are unspecified.

---

## 15. Cross-route requirements

### 15.1 State matrix (§15.6) — applies to every dynamic surface

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Chatbot | streaming placeholder + aria-live | greeting + suggested questions | "AI is resting — email me" card | reply + follow-up chips |
| Activity feed | last-synced snapshot renders immediately (static) | "First activity lands soon" | stale data + honest "last synced" badge | auto — no ceremony |
| Gallery | blurred LQIP thumbnails | "Photos coming soon" (admin-editable) | broken image → placeholder + alt | lightbox with EXIF story |
| Search (Pagefind) | instant (local index) | "No hits — try fewer words" | n/a (client-side) | count + highlighted matches |
| Comments (giscus) | skeleton rows | "Be the first — comment on GitHub" | GitHub auth failure note + retry | comment appears |
| Contact form | button → pending state | n/a | inline field errors + Resend failure retry | "Sent — reply within 24h" |

Three governing rules: skeletons over spinners where layout is known; feedback within 100 ms; empty states are content, not chrome — written in the site's voice, editable in the CMS, and each either offers a next action or honestly explains the absence.

### 15.2 Accessibility and motion

Keyboard-operable custom widgets with `aria-live` announcements; every animation respects `prefers-reduced-motion` (§15.6). The site's own contract adds a11y ≥95, which binds the radar chart, masonry grid, lightbox, chat, and filter bar.

### 15.3 JavaScript budget (§15.8)

Islands architecture: pages ship as zero-JS static HTML; §15.8 names exactly three hydrating systems — the chatbot island, the AI-Lab demo islands, the search island — and states that "everything else — hero, cards, gallery, resume — ships none". `client:visible` over `client:load` by default; every island reserves its layout box to protect CLS. Ceiling ≤ 60 KB gzip first-party JS on the worst page (home with chat). The lightbox, the projects filter, the Leaflet travel map and the Calendly embed are not on that list, so their interactivity and third-party script cost are unresolved (OQ-06, OQ-16, OQ-21).

### 15.4 Content-model implication

Every string marked `R` above is a candidate zod field or CMS singleton; every `A` value needs a committed data file so the build stays static. "Nothing hard-coded" is the Part 14 rule that makes the `Quick Stats Bar`, availability lines, empty-state copy and section intros editable.

---

## 16. OPEN QUESTION register

| ID | Question | Route | Why unresolved | Blocks build? |
|---|---|---|---|---|
| OQ-01 | Which items are in the desktop nav? §3.1 lists 9, §5.2 lists 6 (+2 toggles), §5.2 mobile lists 8. Where does `/now` sit? | global | three drawings disagree; §15.7 only says "alongside `/about`" | yes — nav component |
| OQ-02 | Which stats bar metric set — §5.3 (Projects / Commits / Certs) or §7.1 (Projects / Lines of Code / Certs / Books)? Are values live or static? | `/` | both specified; §7.1 says auto-calculated from APIs, which a static build cannot do at request time | no — placeholder values |
| OQ-03 | What renders when a collection has fewer items than its layout needs (0 featured projects, 0 posts, <3 projects, <2 related)? | `/`, `/blog`, `/projects/[slug]` | no empty-state copy for these surfaces in §15.6 | yes for build-time guards |
| OQ-04 | Skills radar is "interactive D3.js" (§5.3) but §15.8 ships no JS outside listed islands and caps at 60 KB. Static SVG, CSS-only, or a hydrated island? | `/` | direct tension between layout and engineering budget | yes — component choice |
| OQ-05 | `/now` has only two named blocks; how many sections, what schema, what copy length? | `/now` | no Part 5 wireframe; CMS singleton mentioned without fields | no — can ship two blocks |
| OQ-06 | Projects and Gallery use filters; Blog uses tabs. Do filtered/tabbed views have URLs, and what shows on zero results? §15.6 covers only Pagefind search empty. | `/projects`, `/gallery`, `/blog` | filter semantics unspecified | no |
| OQ-07 | The auto-generated analytics block (stars, languages, last contribution) needs GitHub data; if the sync is stale, show stale badge or hide? | `/projects` | §15.6 gives a stale-data pattern for the activity feed only | no |
| OQ-08 | No layout is specified for a blog post page — no hero, TOC, author box, prev/next, or reading-progress rules. | `/blog/[slug]` | Part 5 stops at the index | yes for that route |
| OQ-09 | No 404 page, no `/blog/tag/*` or `/blog/category/*` layout, no sitemap/robots page spec. | global | not in Parts 3/5/7 | no |
| OQ-10 | Footer says `© 2025`; About reading goal says `2025 Goal`. Hard-coded year or computed? | global, `/about` | blueprints written for 2025 copy, site ships 2026 | no |
| OQ-11 | `What I'd do differently` appears as a `Key Learnings` bullet (§5.3), as `"If I rebuilt this, I would..."` (§7.3), and as a standalone mandatory field (§15.3). One section or three fields? | `/projects/[slug]` | three phrasings of the same intent | no — but schema must settle it |
| OQ-12 | AI Lab demo states (empty input, pending inference, model/API failure, rate limit) are unspecified; §15.6 has no AI Lab row. | `/ai-lab` | not covered by the state matrix | yes — error path |
| OQ-13 | `"How This Works" Explanation` is a page-level child in §3.2 but an expandable per-demo block in §5.3/§7.4. | `/ai-lab` | menu tree vs layout | no |
| OQ-14 | AI Lab intro: §5.3 one-liner or §7.4 paragraph? | `/ai-lab` | two versions of the same copy | no |
| OQ-15 | Blog tab labels: `Technical` / `Notes` (§5.3) vs `Technical / Tutorials` / `Notes & Thoughts` (§3.2). | `/blog` | naming drift | no |
| OQ-16 | Lightbox keyboard contract: Escape to close, arrow keys, focus trap, swipe? | `/gallery` | only prev/next buttons drawn; a11y rules imply but do not specify | no |
| OQ-17 | Chat voice: page speaks first person, bot speaks third person ("his projects", "their portfolio"). | `/ask-my-ai` | mixed pronouns throughout §5.3 | no |
| OQ-18 | Contact heading: `Let's Connect` (§5.3) or `Let's Build Something Together` (§7.7)? | `/contact` | two versions | no |
| OQ-19 | Contact form: validation copy, success announcement wording, Calendly load strategy. | `/contact` | not specified | no |
| OQ-20 | `[Twitter]` appears in nav, quick links and footer, but the owner's known profiles are GitHub and LinkedIn only. Include, drop, or repurpose? | global, `/contact` | owner data outside the blueprint | no |
| OQ-21 | Third-party embeds (Calendly iframe, Leaflet travel map) load vendor JS that §15.8's budget does not count. Load on interaction, use a static fallback, or drop? | `/contact`, `/about` | §15.8 budgets first-party JS only | no — but affects LCP |

Ambiguities §16 records are **not** permission to invent: each resolves to either the Part 7 value (default) or a decision recorded in the repo.

---

## 17. Traceability

| Brief section | Blueprint source |
|---|---|
| §1 routes | §3.1, §3.2, plus literal paths in §13.5, §15.7 |
| §2 chrome | §5.1, §5.2, §5.3 footer, §15.8 |
| §3 Home | §5.3 Home, §7.1 |
| §4 Now | §3.2, §15.7 |
| §5 About | §5.3 About, §7.2 |
| §6 Projects | §5.3 Projects, §7.3, §15.3 |
| §7 Project detail | §5.3 Project Detail, §7.3, §15.3 |
| §8 AI Lab | §5.3 AI Lab, §7.4 |
| §9 Blog | §5.3 Blog, §7.5, §15.7 |
| §10 Post detail | §15.6, §15.7 (no layout source) |
| §11 Gallery | §5.3 Gallery, §3.2, §15.6 |
| §12 Resume | §5.3 Resume, §7.6, §13.4, §13.5, §13.6 |
| §13 Ask My AI | §5.3 Ask My AI, §15.3, §15.6 |
| §14 Contact | §5.3 Contact, §7.7, §15.6 |
| §15 cross-route | §15.6, §15.8, Part 14 |

**Not adopted from the read sections:** the Part 5 ASCII wireframes' decorative furniture (floating particles, 3D avatar as a hard requirement, gradient borders) is recorded only where it constrains build (100vh hero, fixed nav). The `Calendly` embed, `Leaflet` map and `D3` radar are kept as requirements because they are named; their free-tier/vendor status was not re-verified in this brief.
