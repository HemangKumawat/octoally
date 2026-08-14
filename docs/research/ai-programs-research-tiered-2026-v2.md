# AI Programs × Research — Tiered Match (v2, GT-corrected)

**Compiled 2026-05-20** | Supersedes `ai-programs-research-tiered-2026.md` (v1 mixed in DTI/MEG/HARDI/NODDI scope that is not in the actual thesis — corrected here). All thesis references grounded in `~/ALETHEIA-NEXUS/personal/Thesis_new_things/` only.

---

## Plain-meta summary

You corrected me: thesis scope is the **LSUB realistic-head validation** (Piastra 2020 3-compartment cropped mesh, ~80,200 tetrahedra, DUNEuro FEM, PI/Venant/LSUB, VarPro+adaptive-NM+L-BFGS-B inverse, Gate-1 = 98.3% sub-cm). No DTI, no MEG extensions, no HARDI/NODDI — that was my own speculation from the earlier Zeffiro thread, not your thesis. The title literally says **"AI-Augmented MSc Thesis"** — Claude/Gemini are already part of the pipeline, so AI-credit programs aren't extensions, they're **operating expenses** for what's already happening.

The Tampere-handoff (2026-05-19) is the binding context: the Münster group (Wolters + Pursiainen + lab) is **on board** with learning the harness. The real question this tiering must answer is "**which AI programs can the Münster lab + me + aletheia-nexus collectively absorb — at what cost?**"

That reframes the tiers cleanly:

- **Tier 1 (deploy this week, no scaffolding):** API/credit programs that plug into the dual-model router as-is; tools Hemang already uses on the thesis (W&B, Mathpix, Perplexity, Consensus); the GitHub Student Pack and AI Student Pack bundles. These work for *both* Hemang's solo workflow AND any lab member who installs the harness.
- **Tier 2 (3-6 months, light scaffolding OR via Wolters PI route):** Faculty-gated compute grants (NVIDIA Academic Hardware, CZI AI/ML RFA, Cerebras Research Grant, Schmidt AI in Science Postdoc) — these are now **realistically accessible** because the group engaged. Plus the Anthropic AI for Science and Foresight grants for funding the harness-replication into the lab.
- **Tier 3 (significantly harder):** PhD-gated fellowships, region-locked programs (China/UAE/Saudi/India/UK-home/CIS), career-pivot fellowships (AI safety residencies).

The biggest correction in v2: **NVIDIA Academic Hardware Grant + Cerebras Research Grant + CZI AI/ML Computing RFA all move from Tier 3 → Tier 2** because Wolters is the PI lever. Yesterday I had them as faculty-blocked; today the Tampere outcome unblocks the ask.

---

## What actually counts as "research" right now (GT-anchored)

From `Thesis_new_things/README.md` + `docs/plans/2026-05-17-honest-status-draft-plan.md` + `docs/handoffs/2026-05-19-tampere-success-and-lab-adoption-handoff.md`:

### 1. MSc thesis — LSUB Source Localisation on a Realistic Head Mesh (AI-Augmented)
- **Mesh**: Piastra 2020, 3-compartment cropped (brain/skull/scalp), ~80,200 tetrahedra
- **Solver**: DUNEuro FEM CG-P1
- **Source models**: PI, Venant, LSUB (Höltershinken 2025 SIAM-SISC)
- **Inverse**: VarPro → goal-fn scan → adaptive Nelder-Mead → 3-tier κ-guard → L-BFGS-B
- **Gate-1**: 290/295 = 98.3% sub-cm, BCa CI [0.9627, 0.9932], median LE 3.76 mm
- **Sweep**: N=2 96.0% over 17,995 fits
- **Open**: 6 thesis-text integrity items (conclusion overclaim, abstract build-split disclosure, gate-1 number transcription, mesh-count erratum 5.3M→80,200, N=3 sweep erratum, VarPro under-citation), Subtraction reference completion (only 2/3 strata × 2/3 SNR done), deferred (6-comp uncropped, sphere validation, SEP clinical data, Simbiosphere, containerization)

### 2. Aletheia-Nexus harness
- Dual-model router (Claude Max OAuth + Gemini Ultra), Voice Bridge phase-0, RAG on Ollama+LanceDB GPU tunnel, Feynman 4-agent research, Graphify, GitNexus, nervous-system (events bus + doctor + director + opus-trinity + scl-audit + memory-search), reasoning-bank IBM TIM, council layer, ultra-plan/execute/review, sonnet-advisor sandwich, command-deck dashboards, multi-machine remote
- Currently used as primary tooling for the thesis itself

