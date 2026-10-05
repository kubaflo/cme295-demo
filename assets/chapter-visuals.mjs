import { CANDIDATES, DIFFUSION_FRAMES, LOGITS, TOKENS, attention, sample, softmax } from "./models.mjs";

const EMBEDDINGS = [
  [0.12, -0.34, 0.56, 0.08], [0.64, 0.28, -0.12, 0.73],
  [0.81, -0.18, 0.42, 0.65], [-0.24, 0.13, 0.09, -0.31],
  [0.38, 0.72, -0.45, 0.54], [-0.16, -0.29, 0.11, 0.04],
];
const TOKEN_IDS = [12, 87, 205, 34, 109, 2];
const ICONS = {
  tokens: '<rect x="6" y="12" width="21" height="17"/><rect x="36" y="12" width="21" height="17"/><path d="M16 29v12h16m15-12v12H32v12"/><rect x="22" y="49" width="20" height="10"/>',
  model: '<path d="M13 14l19 17L51 14M13 50l19-19 19 19M13 14v36m38-36v36"/><circle cx="13" cy="14" r="6"/><circle cx="51" cy="14" r="6"/><circle cx="32" cy="31" r="8"/><circle cx="13" cy="50" r="6"/><circle cx="51" cy="50" r="6"/>',
  response: '<path d="M8 10h48v34H29L16 55V44H8Z"/><path d="M18 21h28M18 30h20"/>',
  matrix: '<rect x="9" y="9" width="46" height="46"/><path d="M9 24h46M9 40h46M24 9v46M40 9v46"/>',
  reward: '<circle cx="32" cy="32" r="24"/><path d="m19 32 9 9 18-20"/>',
  loop: '<path d="M11 26a22 22 0 0 1 37-12l6 7M54 21V8m0 13H41M53 39a22 22 0 0 1-37 12l-6-7M10 44v13m0-13h13"/>',
  document: '<path d="M15 6h23l13 13v39H15ZM38 6v13h13M23 29h20M23 38h20M23 47h13"/>',
  diffusion: '<path d="M8 32h48M25 14l15 18-15 18"/><rect x="3" y="22" width="18" height="20"/><rect x="43" y="22" width="18" height="20"/>',
};
const icon = (name) => `<svg class="v-icon" viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">${ICONS[name]}</svg>`;
const vector = (values) => `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
const controls = (labels) => `<div class="v-stage-tabs" role="group" aria-label="Illustration stages">${labels.map((label, i) =>
  `<button type="button" data-v-stage="${i}" aria-pressed="${i === 0}"><span>${String(i + 1).padStart(2, "0")}</span>${label}</button>`).join("")}</div>`;

function wireStages(context, count, render, { animate = false } = {}) {
  let stage = 0;
  let timer = null;
  const play = context.root.querySelector("[data-v-play]");
  const next = context.root.querySelector("[data-v-next]");
  const stop = () => {
    if (timer !== null) context.window.clearTimeout(timer);
    timer = null;
    if (play) {
      play.textContent = stage === count - 1 ? "Replay" : "Play sequence";
      play.setAttribute("aria-pressed", "false");
    }
  };
  function update() {
    context.root.dataset.visualStage = String(stage);
    context.root.querySelectorAll("[data-v-stage]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.vStage) === stage));
    });
    if (next) next.disabled = stage === count - 1;
    render(stage);
  }
  function advance() {
    stage += 1;
    update();
    if (stage < count - 1) timer = context.window.setTimeout(advance, 800);
    else stop();
  }
  context.root.querySelectorAll("[data-v-stage]").forEach((button) => button.addEventListener("click", () => {
    stop();
    stage = Number(button.dataset.vStage);
    update();
    stop();
  }));
  if (next) next.addEventListener("click", () => {
    stop();
    stage = Math.min(stage + 1, count - 1);
    update();
    stop();
  });
  context.root.querySelector("[data-v-reset]")?.addEventListener("click", () => {
    stop();
    stage = 0;
    update();
    stop();
  });
  if (animate && play) play.addEventListener("click", () => {
    if (timer !== null) {
      stop();
      return;
    }
    if (!context.isMotionEnabled()) {
      stage = count - 1;
      update();
      stop();
      return;
    }
    stage = 0;
    update();
    play.textContent = "Pause";
    play.setAttribute("aria-pressed", "true");
    timer = context.window.setTimeout(advance, 800);
  });
  const motionChanged = (event) => { if (!event.detail) stop(); };
  const visibilityChanged = () => { if (context.document.hidden) stop(); };
  context.document.addEventListener("motionchange", motionChanged);
  context.document.addEventListener("visibilitychange", visibilityChanged);
  update();
  return () => {
    stop();
    context.document.removeEventListener("motionchange", motionChanged);
    context.document.removeEventListener("visibilitychange", visibilityChanged);
  };
}

function foundations({ escape }) {
  return {
    title: "Text becomes a set of coordinates",
    subtitle: "Choose a token and inspect its numerical representation.",
    icon: "tokens",
    note: 'Toy vocabulary, invented IDs and four-dimensional embeddings. This illustration treats "teddy bear" as one token; real tokenizers may split it differently.',
    markup: `<div class="v-input-sentence">a cute teddy bear is reading.</div>
      <div class="v-token-picker" role="group" aria-label="Choose an illustrative token">
        ${TOKENS.map((token, i) => `<button type="button" data-v-token="${i}" aria-pressed="${i === 2}">${escape(token)}<small>ID ${TOKEN_IDS[i]}</small></button>`).join("")}
      </div>
      <div class="v-down-arrow" aria-hidden="true">&darr;</div>
      <div class="v-embedding-layout"><div class="v-embedding-label"><span class="mini-label">Selected token</span><strong data-v-selected-token></strong></div>
        <div class="v-embedding-cells" role="group" aria-label="Four invented embedding dimensions">
          ${[1, 2, 3, 4].map((dimension) => `<div class="v-embedding-cell" data-v-dimension="${dimension - 1}"><small>Dimension ${dimension}</small><output></output><span class="v-dimension-bar" aria-hidden="true"></span></div>`).join("")}
        </div></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      const render = (index) => {
        context.get("[data-v-selected-token]").textContent = TOKENS[index];
        context.root.querySelectorAll("[data-v-token]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.vToken) === index)));
        context.root.querySelectorAll("[data-v-dimension]").forEach((cell, dimension) => {
          const value = EMBEDDINGS[index][dimension];
          cell.querySelector("output").textContent = value.toFixed(2);
          cell.classList.toggle("is-negative", value < 0);
          cell.querySelector(".v-dimension-bar").style.width = `${Math.abs(value) * 100}%`;
        });
        context.get("[data-v-insight]").textContent = `Token ID ${TOKEN_IDS[index]} looks up the vector ${vector(EMBEDDINGS[index])}. The ID is a lookup key; its magnitude does not encode meaning.`;
      };
      context.root.querySelectorAll("[data-v-token]").forEach((button) => button.addEventListener("click", () => render(Number(button.dataset.vToken))));
      render(2);
    },
  };
}

