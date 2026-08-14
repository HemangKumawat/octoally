# AI Programs × Research Initiatives — Tiered Match

**Compiled 2026-05-20** | Composes `docs/research/ai-student-programs-2026.md` (the master inventory of ~200 programs) with the aletheia-nexus capability map and the active research portfolio. Skills composed: `/deep-analyze` (3 lenses: Opportunity, Risk, Implementation Fit) → inline `/brainstorming` (edge cases at tier boundaries) → inline `/council` (cross-lens validation). Role-cast applied — programs can serve multiple initiatives, single-winner forcing was avoided where genuinely complementary.

---

## Plain-meta summary

You asked: take the ~200 AI programs from yesterday's master list and figure out which ones plug into which of your research initiatives — sorted into 3 difficulty tiers based on what aletheia-nexus can absorb today vs. a few months from now vs. significantly harder.

**Top-level verdict:** the densest leverage is in **Tier 1 inference-credit programs** — your dual-model router was effectively *built* for this lane, so every additional free/credited API key adds another routing arm at zero marginal scaffolding. That gives you ~12 immediate Tier-1 wins.

For the **thesis specifically**, the highest-ROI Tier-1 picks you may already be sitting on are **W&B Academic Research** (already in the L-BFGS pipeline) and **Mathpix Edu** (LaTeX equation OCR). The highest-ROI **Tier-2** lift is **Anthropic AI for Science** ($20K Claude credits / 6 months) — your DTI→anisotropic-conductivity extension and MEG validation are exactly the "priority-science" framing they fund. Pair that with **Foresight AI for Safety & Science Nodes** and **CZI AI/ML Computing RFA** for the same extensions.

For **aletheia-nexus itself**, Tier 1 is the "stack more inference providers into the router" play: **Mistral free experiment tier (1B tok/mo)**, **Groq free**, **Cerebras 1M tok/day**, **DeepInfra DeepStart (1B tokens)**, **SambaNova free**, **OpenAI Researcher Access ($1K)**, plus existing Claude Max + Gemini Ultra. Net effect: ~5-7 model lanes at near-zero cost, with the router already designed for the dispatch shape.

**Tier 3 is mostly PhD-gated fellowships** (Apple Scholars, Google/Meta/MS PhD, NVIDIA Graduate, IBM PhD) plus region-locked programs (Chinese labs, Yandex, MBZUAI, KAUST). You're MSc-stage and Germany-based — defer the PhD-gated until you're at that decision point.