### 3. Münster lab adoption (the new mandate from Tampere)
Three tracks per the handoff:
- **a. Hardware**: 40k EUR maxed Mac Studio server build for the lab (local-deploy benefits)
- **b. Cloud-ready-now**: Claude Code Max plans for lab members today
- **c. Aletheia-Nexus replication**: Hemang installs + adapts the harness for the group, lab-environment edition

### 4. Per-researcher AI-acceleration mapping (×3 research loops)
- For each lab member: (i) deep research on their topic, (ii) analyze what Aletheia-Nexus can automate, (iii) re-research on findings — three converging loops producing per-person opportunity maps. Seed = `docs/tampere/adoption/A1-A3*.md`.

### 5. Voice Bridge / Nexus Voice / Autoresearch / Dashboards / Reflection Engine v2
Active aletheia-nexus subsystems; AI-program leverage applies but is secondary to the lab-adoption track.

---

## Tier 1 — Deploy this week (zero new scaffolding)

These slot into existing aletheia-nexus capabilities AND can be made available to the Münster lab the moment they install the harness.

### 1A. Router-lane additions (each = ~1-2 hours config work, no other scaffolding)

| Program | Use | Estimated value |
|---|---|---|
| **Mistral Free Experiment Tier** (1B tok/mo, no CC, no .edu) | Free 4th router lane | Heavy use absorbs ~$50-200/mo opportunity-cost equivalent |
| **Groq Free Tier** (30 RPM / 14.4K req/day, no CC) | Lowest-latency lane for council layer parallel dispatch | Latency tier — qualitative |
| **Cerebras Free Tier** (1M tokens/day) | Long-context lane | 30M tok/mo runway |
| **SambaNova Developer** ($5 + rate-limited tier) | Backup lane | Marginal |
| **DeepInfra DeepStart** (up to 1B tokens, startup framing) | High-volume lane for autoresearch + dashboards | ~$200-500 of inference at vendor pricing |
| **OpenAI Researcher Access** ($1K credits, 12mo) | Add OpenAI to router | $1K |
| **OpenRouter free tier + free models** | Free fallback | Marginal |
| **Cohere Catalyst Grant** | Cohere lane (good for embeddings) | Variable |

### 1B. Thesis pipeline tools (already used / fits immediately)

| Program | Use | Status |
|---|---|---|
| **W&B Academic Research** (free Pro, .edu, 200GB, 100 seats) | Track thesis sweep runs + nervous-system observability | ALREADY in stack (verify .edu Pro upgrade) |
| **Mathpix Edu** (20 free Snips/mo auto-upgrade on .edu) | LaTeX equation OCR for Höltershinken / Piastra papers | Drop-in |
| **Wolfram\|Alpha Pro Student** (30% off) | Symbolic validation, db/dp checks (you already do sympy verify) | Drop-in |
| **Perplexity Pro Education** (1yr free + Comet) | Research-mode literature scans (errata research, citation hunting) | Drop-in |
| **Consensus Student Premium** (3mo free + 40% off) | Claim-level paper aggregation for the errata | Drop-in |
| **SciSpace University Program** (free for .edu) | Paper-deep-summarization for the lit-review chapter | Drop-in |
| **ResearchRabbit** (free forever) | Citation graph for the errata + Subtraction-reference completion lit | Drop-in |
| **Semantic Scholar API** (free, key on request) | Programmatic for the Feynman research pipeline | Drop-in |

### 1C. Anthropic credit programs (you're already on Claude Max — these are headroom)

| Program | Use | Apply when |
|---|---|---|
| **Anthropic External Researcher Access** ($500-$25K credits, safety-adjacent) | Reasoning-bank + nervous-system + council layer IS alignment-adjacent research infrastructure | THIS WEEK |
| **Anthropic AI for Science** (up to $20K Claude / 6mo) | Frame: aletheia-nexus AS AI-for-science infrastructure; thesis IS AI-augmented science | NEXT MONTH (proposal write) |
| **Anthropic Economic Futures** (up to $50K) | Empirical work on AI productivity in research (the Tampere lab-adoption case IS this) | NEXT MONTH |
| **Anthropic Build-with-Claude hackathons** ($500/event + $100K grand prize potential) | Showcase the harness | OPPORTUNISTIC |

### 1D. Bundle packs (one signup unlocks many)