function transformers({ escape }) {
  return {
    title: "See who attends to whom",
    subtitle: "Select a query row. Darker cells carry more attention weight.",
    icon: "model",
    note: "Exact attention calculations over the invented 2D keys and values used in the main attention demo. No causal mask is applied here; these are not learned model weights.",
    markup: `<div class="v-scroll" role="group" tabindex="0" aria-label="Interactive six-token attention heatmap">
      <table class="v-heatmap"><caption>Rows are query tokens; columns are key tokens. Each row sums to 100% before rounding.</caption>
        <thead><tr><th scope="col">Query / key</th>${TOKENS.map((token) => `<th scope="col">${escape(token)}</th>`).join("")}</tr></thead>
        <tbody>${TOKENS.map((token, i) => `<tr data-v-query-row="${i}"><th scope="row"><button type="button" data-v-query="${i}" aria-pressed="${i === 2}">${escape(token)}</button></th>
          ${attention(i).weights.map((weight) => `<td><span class="v-heat-cell" style="--heat:${(weight * 32 + 4).toFixed(2)}%">${(weight * 100).toFixed(1)}<small>%</small></span></td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="v-context-result"><div>${icon("model")}<span>Weighted mixture of value vectors</span></div><output data-v-context-vector></output></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      const render = (index) => {
        const result = attention(index);
        context.root.querySelectorAll("[data-v-query]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.vQuery) === index)));
        context.root.querySelectorAll("[data-v-query-row]").forEach((row) => row.classList.toggle("is-selected", Number(row.dataset.vQueryRow) === index));
        context.get("[data-v-context-vector]").textContent = vector(result.output);
        context.get("[data-v-insight]").textContent = `With "${TOKENS[index]}" as the query, softmax normalizes its six scores. Those weights determine how much each value contributes to the context vector.`;
      };
      context.root.querySelectorAll("[data-v-query]").forEach((button) => button.addEventListener("click", () => render(Number(button.dataset.vQuery))));
      render(2);
    },
  };
}

function languageModels({ escape }) {
  const probabilities = softmax(LOGITS, 0.9);
  return {
    title: "One prompt. Several possible continuations.",
    subtitle: "A language model predicts a distribution, not just one inevitable word.",
    icon: "response",
    note: "Five fixed illustrative logits at temperature 0.9. The draws are real categorical samples, not predictions from a trained model.",
    markup: `<div class="v-completion">The teddy bear is <strong data-v-continuation>&hellip;</strong></div>
      <div class="v-candidate-chart" role="group" aria-label="Illustrative next-token distribution">
        ${CANDIDATES.map((word, i) => `<div class="v-candidate" data-v-candidate="${i}"><span>${escape(word)}</span><div class="v-candidate-track"><span style="width:${probabilities[i] * 100}%" aria-hidden="true"></span></div><output>${(probabilities[i] * 100).toFixed(1)}%</output></div>`).join("")}
      </div><div class="v-actions"><button type="button" class="small-button v-primary" data-v-draw>Draw a next token &rarr;</button><span data-v-draw-count aria-live="polite">No samples yet</span></div>
      <p class="v-insight">Sampling can choose a less likely continuation. Changing temperature changes the distribution; it does not add knowledge.</p>`,
    init(context) {
      let draws = 0;
      context.get("[data-v-draw]").addEventListener("click", () => {
        const index = sample(probabilities);
        draws += 1;
        context.get("[data-v-continuation]").textContent = CANDIDATES[index];
        context.root.querySelectorAll("[data-v-candidate]").forEach((row) => row.classList.toggle("is-selected", Number(row.dataset.vCandidate) === index));
        context.get("[data-v-draw-count]").textContent = `Draw ${draws}: ${CANDIDATES[index]}`;
      });
    },
  };
}

const matrix = (rows, columns, className) => `<div class="v-matrix ${className}" style="--columns:${columns}" aria-hidden="true">${Array.from({ length: rows * columns }, (_, i) => `<span style="--density:${0.25 + ((i * 7 + 3) % 9) / 15}"></span>`).join("")}</div>`;
function training() {
  return {
    title: "A smaller update, not a smaller base model",
    subtitle: "Compare updating a full weight matrix with a low-rank adapter.",
    icon: "matrix",
    note: "Toy 8-by-8 weight matrix with a rank-2 adapter. Counts cover this matrix only, not a full model. LoRA retains the frozen base weights.",
    markup: `<div class="v-methods" role="group" aria-label="Finetuning method"><button type="button" data-v-method="lora" aria-pressed="true">LoRA adapters</button><button type="button" data-v-method="full" aria-pressed="false">Full finetuning</button></div>
      <div class="v-lora-layout"><div class="v-weight-block"><span class="mini-label">Base W &middot; 8 &times; 8</span>${matrix(8, 8, "v-base-matrix")}<strong data-v-base-state>64 frozen weights</strong></div>
        <div class="v-adapters" data-v-adapters><span class="v-operation" aria-hidden="true">+</span><div class="v-weight-block"><span class="mini-label">B &middot; 8 &times; 2</span>${matrix(8, 2, "v-adapter-b")}<strong>16 trainable</strong></div><span class="v-operation" aria-hidden="true">&times;</span>
          <div class="v-weight-block"><span class="mini-label">A &middot; 2 &times; 8</span>${matrix(2, 8, "v-adapter-a")}<strong>16 trainable</strong></div></div></div>
      <div class="v-parameter-count"><div><span class="mini-label">Trainable parameters</span><output data-v-parameters>32</output><span>in this example</span></div><code data-v-weight-equation>W' = W + BA</code></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      const render = (method) => {
        const lora = method === "lora";
        context.root.querySelectorAll("[data-v-method]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.vMethod === method)));
        context.root.classList.toggle("v-full-finetuning", !lora);
        context.get("[data-v-adapters]").hidden = !lora;
        context.get("[data-v-base-state]").textContent = lora ? "64 frozen weights" : "64 trainable weights";
        context.get("[data-v-parameters]").textContent = lora ? "32" : "64";
        context.get("[data-v-weight-equation]").textContent = lora ? "W' = W + BA" : "Update W directly";
        context.get("[data-v-insight]").textContent = lora ? "B and A learn a rank-at-most-2 update. The 64 base weights stay frozen; only the 32 adapter parameters are trained." : "Full finetuning updates all 64 entries in W. This illustration isolates one matrix; total training memory also depends on gradients, optimizer state and the rest of the model.";
      };
      context.root.querySelectorAll("[data-v-method]").forEach((button) => button.addEventListener("click", () => render(button.dataset.vMethod)));
      render("lora");
    },
  };
}

function reinforcementLearning() {
  const stages = [
    ["model", "Policy", "Choose a response", 'A policy assigns probabilities to possible next tokens. Here the illustrative task asks: "What is 1 + 1?"'],
    ["response", "Response", "Answer: 2", "A response is sampled from the policy. This authored example supplies the correct answer, 2; no language model is running."],
    ["reward", "Reward", "Check: 2 = 2", "An exact-answer checker can assign a verifiable reward. This toy response receives +1 for correctness."],
    ["loop", "Update", "Improve the policy", "Training uses sampled responses and rewards to update the policy. A reward signal is feedback, not a guarantee of good behavior in every task."],
  ];
  return {
    title: "Learning is a feedback loop",
    subtitle: "Follow the path from a sampled response to a policy update.",
    icon: "loop",
    note: "A conceptual reinforcement-learning loop with an authored response and a toy reward. It does not execute PPO, GRPO or a policy-gradient update.",
    markup: `<div class="v-feedback-loop">${stages.map(([symbol, title, label], i) => `<div class="v-loop-node" data-v-loop-node="${i}"><span class="v-node-index">${i + 1}</span>${icon(symbol)}<strong>${title}</strong><span>${label}</span></div>`).join("")}</div>
      <div class="v-loop-return">${icon("loop")}<span>The updated policy supplies the next response.</span></div>
      ${controls(stages.map(([, title]) => title))}<p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      return wireStages(context, stages.length, (stage) => {
        context.root.querySelectorAll("[data-v-loop-node]").forEach((node) => node.classList.toggle("is-selected", Number(node.dataset.vLoopNode) === stage));
        context.get("[data-v-insight]").textContent = stages[stage][3];
      });
    },
  };
}

function systems({ escape }) {
  return {
    title: "Remember the past. Compute the next token.",
    subtitle: "Prefill builds a KV cache. Decoding adds one position at a time.",
    icon: "matrix",
    note: "One illustrative layer and head; K/V cells stand for vectors. Tokens follow a fixed teaching sequence, not model inference. The KV cache stores attention keys and values, not the whole hidden state.",
    markup: `<div class="v-cache-header"><span class="v-phase" data-v-cache-phase>Prefill</span><span data-v-cache-count aria-live="polite"></span></div>
      <div class="v-cache-grid" role="group" aria-label="Six token positions and their cached keys and values">${TOKENS.map((token, i) => `<div class="v-cache-column" data-v-cache-column="${i}"><span class="v-position">Position ${i + 1}</span><strong data-v-cache-token="${i}">${escape(token)}</strong><span class="v-cache-cell">K${i + 1}</span><span class="v-cache-cell">V${i + 1}</span><small data-v-cache-state="${i}"></small></div>`).join("")}</div>
      <div class="v-cache-legend"><span><i class="v-cache-old" aria-hidden="true"></i>Reuse earlier vectors</span><span><i class="v-cache-new" aria-hidden="true"></i>Compute new vectors</span></div>
      <div class="v-actions"><button type="button" class="small-button v-primary" data-v-next>Decode one token &rarr;</button><button type="button" class="text-button" data-v-reset>Reset to prefill</button></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      return wireStages(context, 4, (stage) => {
        const cached = 3 + stage;
        context.get("[data-v-cache-phase]").textContent = stage === 0 ? "Prefill" : `Decode ${stage}`;
        context.get("[data-v-cache-count]").textContent = `${cached} token positions cached`;
        context.root.querySelectorAll("[data-v-cache-column]").forEach((column, i) => {
          const present = i < cached;
          const fresh = stage === 0 ? present : i === cached - 1;
          column.classList.toggle("is-cached", present);
          column.classList.toggle("is-new", fresh);
          context.get(`[data-v-cache-token="${i}"]`).textContent = present ? TOKENS[i] : "Next token";
          context.get(`[data-v-cache-state="${i}"]`).textContent = !present ? "not yet" : fresh ? "new" : "reused";
        });
        context.get("[data-v-insight]").textContent = stage === 0 ? "The three prompt tokens are processed to initialize their keys and values. Now decode a token and watch the earlier cache entries stay in place." : `Added "${TOKENS[cached - 1]}". Earlier keys and values are reused; this step adds the new token's vectors to the cache.`;
      });
    },
  };
}