**Skip queue** (closed/defunct from yesterday's audit): GitHub Copilot Student signups paused 2026-04-20, OpenAI Residency 2026 closed, IndiaAI PhD Feb deadline gone, Vector Mar deadline gone, Phind product shut Jan 2026, Tabnine student plan ended.

---

## Tier 1 — Immediate fit (the dual-model router was built for this)

These programs slot into aletheia-nexus's current architecture without new scaffolding. Most are inference credits or tools you already partially use.

### → MSc Thesis (DUNEuro FEM, L-BFGS inverse, EEG forward)

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **W&B Academic Research** (free Pro, .edu, 200GB, 100 seats) | `wandb_helpers.py` + `sim_config.py` already in thesis stack | Track the remaining 30-trial runs + statistical analysis sweeps; hierarchical run grouping for mesh × source-model × SNR matrix |
| **Mathpix Edu** (20 free Snips/mo auto-upgrade on .edu) | Direct LaTeX equation OCR for theory.tex / methods.tex | OCR Wolters/Höltershinken papers' equations → LaTeX without retyping |
| **Wolfram\|Alpha Pro Student** (30% off) | Symbolic validation of forward-solve derivations | Sanity-check analytical sphere solutions, conductivity tensor algebra |
| **Perplexity Pro Education** (1yr free + Comet) | Already-research-mode-tier; cite-pinning paper search | Literature scan for thesis-extensions (DTI, NODDI, HARDI) |
| **Consensus Student Premium** (3mo free + 40% off) | Claim-level paper aggregation | Lit review for "what does anisotropy actually change in forward solve?" |
| **SciSpace University Program** (free for verified .edu) | Per-paper deep summarization + plain-language explainer | Wolters group + DUNEuro papers digest |
| **ResearchRabbit** (free) | Forward/backward citation graph | Map the LSUB → Subtraction → Venant → PI lineage |
| **Semantic Scholar API** (free, key on request) | Programmatic citation graph queries | Feed citation neighborhoods into your Feynman multi-agent research pipeline |
| **Hugging Face ZeroGPU Community Grants** | RAG already on HF/Ollama infra | Host a Space that runs the L-BFGS optimizer interactively for examiners |

### → Aletheia-Nexus (the router + RAG + nervous system)

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **OpenAI Researcher Access Program** ($1K credits, 12mo) | Router already wired to OAI-shape APIs | Adds an OpenAI lane to the router; Claude Max + Gemini Ultra + OpenAI = 3-way dispatch |
| **Anthropic External Researcher Access** ($500-$25K credits) | Claude Max OAuth already primary; credits = headroom | Augments existing Claude lane; especially valuable for council layer & long-context advisor passes |
| **Anthropic AI for Science** (up to $20K Claude / 6mo) | Same router; aletheia-nexus IS a research-infrastructure project | Frame the nervous-system + reasoning-bank + meta-skill machinery as research infrastructure for science — that's literally what it is |
| **Mistral Free Experiment Tier** (1B tok/mo, no CC) | Pure router add | Free 5th lane in the router; ideal for high-volume Sonnet-class work |
| **Groq Free Tier** (30 RPM / 14.4K req/day) | Pure router add | Ultra-low-latency lane for the council layer's parallel-agent dispatch |
| **Cerebras Free Tier** (1M tokens/day) | Pure router add | Long-context lane for the reasoning-bank consumer naming gate work |
| **SambaNova Developer Free** ($5 + rate-limited) | Pure router add | Lower-priority lane |
| **DeepInfra DeepStart** (up to 1B inference tokens, startup) | Aletheia-Nexus could be framed as a startup product | High-volume lane for autoresearch + dashboards |
| **OpenRouter free tier + free models** | Already pattern-matched to your router shape | Free fallback lane at the dispatch layer |
| **Cohere Labs Catalyst Grant** (API + model access) | Researcher route, adds Cohere to router | Adds a Cohere lane (good RAG embeddings) |
| **LangSmith free** (5K traces/mo) | Observability for the router | Trace the dual-model router dispatches; pair with existing GitNexus diagnostics |
| **Langfuse Hobby + OSS** (50K events/mo; MIT self-host) | Already self-hostable | Self-host on Hetzner alongside Command Deck |
| **Helicone free** (10K req/mo) | Observability | Drop-in for the router's audit log |
| **Modal for Academics** (up to $10K credits) | Voice Bridge + autoresearch backend already need cloud GPU bursts | Burst capacity beyond ROG_Beast; serverless FastAPI deployments |
| **Hugging Face Pro / Academia Hub adjacency** | RAG on HF Spaces / Ollama backend already | Versioned model storage for finetuned embeddings, voice models |
| **Cloudflare Workers AI** (10K Neurons/day) | Dashboards already publish via Tailscale | Optional edge-serverless lane for dashboard AI endpoints |
| **GitHub Student Developer Pack** | $200 DO + $100 Azure + JetBrains + Copilot Pro¹ | DO credit → another VM if Hetzner saturates; Copilot Pro for IDE |
| **Cursor Students** (1yr Pro) | Already used for code work | 1-year Pro for the heaviest IDE-driven sessions |

¹ *Copilot Student signups paused 2026-04-20 — verify before relying on it.*

### → Voice Bridge / Nexus Voice

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **ElevenLabs Students** (1yr ElevenReader Ultra free) | Voice Bridge already does TTS-adjacent work | TTS output for Voice Bridge replies; ElevenReader for podcast-mode |
| **Groq Free Tier** (very low latency) | Phone-to-cloud latency is the dominant UX cost | Best latency lane for voice replies |
| **Cerebras Free Tier** | Same | Backup low-latency lane |
| **HF ZeroGPU Community Grants** | RTX Pro 6000 access on HF Spaces | Host the Gemma-on-PC equivalent in cloud for fallback when ROG_Beast offline |
| **AI Student Pack** (`aistudentpack.com`) — Granola, Coconote, Hedra | Adjacent voice/transcription tools | Granola: meeting transcripts; Coconote: study transcripts; Hedra: avatar |

### → Autoresearch (Karpathy fork on Windows, 5070 Ti home)

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **W&B Academic Research** | Run tracking already a pattern in your thesis | Track overnight training runs with run-level diff visualisation |
| **Modal for Academics** ($10K) | Burst-cloud-GPU compatible with the run shape | Run *additional* parallel training streams in cloud when ROG_Beast saturates |
| **RunPod Academic Research Credits** (up to $25K) | Pure spot-GPU lane | Cheaper alt to Modal when batch latency tolerable |
| **Lambda Research Grant** ($5K + CSO mentoring) | Mentoring is the unusual perk | Get architecture/training-recipe feedback from Lambda's CSO |
| **Together Research Credits** | Llama fine-tune route | If you ever pivot autoresearch to fine-tuning instead of training-from-scratch |

### → Tampere Dashboard + future operator dashboards

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **AI Student Pack** — **v0 Premium (1yr free)**, **Bolt 50% off**, **Lovable 50% off**, **Gamma**, **Figma Edu** | Dashboard scaffolding velocity | v0 / Bolt / Lovable for rapid front-end prototypes that you then port to Svelte/React; Gamma for stakeholder-mode views; Figma Edu for design systems |
| **Cloudflare Workers AI** | Dashboard endpoints can move to edge | Serverless endpoints for dashboard AI features without taxing Hetzner |
| **Vercel Hobby plan** | Alt-host for the public dashboard layer | If Hetzner needs offload; non-commercial single-user fine |
| **Notion for Education** (Plus + 50% off Notion AI) | If wiki ever migrates beyond Obsidian | Operator-tier note surface; integration with dashboards |

### → Reflection Engine v2 (Leitner)

| Program | Why it fits NOW | Specific use |
|---|---|---|
| **Anthropic External Researcher Access** | Reflection engine IS research infrastructure | Frame Leitner-over-knowledge-base as memory-research; chase credits |
| **LangSmith** (5K traces/mo free) | Observe Leitner schedule decisions | Trace which intervals are well-tuned vs over/under-due |
| **Reflect.app** (free 1yr for students) | Adjacent spaced-repetition stack | Cross-pollination of UX ideas, not direct dependency |

---

## Tier 2 — Few months out (modest scaffolding OR thesis-adjacent grants)

### → MSc Thesis extensions (DTI conductivity, MEG validation, HARDI/NODDI)

| Program | What's needed first | Why it fits |
|---|---|---|
| **Anthropic AI for Science** (up to $20K Claude / 6mo) | Scope a 2-3 page proposal: how Claude credits accelerate the DTI→conductivity pipeline OR MEG validation OR HARDI/NODDI mapping | The "priority sciences" track explicitly targets brain/neuro AI applications |
| **Foresight AI for Safety & Science Nodes** (~$3M/yr, $10-100K typical) | Write a science-node proposal — DTI conductivity → improved EEG inverse solutions is a science-node-shaped problem | SF + Berlin physical hubs; you're in Berlin |
| **CZI AI/ML Computing RFA** (≥96 GPUs on CoreWeave) | Frame as biomedical AI for brain imaging | DTI conductivity work fits "biomedical AI" — CZI funds exactly this neighborhood |
| **Cerebras Inference Research Grant** (up to $50K + engineer sessions) | Requires faculty-at-PhD-granting-institution status | Could be filed by Wolters at Münster with you as co-applicant for the DTI work |
| **NVIDIA Academic Hardware Grant** (RTX/Jetson/BlueField OR cloud credits) | Same faculty gate | Wolters-PI route; would massively unblock realistic head model + L-BFGS at scale |
| **NSF SBIR AI** (up to $2M Phase I+II) | US incorporation required | If aletheia-nexus ever spun out as a US AI-for-science startup |
| **OpenAI Superalignment Fast Grants** (status uncertain post-team-dissolution) | Re-verify; one-time pool was 2024 | Watch for relaunch; the reasoning-bank + nervous-system work has alignment-adjacent framing |
| **Mistral Ambassador Program** (up to $30K credits) | Apply via ambassador track | If aletheia-nexus is positioned as a Mistral-router product |
| **fal.ai Startup Credits** ($500-$5K+) | Application required, accelerator-linked | Adds fal.ai lane for media-gen if dashboards need it |
| **Fireworks Startup Program** (up to $10K via GCP partnership) | Startup framing | Another inference lane |
| **Baseten AI Startup Program** | Startup framing | Hosted-inference lane |
| **Apart Research AIxBio Hackathon** | 48-hour sprint commitment | Brain imaging is bio-adjacent — Apart's AI×Bio sprint is a natural research showcase |
| **Apart Research AI Control Hackathon** | Sprint commitment | Tests the council layer + reasoning bank against safety-relevant tasks; could generate alignment-research output |
| **OpenAI Cybersecurity Grant** ($10M API credits expansion) | Reframe aletheia-nexus's classification + nervous-system as defensive AI tooling | Watch for fit if you ever frame your work toward AI-for-security |
| **Hugging Face AI Research Residency** | Application + portfolio | If you ever want a structured residency on top of independent research |
| **Cohere Labs Scholars Program** (8mo paid, remote-first, no papers required) | 8-month commitment to Cohere | The remote-first + no-papers-required + intl-OK combo makes this unusually accessible |
| **OpenAI Codex for Students** ($100 credits) | Requires US/CA residency | Apply if/when traveling to US |
| **xAI SuperGrok Student Access** (2mo free + 800K tok/mo Grok 4 at partner unis) | Requires .edu + partner uni | Münster isn't listed as partner; check periodically |
| **AI Student Pack — additional volumes** | Wait for next volume; vol-1 closed | Bolt/Lovable/Gamma etc. credit refresh |

### → Aletheia-Nexus (capability extensions)

| Program | What's needed first | Why it fits |
|---|---|---|
| **Anthropic AI for Science** | Same scope-proposal effort | Aletheia-Nexus IS research infrastructure — qualifies |
| **Foresight AI for Science Nodes** | Berlin physical hub proximity | Aletheia-Nexus's reasoning-bank + nervous-system are "science node" deliverables |
| **NSF NAIRR Pilot** (free compute/datasets/models) | US-researcher gate | If you collaborate with a US lab on the nervous-system work |
| **Schmidt AI in Science Postdoc** | Postdoc gate (after MSc) | Tier-2 if you finish MSc this year and apply for postdoc cycles |
| **AI2050 Early Career Fellowship** (Schmidt) | Postdoc gate | Same |
| **OpenAI Build-with-Claude hackathon** (you mean Anthropic-hackathon) → **Anthropic build-with-Claude hackathons** | Time investment | $500/event credits stacked across 3-4 events = $1.5-2K of API credits + grand-prize shot |
| **NVIDIA Inception** (DLI + SDK + hardware discounts) | Startup framing | If/when aletheia-nexus is positioned as a startup |
| **Intel Liftoff** | Same | Alt-hardware lane |
| **AMD Developer Cloud** (free MI300X) | OSS contribution recommended | Free MI300X access for any future fine-tuning work |
| **Microsoft Founders Hub** | Startup framing | $1-5K Azure + OpenAI credits, no CC |
| **Replicate signup credit + startup access** | Light scoping | Replicate as deployable-model lane |

### → Future operator dashboards (the operator-interface-is-infrastructure rule)

| Program | What's needed first | Why it fits |
|---|---|---|
| **AI Student Pack** future volumes | Wait | Next volume of v0/Bolt/Lovable/Gamma credits |
| **Figma Education** (free Pro + FigJam + 3K AI credits/mo) | .edu | Design-system continuity beyond current Skeleton convention |
| **Cloudflare Workers AI** as default edge | Migrate dashboard endpoints | Tier 2 because requires moving endpoints off Hetzner |
| **Vercel for Students** via GitHub Pack | Wait if Copilot signups reopen | Alt-host |
| **DigitalOcean Gradient AI Hackathon** ($20K prizes + $200 DO credits) | Sprint commitment | Dashboards are exactly the kind of demo this rewards |

---

## Tier 3 — Significantly harder (defer or won't fit)

These need institutional partnerships, faculty status, region relocations, multi-year commitments, or career pivots you're not currently making. Most should be revisited only at clear inflection points (MSc → PhD, Berlin → elsewhere, independent → faculty-co-applicant).

### PhD-gated (revisit if/when you start a PhD)

| Program | Gate | Note |
|---|---|---|
| Apple Scholars in AIML | Invited institutions + PhD | Contact `aiml_scholars@apple.com` if MPI-CBS / Münster joins the invited list |
| Google PhD Fellowship | PhD enrollment | Annual; high prestige |
| Microsoft Research PhD Fellowship | PhD + nomination | Univ chair nominates; not direct apply |
| Microsoft Ada Lovelace Fellowship | PhD + nomination + underrep groups | Same gate |
| Meta Research PhD Fellowship | PhD | Annual |
| NVIDIA Graduate Fellowship | PhD past yr 1 + CS/EE | Up to $60K/yr |
| IBM PhD Fellowship | PhD + nomination | Faculty initiates |
| Stanford HAI Graduate Fellows | Stanford PhD | Institution-only |
| Vector Institute Scholarship | Ontario Vector-recognized MSc | Geography + institution gate |
| ELLIS PhD Program | EU PhD aspirant, ~5-10% admit | Worth chasing if PhD pursued |
| Schmidt AI in Science Postdoc | PhD-completed | After MSc |
| AI2050 Early Career (Schmidt) | Postdoc/pre-tenure | Same |
| Stanford / CMU / MIT individual fellowships | Institution-only | Not applicable |

### Region-locked (would require relocation)

| Program | Gate |
|---|---|
| MBZUAI scholarship | Move to UAE |
| KAUST AI initiative | Move to Saudi Arabia |
| IndiaAI Fellowship | India residency |
| Gates Foundation AI Fellows India | India residency |
| ORF US-India AI Fellowship | US or India presence |
| UKRI AI CDTs | UK home student status |
| DeepMind UK Master's Scholarships (via Martingale) | UK partner-uni MSc |
| DeepMind PhD at INSAIT | Bulgaria |
| Alibaba DAMO Young Fellow | Greater China + ≤35yr |
| Baidu PaddlePaddle / AI Studio | China phone/ID verification |
| Tencent Rhino-Bird (Elite/Focused/Visiting) | China-onsite |
| Huawei Seeds for the Future | Per-country chapter |
| Yandex ML Prize / Residency / AI360 | CIS-restricted, Russia-sanctions concerns |
| RIKEN AIP IPA/JRA | Japan |
| Helmholtz Munich Health AI Fellows | Independent researcher status, Munich |

### Career-pivot required (would change what you're doing)

| Program | Pivot |
|---|---|
| MATS / ARENA / Astra / Pivotal / SPAR / CBAI / CAIS / GovAI / Algoverse / Global AI Safety / Apart Fellowships | Full pivot to AI safety / alignment research |
| OpenAI Residency | Career pivot to OpenAI; cycle closed |
| OpenAI Safety Fellowship | New 2026 launch; safety focus |
| OpenAI NextGenAI Consortium | Must be at one of 15 partner institutions |
| Google AI Residency | Pivot to Google research career |
| Meta AI Residency | Same |
| Microsoft AI for Good Lab Open Call | WA-State research focus |
| NSF AI Research Institutes | US faculty PI |
| NSF ExpandAI | HBCU/HSI/ANSI/PBI institutional |
| NSF TechAccess Coordination Hubs | US institutional |
| BAIR Grant | Berkeley faculty |
| Open Philanthropy AI grants | Safety/governance focus |
| LTFF / SFF / Manifund | x-risk / alignment focus |
| FLI grants | x-risk focus |
| FAR AI / Future House / Algoverse / Global AI Safety / Penn AI Fellowship | Institution/topic gate |
| CRA Trustworthy AI Research Fellowship | Early-career scholar applications open Feb 2026 — revisit |
| GovAI Summer Fellowship | AI policy/governance pivot |
| Mila AI Policy Fellowship | Policy pivot at Mila |
| CIFAR AI Frontiers School | Canadian funding for non-Canadian researchers — possible but selective |
| Canada CIFAR AI Chairs | Faculty in Canada |

### Closed / defunct (do NOT chase)

GitHub Copilot Student (signups paused), OpenAI Residency 2026 (closed), IndiaAI PhD (Feb passed), Vector 2026-27 (Mar passed), SPAR Spring (Jan passed), Pivotal Q3 (May 3 passed), MBZUAI Fall 2026 (Dec 15 2025 passed), Phind (Jan 2026 shutdown), Tabnine student plan (mid-2022).

---

## Honorable mention — obscure / counter-intuitive matches

These are non-obvious fits that surfaced from cross-referencing the master list against your actual research surfaces. Worth knowing about even if not chasing immediately.

| Program | The non-obvious match | Why it counter-intuitively fits |
|---|---|---|
| **Anthropic AI for Science** + DTI conductivity work | Most people associate Claude with text; you'd use it to *generate the FEM scaffolding code* for the new anisotropic conductivity ingestion + write the lit-review chapter draft | The credits don't have to fund text work — Claude as a scientific coding accelerator is exactly the priority-science framing |
| **Cohere Labs Scholars Program** + aletheia-nexus | Remote-first 8mo, no papers required, intl OK | Almost no other frontier lab has this combination — the embedded-researcher pattern would let you spend 8mo on the reasoning-bank work with Cohere infrastructure |
| **DeepInfra DeepStart** (1B inference tokens) + Voice Bridge | DeepInfra hosts cheap inference; 1B tokens is massive | Voice Bridge's per-utterance cost could go to near-zero on a DeepStart lane |
| **HF ZeroGPU Community Grants** + Reflection Engine | Reflection Engine = scheduled inference jobs on the wiki corpus | A ZeroGPU Space could host the daily Leitner sweep without burning your local GPU |
| **Apart Research AIxBio Hackathon** + thesis | Brain imaging is at the EEG/biosec adjacency Apart cares about | A 48h sprint demonstrating the L-BFGS pipeline on a public dataset = paper + visibility + apart fellowship invite |
| **Foresight AI for Science Nodes (Berlin hub)** + aletheia-nexus | You're in Berlin; they have a physical hub there | Local IRL connection is the actual unlock; once in the hub network, grants flow easier |
| **NVIDIA DLI Teaching Kits** + Wolters lab | Free gen-AI curriculum for educators | If Wolters teaches anything containing FEM or imaging, the kits let you co-build a Münster-branded course module |
| **AI Student Pack (Hedra, Higgsfield)** + Voice Bridge | Avatar + video-gen for voice replies | A Voice Bridge response could include an avatar video for richer phone-to-PC interaction |
| **W&B Academic for Research (free Pro)** + nervous-system | You already use W&B for thesis runs; same plan covers the nervous-system observability surface | Single account, unified run history across thesis + aletheia work |
| **Cloudflare Workers AI** + autoresearch | Autoresearch runs locally; serverless edge could *expose* its checkpoints for inspection | Cheap public-facing checkpoint browser without hosting cost |
| **Modal for Academics** + thesis MEG validation | The MEG validation is the deferred next phase; Modal's $10K covers compute for the expensive solver runs | Modal Academics specifically targets grad-student labs |
| **Mistral 1B tok/mo free** + thesis lit-review | At 1B tok/mo you can run very expansive literature digests | Free, no CC, no .edu gate — just sign up |
| **Helicone / Langfuse** + reasoning-bank | Your reasoning-bank IS an observability target | Self-hosted Langfuse on Hetzner gives you trace-level analytics over the council layer's decisions |

---

## Reverse view — programs ranked by total leverage across your portfolio

The top-leverage programs serve 3+ research initiatives without modification. These are the ones to pursue first regardless of how you slice the categorization.

| Program | Tier | Initiatives served |
|---|---|---|
| **Anthropic AI for Science** | T2 | Thesis ext, Aletheia-Nexus, Reflection Engine, Future thesis ext |
| **Anthropic External Researcher Access** | T1 | Aletheia-Nexus, Reflection Engine, Future thesis ext |
| **Modal for Academics** | T1 | Aletheia-Nexus, Voice Bridge, Autoresearch, Dashboards |
| **W&B Academic Research** | T1 | Thesis, Aletheia-Nexus, Autoresearch |
| **Mistral Free Experiment Tier** | T1 | Aletheia-Nexus, Voice Bridge, Reflection Engine, Future thesis ext |
| **Groq Free Tier** | T1 | Aletheia-Nexus, Voice Bridge |
| **DeepInfra DeepStart** | T1 | Aletheia-Nexus, Voice Bridge, Autoresearch |
| **HF ZeroGPU Community Grants** | T1 | Voice Bridge, Reflection Engine, Future thesis ext (FEM Space) |
| **OpenAI Researcher Access** | T1 | Aletheia-Nexus, Future thesis ext |
| **AI Student Pack** (`aistudentpack.com`) | T1 | Dashboards, Voice Bridge, Aletheia-Nexus prototyping |
| **GitHub Student Pack** | T1 | Aletheia-Nexus, Dashboards |
| **Perplexity Pro Education** | T1 | Thesis, Aletheia-Nexus research mode |
| **Cohere Labs Scholars** | T2 | Aletheia-Nexus, Future thesis ext |
| **Foresight AI for Science Nodes (Berlin)** | T2 | Thesis ext, Aletheia-Nexus, Future thesis ext |
| **CZI AI/ML Computing RFA** | T2 | Thesis ext, Future thesis ext |
| **NVIDIA Academic Hardware Grant** (via Wolters) | T2 | Thesis, Thesis ext, Future thesis ext, Autoresearch |
| **Apart Research AIxBio Hackathon** | T2 | Thesis ext (visibility), Aletheia-Nexus (council layer demo) |

---

## Council-layer cross-check (internal validation)

Three lenses cross-checked the above mapping:

- **Opportunity lens** (deep-analyze "Opportunity" agent role): high agreement — the dual-model-router-as-credit-aggregator framing makes Tier 1 dense and obvious. Largest opportunity surfaced: **Anthropic AI for Science is bigger than it looks** because it serves both the thesis extensions AND aletheia-nexus's framing-as-research-infrastructure simultaneously.
- **Risk lens** (Risk agent role): flagged that **eligibility windows close fast** — most 2026-cycle deadlines have already passed (catalogued in master file). The risk of "apply when ready" is missing 2026 cycles entirely. Mitigation: file the 2-3 Tier-2 grant proposals (Anthropic AI for Science, Foresight, CZI) on a *single* writing sprint while context is fresh. Second risk: the **faculty-PI-gated programs** (NVIDIA Academic Hardware, Cerebras Research Grant) require Wolters initiation — if you don't ask him, they're permanently Tier 3. If you do ask, they're Tier 2.
- **Implementation-fit lens** (Fit agent role): the **router-lane additions** (Mistral, Groq, Cerebras, SambaNova, DeepInfra, OpenAI Researcher) all have the same shape — add API key to config, smoke-test, register with the router. Net effort: probably under 2 hours per lane. That's the densest Tier-1 work.

**Council verdict:** the three lenses converge — Tier 1 is dominated by router-lane additions, Tier 2 is dominated by Anthropic AI for Science + Foresight + CZI + Wolters-PI hardware/compute grants. **No disagreement worth flagging.** Anti-churn rule applies — board would abstain on this since experts agree.

**Devil's-advocate hardening checklist:**
- BLIND_SPOT 1: free-tier rate limits compound when running parallel agents. Tier 1 stacking adds quota headroom but not latency. *Disposition: mitigated* — the router can route by quota state.
- BLIND_SPOT 2: vendor lock-in via free credits is a real surface. If aletheia-nexus over-fits to one provider's quirks (e.g. Mistral's tokenizer), portability suffers. *Disposition: accepted-risk* — the router abstraction already isolates this.
- BLIND_SPOT 3: faculty-PI grant route depends on Wolters' interest and political capital. Asking depletes a finite ask-budget. *Disposition: deferred-with-trigger* — ask only if the DTI/MEG extensions land in your thesis scope; otherwise wait until post-MSc PhD discussion.
- BLIND_SPOT 4: the AI Student Pack bundle volumes close fast (vol 1 closed). *Disposition: deferred-with-trigger* — set a reminder to apply on vol 2 announcement.
- BLIND_SPOT 5: thesis deadline pressure — none of the Tier 2 grant work should preempt finishing the MSc. *Disposition: mitigated* — Tier 1 is essentially zero-cost-of-time; Tier 2 grants can wait until thesis defense.