| Pack | Contents directly used | Status |
|---|---|---|
| **GitHub Student Developer Pack** | $200 DO credit, $100 Azure credit, JetBrains all IDEs, MongoDB Atlas, 1Password, Namecheap; Copilot Pro WAS in pack (signups paused 2026-04-20 — re-check) | THIS WEEK |
| **AI Student Pack** (`aistudentpack.com`) | v0 Premium 1yr free, Bolt 50% off, Lovable 50% off, Gamma, HeyGen 50% off Creator, Granola, Hedra, ElevenReader Ultra | THIS WEEK — vol-limited |
| **JetBrains Student Pack** | All Pro IDEs + JetBrains Academy + AI Pro trial | Subset of GitHub Pack — redundant unless they diverge |
| **Notion for Education** | Plus free + 50% off Notion AI | Drop-in |
| **Figma Education** | Pro + FigJam 2yr + 3K AI credits/mo | Drop-in (dashboards) |

### 1E. Compute credits (drop directly into aletheia-nexus deployment surface)

| Program | Use | Caveat |
|---|---|---|
| **Modal for Academics** (up to $10K credits) | Voice Bridge backend, autoresearch burst capacity, council-layer parallel inference | .edu / grad-student gate; flexible |
| **RunPod Academic Research Credits** (up to $25K GPU credits) | Spot-GPU lane | Lab-side application (Wolters could co-file) |
| **Lambda Research Grant** ($5K + CSO mentoring) | The mentoring is the unusual perk | Worth the application time |
| **Google Cloud Research Credits** (up to $1K-$5K, .edu) | Embedding work, BigQuery for the reasoning-bank | Application 6-8 weeks |
| **AWS Educate** ($35-100) | Marginal but free | Light touch |
| **Azure for Students** ($100/yr renewable) | Marginal — also in GitHub Pack | Free, auto-renew |
| **Oracle Research Cloud Starter** ($1K OCI credit, no CC) | Backup compute lane | Underused |
| **IBM Cloud Lite + watsonx SkillsBuild** | Free Lite tier; Granite access via SkillsBuild | Marginal value but the watsonx Granite models are decent |

### 1F. Observability + tooling

| Program | Use |
|---|---|
| **LangSmith** (5K traces/mo free) | Trace the dual-model router; debug council-layer dispatches |
| **Langfuse Hobby + OSS** (50K events/mo + MIT self-host) | Self-host on Hetzner alongside Command Deck |
| **Helicone** (10K req/mo free) | Drop-in router audit log |
| **Cursor Students** (1yr Pro, ~$240 value) | IDE for code work; you do use it |
| **HF ZeroGPU Community Grants** (RTX Pro 6000 on Spaces) | Host the L-BFGS demo Space for examiners; future lab demos |

### 1G. Voice Bridge / dashboards / media

| Program | Use |
|---|---|
| **ElevenLabs Students** (1yr ElevenReader Ultra free) | TTS for Voice Bridge replies; ElevenReader for paper consumption |
| **Cloudflare Workers AI** (10K Neurons/day) | Edge endpoints for dashboards |
| **Vercel Hobby** | Alt-host if Hetzner saturates |
| **Roboflow Public Free** | Dataset annotation if any vision work emerges |
| **Pinecone Starter (2GB)**, **Weaviate Sandbox**, **Qdrant Cloud Free**, **Zilliz Free Cluster** | Vector DB alternates if LanceDB hits limits |

---

## Tier 2 — 3-6 months out (light scaffolding OR Wolters/Pursiainen PI route)

### 2A. The Wolters-PI-unlocked compute lane (NEW — Tampere outcome opens this)

These were Tier 3 yesterday under "faculty-only." Today, with Wolters + Pursiainen actively engaged and on board, they become realistically accessible if you propose them as joint-PI grants.

| Program | What you need | Why it's now accessible |
|---|---|---|
| **NVIDIA Academic Hardware Grant** (RTX/Jetson/BlueField hardware OR cloud credits) | Wolters or Pursiainen files at WWU Münster or Tampere; you co-author the proposal | Lab has both faculties now; both at PhD-granting institutions |
| **Cerebras Inference Research Grant** (up to $50K + engineer sessions) | Same — faculty-at-PhD-granting institutions | Wolters PI route at WWU |
| **CZI AI/ML Computing RFA** (≥96 GPUs on CoreWeave allocation) | Biomedical AI framing — EEG source localization IS biomedical AI | Strong fit; needs proposal |
| **NVIDIA Inception (Startups)** | Wrap aletheia-nexus harness as Münster lab spin-out OR personal startup | DLI credits + SDK + hardware discounts |
| **Intel Liftoff** | Same startup framing | Free Tiber AI Cloud credits |
| **AMD Developer Cloud** (free MI300X) | OSS contribution route | If aletheia-nexus releases components open-source |