function agents() {
  const explanations = [
    "Start with a question. The surrounding harness decides whether retrieval or another tool is needed.",
    "Retrieve candidate documents. Retrieval may return irrelevant material as well as useful context.",
    "Rerank the candidates and select relevant context. Here the course notes and lecture extract are selected; the recipe is not.",
    "Add the selected context to the prompt and generate a response. Grounding can help, but retrieval does not guarantee factual correctness.",
  ];
  return {
    title: "A useful answer starts outside the model",
    subtitle: "Follow a small retrieval-augmented generation workflow.",
    icon: "document",
    note: "Scripted RAG illustration with invented documents and an authored response. It does not search the web, retrieve real files or call a model.",
    markup: `<div class="v-rag-question">${icon("response")}<span>How does attention work?</span></div>
      ${controls(["Ask", "Retrieve", "Rerank", "Generate"])}
      <div class="v-document-stack">${["Course notes", "Lecture extract", "Unrelated recipe"].map((title, i) => `<div class="v-document-card" data-v-document="${i}">${icon("document")}<div><strong>${title}</strong><span>${["Query, key and value vectors", "Attention weights and context", "Ingredients and cooking steps"][i]}</span></div><span class="v-document-state" data-v-document-state="${i}"></span></div>`).join("")}</div>
      <div class="v-rag-answer" data-v-rag-answer hidden><span class="mini-label">Illustrative response &middot; selected context</span><p>Queries compare with keys. The resulting attention weights form a weighted mixture of values.</p><span class="v-context-tag">Course notes</span><span class="v-context-tag">Lecture extract</span></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      return wireStages(context, explanations.length, (stage) => {
        context.root.querySelectorAll("[data-v-document]").forEach((card, i) => {
          card.classList.toggle("is-retrieved", stage >= 1);
          card.classList.toggle("is-selected", stage >= 2 && i < 2);
          card.classList.toggle("is-rejected", stage >= 2 && i === 2);
          context.get(`[data-v-document-state="${i}"]`).textContent = stage === 0 ? "waiting" : stage === 1 ? "candidate" : i < 2 ? "selected" : "excluded";
        });
        context.get("[data-v-rag-answer]").hidden = stage !== 3;
        context.get("[data-v-insight]").textContent = explanations[stage];
      });
    },
  };
}

function evaluation() {
  return {
    title: "An impressive answer is not always a correct one",
    subtitle: "Compare two authored responses against the same small rubric.",
    icon: "reward",
    note: "Authored examples and illustrative pass/fail judgments, not results from an LLM judge or a benchmark. Real judging needs calibration and checks for bias.",
    markup: `<p class="v-evaluation-question">What does a causal attention mask block?</p>
      <div class="v-answer-options" role="group" aria-label="Response to evaluate">
        <button type="button" data-v-answer="0" aria-pressed="true"><span class="mini-label">Response A</span>It prevents a token from attending to positions after it.</button>
        <button type="button" data-v-answer="1" aria-pressed="false"><span class="mini-label">Response B</span>It removes all low-probability tokens, automatically improving speed and guaranteeing that every generated answer is accurate.</button></div>
      <div class="v-rubric">${["Correct masking mechanism", "Answers the actual question", "Avoids unsupported guarantees"].map((label, i) => `<div class="v-rubric-row"><span>${label}</span><strong data-v-rubric="${i}"></strong></div>`).join("")}</div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>`,
    init(context) {
      const render = (answer) => {
        context.root.querySelectorAll("[data-v-answer]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.vAnswer) === answer)));
        context.root.querySelectorAll("[data-v-rubric]").forEach((criterion) => {
          criterion.textContent = answer === 0 ? "Pass" : "Fail";
          criterion.classList.toggle("is-failed", answer !== 0);
        });
        context.get("[data-v-insight]").textContent = answer === 0 ? "The concise response correctly describes future-position masking. Length is not evidence of quality." : "The longer response confuses causal attention with token filtering and adds unsupported guarantees. A confident tone does not repair the mechanism.";
      };
      context.root.querySelectorAll("[data-v-answer]").forEach((button) => button.addEventListener("click", () => render(Number(button.dataset.vAnswer))));
      render(0);
    },
  };
}

function diffusion({ escape }) {
  return {
    title: "Watch a sentence emerge from the masks",
    subtitle: "Step through the reconstruction. Later positions can appear first.",
    icon: "diffusion",
    note: "Scripted discrete masked-diffusion illustration. This fixed schedule only unmasks tokens; real schedules can also revise or remask them. Step counts are not a speed comparison with autoregressive generation.",
    markup: `<div class="v-denoising-header"><span class="v-phase">Masked diffusion</span><output data-v-denoising-count aria-live="polite">0 / 6 positions reconstructed</output></div>
      <div class="v-denoising-sequence" role="group" aria-label="Six positions in the illustrative masked sequence">${TOKENS.map((_, i) =>
        `<div class="v-denoising-token" data-v-denoising-position="${i}"><small>Position ${i + 1}</small><strong data-v-denoising-word="${i}">[MASK]</strong><span data-v-denoising-state="${i}">masked</span></div>`).join("")}</div>
      <div class="v-denoising-timeline" role="group" aria-label="Choose a denoising step">${DIFFUSION_FRAMES.map((_, i) => `<button type="button" data-v-stage="${i}" aria-pressed="${i === 0}"><span>${i}</span><small>${i === 0 ? "Start" : i === 4 ? "Complete" : `Step ${i}`}</small></button>`).join("")}</div>
      <div class="v-actions"><button type="button" class="small-button v-primary" data-v-play aria-pressed="false">Play sequence</button><button type="button" class="small-button" data-v-next>Next step &rarr;</button><button type="button" class="text-button" data-v-reset>Reset</button></div>
      <p class="v-insight" data-v-insight aria-live="polite"></p>
      <details class="v-history"><summary>See the whole reconstruction schedule</summary><div class="v-scroll" role="group" tabindex="0" aria-label="All five stages of the denoising schedule"><table class="v-schedule"><caption>The same six positions across five scripted stages.</caption><thead><tr><th scope="col">Step</th>${TOKENS.map((_, i) => `<th scope="col">Position ${i + 1}</th>`).join("")}</tr></thead>
        <tbody>${DIFFUSION_FRAMES.map((frame, i) => `<tr data-v-history-row="${i}"><th scope="row">${i}</th>${frame.map((token) => `<td class="${token === "[MASK]" ? "v-masked-cell" : ""}">${escape(token)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`,
    init(context) {
      return wireStages(context, DIFFUSION_FRAMES.length, (stage) => {
        const frame = DIFFUSION_FRAMES[stage];
        const filled = frame.filter((token) => token !== "[MASK]").length;
        context.get("[data-v-denoising-count]").textContent = `${filled} / 6 positions reconstructed`;
        context.root.querySelectorAll("[data-v-denoising-position]").forEach((cell, i) => {
          const masked = frame[i] === "[MASK]";
          const fresh = !masked && stage > 0 && DIFFUSION_FRAMES[stage - 1][i] === "[MASK]";
          cell.classList.toggle("is-masked", masked);
          cell.classList.toggle("is-new", fresh);
          context.get(`[data-v-denoising-word="${i}"]`).textContent = frame[i];
          context.get(`[data-v-denoising-state="${i}"]`).textContent = masked ? "masked" : fresh ? "newly reconstructed" : "kept";
        });
        context.root.querySelectorAll("[data-v-history-row]").forEach((row) => row.classList.toggle("is-selected", Number(row.dataset.vHistoryRow) === stage));
        context.get("[data-v-insight]").textContent = stage === 0 ? "Every position starts masked. Play the sequence or choose a step to see how reconstruction proceeds." :
          stage === 1 ? 'Positions 2 and 5 reveal "cute" and "reading", while the first position is still masked. Reconstruction need not proceed left to right.' :
            stage === 4 ? "The complete sentence is visible. This particular schedule fills each position once; other diffusion schedules can revise earlier predictions." :
              `Step ${stage}: ${filled} of six positions are visible. Newly reconstructed tokens are marked; previously accepted tokens stay in place in this toy schedule.`;
      }, { animate: true });
    },
  };
}

const VISUALS = {
  foundations, transformers, "language-models": languageModels, training,
  "reinforcement-learning": reinforcementLearning, systems, agents, evaluation, diffusion,
};

export function mountChapterVisual(root, topic, { escape, isMotionEnabled }) {
  if (!Object.hasOwn(VISUALS, topic)) throw new RangeError(`No chapter illustration is defined for ${topic}.`);
  const definition = VISUALS[topic]({ escape });
  root.dataset.visualTopic = topic;
  root.innerHTML = `<div class="v-figure-heading">${icon(definition.icon)}<div><span class="eyebrow">Explore the idea</span><h3 id="chapter-visual-title">${definition.title}</h3></div><span class="v-interactive-label">Interactive</span></div>
    <p class="v-subtitle">${definition.subtitle}</p><div class="v-figure-body">${definition.markup}</div><figcaption>${definition.note}</figcaption>`;
  const context = {
    root, escape, isMotionEnabled, document: root.ownerDocument, window: root.ownerDocument.defaultView,
    get(selector) {
      const element = root.querySelector(selector);
      if (!element) throw new Error(`Missing ${selector} in the ${topic} illustration.`);
      return element;
    },
  };
  return definition.init(context) ?? (() => {});
}