No `VETO` flags. No `REFRAME` triggered.

---

## Action queue — concrete next moves (prioritized)

1. **THIS WEEK — Tier 1 router-lane sprint**: register & wire the missing inference lanes into the dual-model router → Mistral, Groq, Cerebras, SambaNova, DeepInfra, OpenAI Researcher Access ($1K). ~6-8 hours total. Net: ~5 new model lanes at $0 marginal cost.
2. **THIS WEEK — Anthropic External Researcher Access submission**: 1-page proposal. The reasoning-bank + nervous-system + council layer ARE alignment-adjacent research. Stipend size $500-$25K.
3. **NEXT 2 WEEKS — W&B Academic upgrade**: verify the free Pro tier is active on your .edu (200GB, 100 seats, unlimited tracked hours). Migrate thesis + autoresearch + nervous-system observability under one account.
4. **NEXT 2 WEEKS — AI Student Pack signup**: get into the next volume queue.
5. **NEXT MONTH — Anthropic AI for Science proposal**: 2-3 page scope. Frame: DTI→anisotropic conductivity + MEG validation, Claude-as-scientific-coding-accelerator. Target $20K Claude credits / 6 months.
6. **NEXT MONTH — Foresight AI for Safety & Science Node application**: target the Berlin hub. Frame: aletheia-nexus reasoning-bank + nervous-system as a "science node" deliverable.
7. **POST-THESIS — Wolters conversation**: ask whether he'd be open to a joint application for the NVIDIA Academic Hardware Grant or Cerebras Research Grant on the DTI conductivity work. Two-sentence ask: "would you consider co-filing the NVIDIA / Cerebras academic grant for the DTI conductivity extensions? I'd handle the writeup; you'd be the named faculty PI."
8. **WATCH (not action)**: CRA Trustworthy AI Fellowship (apps open Feb 2026 — already passed for 2026 cycle, watch for 2027), Anthropic Build-with-Claude hackathons (each one stacks $500 credits), OpenAI Superalignment Fast Grants relaunch.

---

## What didn't fit any tier (excluded with reason)

- **All Chinese / Russian regional programs**: blocked by region/nationality.
- **Closed/defunct programs**: catalogued in the master file's "skip" section.
- **Pure-policy/safety fellowships (MATS/ARENA/Astra/Pivotal/SPAR/CBAI/CAIS/GovAI/Apart Fellowships)**: career pivot away from physics+systems research. Apart *hackathons* survive in Tier 2 because they're sprints, not full pivots.
- **The B2B-only programs (HuggingFace Academia Hub)**: requires institutional purchase, not individual.
- **Faculty-only programs without Wolters lever**: Tier 3 default; promotable to Tier 2 conditionally.