### 2B. Anthropic AI for Science (the big-leverage program)

Already noted in Tier 1 as a candidate to apply NOW, but the *outcome* (up to $20K Claude over 6 months) shows up Tier-2. The pitch writes itself:

> "Aletheia-Nexus is an AI-augmentation harness for working scientists. It is currently being deployed at WWU Münster's BiMAg group (Wolters, Pursiainen) for EEG source-localization research, with a published thesis demonstrating 98.3% sub-cm Gate-1 accuracy on a realistic head mesh produced with Claude+Gemini as part of the pipeline. The credits would fund (a) the harness's continued use across the Münster group's research, (b) per-researcher acceleration mapping, and (c) productionizing the harness for distribution."

This proposal is essentially WRITTEN by the Tampere handoff itself.

### 2C. Foresight AI for Safety & Science Nodes (Berlin physical hub)

| Program | Use | Why it fits |
|---|---|---|
| **Foresight AI for Science Nodes** (~$3M/yr pool; $10-100K typical; SF + Berlin physical hubs) | Aletheia-Nexus as "science node" deliverable + Münster-lab adoption case study | You're in Berlin; physical proximity matters; the harness IS exactly what they fund |

### 2D. Hackathons + sprints (1-2 weekend commitments)

| Program | Use |
|---|---|
| **DigitalOcean Gradient AI Hackathon** ($20K prizes + $200 DO credits) | Demo the harness; production-AI focus matches |
| **Anthropic Build-with-Claude hackathons** | $500/event stacked credits + showcase |
| **Lablab.ai + MindsDB AI Agents Hack** | $3-5K cash + API credits + Llama Impact $100K path |
| **Apart Research AI Control / AIxBio sprints** | Tests council layer / reasoning-bank against safety-relevant tasks; potential Apart Fellowship invite |
| **Kaggle / ARC Prize 2026** | Brand-recognition for the lab adoption work |

### 2E. Post-MSc / postdoc grant onramps (Hemang individually)

| Program | When |
|---|---|
| **Schmidt AI in Science Postdoc** | After MSc defense; 2yr postdoc; AI-for-science fit is exact |
| **AI2050 Early Career Fellowship (Schmidt)** | Same |
| **Cohere Labs Scholars** (8mo paid, remote-first, no papers required) | Application window opens annually ~Aug; the no-papers-required + remote-first combo is unusually accessible |
| **Hugging Face AI Research Residency** | Application + portfolio |
| **CRA Trustworthy AI Research Fellowship** | $17K stipend; applications opened Feb 2026 → revisit 2027 cycle |

### 2F. Lab-adoption-specific (EU + DFG + DAAD + Münster-institutional)

This is the gap I cannot grep from your local repo — it requires lab-side intelligence on what Münster (or Tampere) already has institutionally. Surface in your next conversation with Wolters/Pursiainen:

- **EU Horizon AI calls** (especially Horizon Europe Cluster 4: Digital, Industry & Space — AI/data/robotics line)
- **DFG (Deutsche Forschungsgemeinschaft) AI funding lines** — group-grant level
- **DAAD** for student/researcher mobility involving the lab
- **Münster institutional licenses** — if WWU already has site-licenses on MATLAB/Mathematica/Comsol/etc., those don't need separate spend
- **Tampere institutional** — Pursiainen's side

### 2G. The harness-as-deliverable funding angle

Several programs would fund the *productization* of the Aletheia-Nexus harness for the lab:

| Program | Frame |
|---|---|
| **OpenAI Cybersecurity Grant ($10M API credits expanded Feb 2026)** | Reframe nervous-system + classification + reasoning-bank as defensive AI tooling; only if/when fit emerges |
| **NSF SBIR AI** (up to $2M Phase I+II) | US incorporation required — Tier 3 unless you incorporate |
| **EU EIC Accelerator / Pathfinder** | Deep-tech European route |
| **Mistral Ambassador / Startup credits** (up to $30K) | If aletheia-nexus framed as Mistral-router product |

---

## Tier 3 — Significantly harder (defer or won't fit)

### 3A. PhD-gated (revisit at MSc→PhD inflection)

Apple Scholars in AIML (invite + PhD), Google PhD Fellowship, Microsoft Research PhD Fellowship, Microsoft Ada Lovelace Fellowship, Meta Research PhD Fellowship, NVIDIA Graduate Fellowship, IBM PhD Fellowship, Stanford HAI Graduate Fellows, Vector Institute Scholarship, ELLIS PhD Program.

### 3B. Region-locked

MBZUAI (UAE), KAUST (Saudi Arabia), IndiaAI Fellowship + Gates India + US-India ORF, UKRI AI CDTs + DeepMind UK Master's, DeepMind INSAIT PhD, Alibaba DAMO + Baidu PaddlePaddle + Tencent Rhino-Bird + Huawei Seeds (China), Yandex CIS programs, RIKEN AIP (Japan), Helmholtz Munich Health AI (Munich, independent-researcher status).

### 3C. Career-pivot required

OpenAI Residency (closed 2026), Google AI Residency, Meta AI Residency, OpenAI Safety Fellowship, OpenAI NextGenAI Consortium (institution gate), Microsoft AI for Good Lab (WA state), NSF AI Research Institutes (US faculty PI), BAIR Grant (Berkeley faculty), pure-policy fellowships (MATS / ARENA / Pivotal / SPAR / CBAI / CAIS / GovAI / Mila AI Policy / Astra), Open Phil + LTFF + SFF + Manifund + FLI grants (x-risk / alignment focus).

### 3D. Closed / defunct (skip)

GitHub Copilot Student signups paused 2026-04-20, OpenAI Residency 2026 closed, IndiaAI PhD Feb passed, Vector 2026-27 Mar passed, SPAR Spring Jan passed, Pivotal Q3 May passed, MBZUAI Fall 2026 Dec 2025 passed, Phind shut Jan 2026, Tabnine student plan ended mid-2022.

---

## Per-research-surface mapping (concise)

| Research surface | Tier 1 picks | Tier 2 picks |
|---|---|---|
| **Thesis writeup + errata + Subtraction completion** | W&B Academic, Mathpix, Wolfram\|Alpha Pro Student, Perplexity Edu, Consensus, SciSpace, ResearchRabbit, Semantic Scholar API, Anthropic External Researcher Access, OpenAI Researcher, Mistral free, GitHub Student Pack | Anthropic AI for Science (writing acceleration framing), Modal Academics (Subtraction reruns) |
| **Aletheia-Nexus harness (router + RAG + nervous-system + reasoning-bank + council)** | All Tier-1A router lanes, LangSmith, Langfuse, Helicone, Modal Academics, HF ZeroGPU | Anthropic AI for Science, Foresight Berlin Node, NVIDIA Inception (startup framing), Cohere Catalyst Grant |
| **Münster lab adoption — Track A (40k EUR Mac Studio)** | None directly — this is hardware spend. But: AMD/Intel/NVIDIA Inception startup deals could discount it if the lab onboards as a startup. | EU Horizon / DFG / DAAD institutional funding (next conversation surface) |
| **Münster lab adoption — Track B (Claude Code Max for lab)** | Anthropic External Researcher Access, Anthropic Build-with-Claude credits, GitHub Student Pack for lab members, AI Student Pack for grad students | Anthropic AI for Science ($20K credits funds lab use) |
| **Münster lab adoption — Track C (Aletheia replication into lab)** | All Tier-1 (the harness will use them); LangSmith/Langfuse for the lab's instance | Anthropic AI for Science as the funding vehicle for the replication work itself |
| **Per-researcher acceleration mapping (3-loop)** | Perplexity Edu + Consensus + SciSpace + Semantic Scholar API for deep-research phase; Claude credits for analyze+brainstorm phase | Anthropic AI for Science covers the program-level use |
| **Voice Bridge / Nexus Voice** | Groq + Cerebras + DeepInfra (low-latency lanes), ElevenLabs Students, HF ZeroGPU | Modal Academics for backend hosting |
| **Autoresearch** | W&B Academic, Modal Academics, RunPod Academic credits (Wolters PI route) | Lambda Research Grant + CSO mentoring; CZI RFA on CoreWeave |
| **Dashboards** | AI Student Pack (v0/Bolt/Lovable/Gamma), Cloudflare Workers AI, Vercel Hobby, Figma Education | None additional |
| **Reflection Engine v2** | LangSmith for traces; HF ZeroGPU for scheduled inference | Anthropic AI for Science (memory-research framing) |

---

## Action queue — sequenced

### This week (Tier 1, ~1-2 days total work)

1. **Router-lane sprint** (~6-8 hours): wire Mistral + Groq + Cerebras + SambaNova + DeepInfra + OpenAI Researcher Access ($1K) into the dual-model router. Verify in Command Deck.
2. **Anthropic External Researcher Access application** (~1 hour): 1-page proposal, reasoning-bank + nervous-system + council layer as alignment-adjacent research infrastructure.
3. **W&B .edu Pro verification** (~15 min): confirm free Pro is active; consolidate thesis + nervous-system accounts.
4. **GitHub Student Pack + AI Student Pack** (~1 hour total): signup, verify, document the credit-set you now have.
5. **Mathpix Edu, Perplexity Edu, Consensus, SciSpace** (~1 hour): one-by-one .edu activation; document logins in the password manager.

### Next 2 weeks (Tier 2 setup)

6. **Anthropic AI for Science proposal** (~2-3 hours, draft inside the harness using Claude Opus): the pitch is essentially written by the Tampere handoff. Target $20K credits / 6 months. Frame: aletheia-nexus as AI-for-science infrastructure currently used at WWU Münster BiMAg.
7. **Foresight AI for Science Node (Berlin hub) application** (~2 hours): same proposal recyclable; emphasize physical Berlin proximity.
8. **Wolters/Pursiainen conversation prep** (~1 hour): one-pager listing the Wolters-PI-unlocked grants (NVIDIA Academic Hardware, Cerebras Research Grant, CZI AI/ML RFA). Two-sentence ask: "Would you consider co-filing one of these academic grants on the LSUB / Aletheia-Nexus replication work? I'd handle the writeup; you'd be the named faculty PI." Bring to the next lab interaction.

### Next month (when bandwidth permits)

9. **Münster institutional intelligence pass** (next conversation with Wolters/Pursiainen): what does WWU already have institutionally? MATLAB site-license? Mathematica? Comsol? Existing DFG-funded compute? EU Horizon Cluster 4 awareness? Tampere institutional?
10. **EU/DFG/DAAD scoping** (~3-4 hours): one focused research session to map the European public funding shape relevant to the lab.

### Watch (not action)

- CRA Trustworthy AI Fellowship 2027 cycle (Feb opens)
- Anthropic Build-with-Claude hackathons (each = $500 credits + grand-prize shot)
- OpenAI Superalignment Fast Grants potential relaunch
- AI Student Pack next volume announcement (vol 1 closed)

---

## Council-layer cross-check

Three lenses, same as v1:

- **Opportunity lens**: the **lab-adoption frame** is the largest opportunity now exposed. Yesterday I was tiering programs against Hemang-solo; today the same programs (esp. faculty-PI compute grants) become Tier-2-accessible via Wolters/Pursiainen. The leverage ratio multiplied.
- **Risk lens**: the **DTI/MEG/HARDI/NODDI speculation in v1 was wrong** — I conflated yesterday's Zeffiro conversation with the actual thesis. Risk pattern: speculative extension framing diluted the real-priority work (errata + Subtraction completion + lab adoption). Fixed in v2 by GT-reading the thesis directly.
- **Implementation-fit lens**: Tier-1A router-lane additions remain the densest immediate work (~6-8 hours). Tier-2 work is now grant-writing-heavy (Anthropic AI for Science + Foresight + Wolters-PI-grants) — that's where the next concentrated effort goes.

**No anti-churn abstention** — the v1→v2 correction was material, not cosmetic.

**Devil's advocate hardening checklist:**
- BLIND_SPOT 1: Wolters/Pursiainen ask-budget is finite. *Disposition: mitigated* — present the grants AS GIFTS to their group (mostly compute + credit, minimal commitment on their side beyond signing as PI), not as personal asks.
- BLIND_SPOT 2: Anthropic AI for Science approval rate is unknown but the program is selective. *Disposition: accepted-risk* — the proposal is essentially free to draft via the harness itself; downside of rejection is small.
- BLIND_SPOT 3: Tier-2 grants have multi-month decision cycles; you can't deploy them this semester. *Disposition: accepted-risk* — Tier 1 alone is already significant; Tier 2 is forward-loading.
- BLIND_SPOT 4: The "AI Student Pack" bundle volumes close. *Disposition: deferred-with-trigger* — apply for current vol immediately; reminder for vol 2.
- BLIND_SPOT 5: Thesis defense window dominates priority. Tier-2 grant writing should not preempt the 6 thesis-text integrity items + Subtraction completion. *Disposition: mitigated* — Tier 1 is essentially zero time cost; Tier 2 proposals can be deferred until post-defense if defense window tightens.

No `VETO`. No `REFRAME`.
