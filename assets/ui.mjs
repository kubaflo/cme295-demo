import {
  ATTENTION_STEPS, CANDIDATES, DIFFUSION_FRAMES, KEYS, LOGITS, TOKENS, VALUES,
  attention, entropy, sample, softmax,
} from "./models.mjs";
import { DIRECTIONS, SOURCE, TOPICS, matchesTopic } from "./content.mjs";
import { mountChapterVisual } from "./chapter-visuals.mjs";
import { mountChapterQuiz } from "./chapter-quiz.mjs";
import { createQuizState } from "./quiz-data.mjs";

const escape = (text) => String(text).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));
const vector = (values) => `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
const percent = (value) => `${(value * 100).toFixed(1)}%`;

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let motionEnabled = !motionPreference.matches;
const preview = new URLSearchParams(location.search).get("preview") === "1";
if (preview) {
  document.body.classList.add("preview");
  document.body.inert = true;
}

function setMotion(enabled) {
  motionEnabled = enabled;
  document.documentElement.style.scrollBehavior = enabled ? "smooth" : "auto";
  document.body.classList.toggle("motion-off", !enabled);
  document.body.classList.toggle("motion-on", enabled);
  document.querySelectorAll("[data-motion-toggle]").forEach((button) => {
    button.textContent = enabled ? "Motion on" : "Motion off";
    button.setAttribute("aria-pressed", String(enabled));
  });
  document.dispatchEvent(new CustomEvent("motionchange", { detail: enabled }));
}

function mountChrome() {
  const designbar = document.querySelector("[data-designbar]");
  if (designbar) {
    const direction = DIRECTIONS.find((item) => item.id === document.body.dataset.theme);
    designbar.innerHTML = `
    <a class="back-link" href="design-studies.html#designs"><span aria-hidden="true">&larr;</span> Earlier design studies</a>
    <details class="design-switcher">
      <summary>${direction.number} / ${direction.name}</summary>
      <nav aria-label="Design directions">
        ${DIRECTIONS.map((item) => `<a href="${item.file}" ${item.id === direction.id ? 'aria-current="page"' : ""}>
          <span>${item.number}</span> ${item.name}</a>`).join("")}
      </nav>
    </details>
    <div class="designbar-end"><span class="local-label">Local design prototype</span>
      <button type="button" class="motion-toggle" data-motion-toggle aria-pressed="true">Motion on</button>
    </div>`;
  }
  const creditNote = document.body.dataset.theme === "stanford"
    ? "A personal learning companion, not an official Stanford website, Microsoft project or author-approved edition. Selected concepts are paraphrased; the numerical examples are illustrative, not trained models."
    : "A personal design study, not an official Microsoft project or author-approved edition. Selected concepts are paraphrased; the numerical demos are deliberately illustrative, not trained models.";
  document.querySelector("[data-credit]").innerHTML = `
    <div><span class="eyebrow">The ideas behind the interface</span>
      <p>Based on the English <a href="${SOURCE.repository}" target="_blank" rel="noopener noreferrer">CME 295 VIP Cheatsheet</a>
      by <strong>${SOURCE.authors}</strong>.</p>
      <p class="website-credit" data-site-creator>Website created by <a href="https://www.linkedin.com/in/jakub-florkowski/" target="_blank" rel="noopener noreferrer"><strong>Jacob Florkowski</strong></a> (Microsoft).</p>
      <p class="credit-note">${creditNote}</p></div>
    <nav aria-label="Source and credits">
      <a href="assets/source-en.pdf" target="_blank" rel="noopener">Original English PDF &nearr;</a>
      <a href="${SOURCE.book}" target="_blank" rel="noopener noreferrer">The book &nearr;</a>
      <a href="credits.html">Attribution &amp; licenses</a>
    </nav>`;
  document.querySelectorAll("[data-motion-toggle]").forEach((button) => {
    button.addEventListener("click", () => setMotion(!motionEnabled));
  });
  motionPreference.addEventListener("change", (event) => setMotion(!event.matches));
  setMotion(motionEnabled);
}

function mountAttention(root) {
  root.innerHTML = `
    <div class="widget-heading">
      <div><span class="eyebrow">Experiment 01 / Transformers</span><h2 id="attention-heading">${escape(root.dataset.title ?? "Follow the attention.")}</h2></div>
      <span class="widget-tag">LIVE TOY EXAMPLE</span>
    </div>
    <p class="widget-intro">Choose a query token. Watch its compatibility with every key become a weighted mix of values.</p>
    <div class="attention-equation" role="group" tabindex="0" aria-label="Attention of Q, K and V equals softmax of Q K transpose divided by the square root of d k, multiplied by V.">
      <math display="block">
        <mrow><mi mathvariant="normal">Attention</mi><mo>(</mo><mi>Q</mi><mo>,</mo><mi>K</mi><mo>,</mo><mi>V</mi><mo>)</mo><mo>=</mo>
          <mi mathvariant="normal">softmax</mi><mo>(</mo>
          <mfrac><mrow><mi>Q</mi><msup><mi>K</mi><mi>T</mi></msup></mrow><msqrt><msub><mi>d</mi><mi>k</mi></msub></msqrt></mfrac>
          <mo>)</mo><mi>V</mi></mrow>
      </math>
    </div>
    <div class="query-readout"><span>Query <strong data-query-name>teddy bear</strong></span><code data-query-vector></code></div>
    <div class="attention-visual">
      <svg class="attention-connections" viewBox="0 0 600 110" aria-hidden="true">
        ${TOKENS.map((_, i) => `<path data-connection="${i}" fill="none"/>`).join("")}
      </svg>
      <div class="attention-tokens" role="group" aria-label="Choose the query token">
        ${TOKENS.map((token, i) => `<button class="attention-token" type="button" data-query="${i}" aria-pressed="${i === 2}">
          <span class="token-label">${escape(token)}</span><span class="weight-track" aria-hidden="true"><span data-weight-bar="${i}"></span></span>
          <span class="token-weight" data-weight="${i}"></span></button>`).join("")}
      </div>
    </div>
    <div class="attention-controls">
      <label class="range-control" for="query-scale">Query scale <output for="query-scale" data-scale-output>1.00</output>
        <input id="query-scale" type="range" min="0.25" max="2" step="0.05" value="1" aria-describedby="toy-attention-note">
      </label>
      <label class="check-control" for="causal-mask"><input id="causal-mask" type="checkbox"> Causal mask</label>
      <button class="text-button" type="button" data-attention-reset>Reset</button>
    </div>
    <div class="attention-result"><div><span class="mini-label">Weight sum</span><output data-weight-sum>1.000</output></div>
      <div><span class="mini-label">Context vector &middot; weighted sum of V</span><output data-context-vector></output></div></div>
    <div class="stepper">
      <ol class="attention-steps" aria-label="Attention calculation stages">
        ${ATTENTION_STEPS.map((step, i) => `<li><button type="button" data-stage="${i}" aria-pressed="${i === 0}">
          <span>${String(i + 1).padStart(2, "0")}</span> ${step.label}</button></li>`).join("")}
      </ol>
      <div class="step-note"><p data-stage-note aria-live="polite"></p>
        <button class="small-button" type="button" data-next-stage>Next stage <span aria-hidden="true">&rarr;</span></button></div>
    </div>
    <details class="math-inspector">
      <summary>Inspect the vectors &amp; scores</summary>
      <div class="table-scroll" role="group" tabindex="0" aria-label="Attention vectors and scores"><table>
        <caption>Two-dimensional toy keys and values; scores are divided by sqrt(2).</caption>
        <thead><tr><th scope="col">Token</th><th scope="col">Key k</th><th scope="col">Value v</th><th scope="col">q &middot; k</th><th scope="col">Scaled score</th><th scope="col">Weight</th></tr></thead>
        <tbody>${TOKENS.map((token, i) => `<tr><th scope="row">${escape(token)}</th><td>${vector(KEYS[i])}</td><td>${vector(VALUES[i])}</td>
          <td data-dot="${i}"></td><td data-score="${i}"></td><td data-table-weight="${i}"></td></tr>`).join("")}</tbody>
      </table></div>
    </details>
    <p class="demo-disclaimer" id="toy-attention-note">Invented 2D vectors, not learned weights. This vocabulary treats &ldquo;teddy bear&rdquo; as one token.
      Query scale multiplies q; it is a teaching control, not an extra term in the attention formula.</p>`;

  let queryIndex = 2;
  let stage = 0;
  const scale = root.querySelector("#query-scale");
  const causal = root.querySelector("#causal-mask");

  function render() {
    const result = attention(queryIndex, Number(scale.value), causal.checked);
    root.querySelector("[data-query-name]").textContent = TOKENS[queryIndex];
    root.querySelector("[data-query-vector]").textContent = `q = ${vector(result.query)}`;
    root.querySelector("[data-scale-output]").textContent = Number(scale.value).toFixed(2);
    root.querySelector("[data-weight-sum]").textContent = result.weights.reduce((sum, weight) => sum + weight, 0).toFixed(3);
    root.querySelector("[data-context-vector]").textContent = vector(result.output);
    root.querySelectorAll("[data-query]").forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === queryIndex));
      button.setAttribute("aria-label", `Use ${TOKENS[i]} as query. Current attention weight ${percent(result.weights[i])}${causal.checked && i > queryIndex ? ", masked" : ""}.`);
      button.classList.toggle("masked", causal.checked && i > queryIndex);
      root.querySelector(`[data-weight="${i}"]`).textContent = percent(result.weights[i]);
      root.querySelector(`[data-weight-bar="${i}"]`).style.width = percent(result.weights[i]);
      const path = root.querySelector(`[data-connection="${i}"]`);
      const from = 50 + queryIndex * 100;
      const to = 50 + i * 100;
      const rise = i === queryIndex ? 12 : Math.max(4, 68 - Math.abs(i - queryIndex) * 17);
      path.setAttribute("d", `M ${from} 106 C ${from - 25} ${rise}, ${to + 25} ${rise}, ${to} 106`);
      path.style.strokeWidth = String(1 + result.weights[i] * 7);
      path.style.opacity = result.weights[i] === 0 ? "0" : String(0.18 + result.weights[i] * 0.82);
      root.querySelector(`[data-dot="${i}"]`).textContent = result.dots[i].toFixed(3);
      root.querySelector(`[data-score="${i}"]`).textContent = result.scores[i] === -Infinity ? "masked" : result.scores[i].toFixed(3);
      root.querySelector(`[data-table-weight="${i}"]`).textContent = percent(result.weights[i]);
    });
  }

  function renderStage() {
    root.querySelectorAll("[data-stage]").forEach((button, i) => button.setAttribute("aria-pressed", String(stage === i)));
    root.querySelector("[data-stage-note]").textContent = ATTENTION_STEPS[stage].explanation;
    root.dataset.attentionStage = String(stage);
  }

  root.querySelectorAll("[data-query]").forEach((button) => button.addEventListener("click", () => {
    queryIndex = Number(button.dataset.query);
    render();
  }));
  scale.addEventListener("input", render);
  causal.addEventListener("change", render);
  root.querySelectorAll("[data-stage]").forEach((button) => button.addEventListener("click", () => {
    stage = Number(button.dataset.stage);
    renderStage();
  }));
  root.querySelector("[data-next-stage]").addEventListener("click", () => {
    stage = (stage + 1) % ATTENTION_STEPS.length;
    renderStage();
  });
  root.querySelector("[data-attention-reset]").addEventListener("click", () => {
    queryIndex = 2;
    scale.value = "1";
    causal.checked = false;
    stage = 0;
    render();
    renderStage();
  });
  if (document.body.dataset.theme === "manual") root.querySelector(".math-inspector").open = true;
  render();
  renderStage();
}

function mountTemperature(root) {
  root.innerHTML = `
    <div class="widget-heading"><div><span class="eyebrow">Experiment 02 / Decoding</span>
      <h2>${escape(root.dataset.title ?? "Turn up the possibilities.")}</h2></div><span class="widget-tag">TEMPERATURE</span></div>
    <p class="widget-intro">Same logits. Different distribution. How might &ldquo;The teddy bear is&hellip;&rdquo; continue?</p>
    <label class="temperature-control" for="temperature-range">Temperature <output for="temperature-range" data-temperature-output>0.90</output>
      <input id="temperature-range" type="range" min="0.15" max="2" step="0.05" value="0.9" aria-describedby="temperature-note">
    </label>
    <div class="range-labels"><span>More concentrated</span><span>More varied</span></div>
    <div class="probabilities" role="group" aria-label="Next-token probabilities">
      ${CANDIDATES.map((word, i) => `<div class="probability-row"><span>${word}</span>
        <div class="probability-track" aria-hidden="true"><span data-probability-bar="${i}"></span></div>
        <output data-probability="${i}" aria-label="Probability of ${word}"></output></div>`).join("")}
    </div>
    <div class="sampling-actions"><div><span class="mini-label">Entropy</span> <output data-entropy></output> <span class="unit">bits</span></div>
      <button type="button" class="primary-button" data-sample>Sample 10 tokens <span aria-hidden="true">&nearr;</span></button></div>
    <div class="sample-output" aria-live="polite"><p>Draw a sample to see the distribution in action.</p></div>
    <p class="demo-disclaimer" id="temperature-note">Five fixed illustrative logits, not model predictions. Samples are random draws.
      Low temperature is more concentrated, but not inherently deterministic.</p>`;
  const slider = root.querySelector("#temperature-range");

  function render() {
    const probabilities = softmax(LOGITS, Number(slider.value));
    root.querySelector("[data-temperature-output]").textContent = Number(slider.value).toFixed(2);
    root.querySelector("[data-entropy]").textContent = entropy(probabilities).toFixed(2);
    probabilities.forEach((probability, i) => {
      root.querySelector(`[data-probability="${i}"]`).textContent = percent(probability);
      root.querySelector(`[data-probability-bar="${i}"]`).style.width = percent(probability);
    });
    root.querySelector(".sample-output").innerHTML = "<p>Draw a sample to see the distribution in action.</p>";
  }
  slider.addEventListener("input", render);
  root.querySelector("[data-sample]").addEventListener("click", () => {
    const probabilities = softmax(LOGITS, Number(slider.value));
    const draws = Array.from({ length: 10 }, () => CANDIDATES[sample(probabilities)]);
    root.querySelector(".sample-output").innerHTML = `
      <span class="mini-label">10 samples at T = ${Number(slider.value).toFixed(2)}</span>
      <ol class="sample-tokens" aria-label="Sampled next tokens">${draws.map((word) => `<li>${word}</li>`).join("")}</ol>`;
  });
  render();
}

function mountDiffusion(root) {
  root.innerHTML = `
    <div class="widget-heading"><div><span class="eyebrow">Experiment 03 / Diffusion</span>
      <h2>${escape(root.dataset.title ?? "Reveal, then refine.")}</h2></div><span class="widget-tag">MASKED DIFFUSION</span></div>
    <p class="widget-intro">Not every language model writes left to right. A masked sequence can be reconstructed in another order.</p>
    <div class="diffusion-sequence" aria-live="polite" aria-atomic="true">
      ${TOKENS.map((_, i) => `<span class="diffusion-token is-masked" data-diffusion-token="${i}">[MASK]</span>`).join("")}
    </div>
    <div class="diffusion-progress"><progress max="4" value="0" aria-label="Illustrative denoising step"></progress>
      <output data-diffusion-step>Step 0 / 4</output></div>
    <div class="diffusion-controls"><button class="primary-button" type="button" data-diffusion-play>Play sequence <span aria-hidden="true">&rarr;</span></button>
      <button class="small-button" type="button" data-diffusion-next>Next step</button>
      <button class="text-button" type="button" data-diffusion-reset>Reset</button></div>
    <p class="diffusion-status" aria-live="polite">Start with a fully masked sequence.</p>
    <p class="demo-disclaimer">A scripted illustration, not a running diffusion model. The fixed schedule only unmasks tokens;
      real schedules may also revise or remask them.</p>`;
  let frame = 0;
  let timer = null;
  const play = root.querySelector("[data-diffusion-play]");
  const next = root.querySelector("[data-diffusion-next]");
  const status = root.querySelector(".diffusion-status");

  function stop() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    play.setAttribute("aria-pressed", "false");
    play.textContent = frame === 4 ? "Replay sequence" : "Play sequence";
  }
  function render() {
    DIFFUSION_FRAMES[frame].forEach((token, i) => {
      const element = root.querySelector(`[data-diffusion-token="${i}"]`);
      element.textContent = token;
      element.classList.toggle("is-masked", token === "[MASK]");
    });
    root.querySelector("progress").value = frame;
    root.querySelector("[data-diffusion-step]").textContent = `Step ${frame} / 4`;
    next.disabled = frame === 4;
    status.textContent = frame === 0 ? "Start with a fully masked sequence." :
      frame === 4 ? "The sequence is complete. Notice the non-left-to-right reveal order." :
      `Denoising step ${frame}: ${DIFFUSION_FRAMES[frame].filter((token) => token !== "[MASK]").length} of 6 positions filled.`;
  }
  function advance() {
    frame += 1;
    render();
    if (frame < 4) timer = setTimeout(advance, 850);
    else stop();
  }
  play.addEventListener("click", () => {
    if (timer !== null) {
      stop();
      status.textContent = "Sequence paused. Continue manually with Next step, or play it again.";
      return;
    }
    if (!motionEnabled) {
      frame = 4;
      render();
      stop();
      status.textContent = "Complete sequence shown without animation. Use Reset and Next step to inspect each stage.";
      return;
    }
    frame = 0;
    render();
    play.textContent = "Pause sequence";
    play.setAttribute("aria-pressed", "true");
    timer = setTimeout(advance, 850);
  });
  next.addEventListener("click", () => {
    stop();
    frame = Math.min(frame + 1, 4);
    render();
    stop();
  });
  root.querySelector("[data-diffusion-reset]").addEventListener("click", () => {
    stop();
    frame = 0;
    render();
    stop();
  });
  document.addEventListener("motionchange", (event) => {
    if (!event.detail) stop();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  render();
  stop();
}

function mountTopics() {
  const panel = document.querySelector("[data-topic-panel]");
  const navs = document.querySelectorAll("[data-topic-nav]");
  const initialTopic = document.body.dataset.initialTopic ?? "transformers";
  const showVisuals = document.body.dataset.topicVisuals === "true";
  const showQuizzes = document.body.dataset.topicQuizzes === "true";
  const quizStates = new Map();
  let disposeVisual = () => {};
  navs.forEach((nav) => {
    nav.innerHTML = TOPICS.map((topic) => `
      <button type="button" class="topic-link" data-topic="${topic.id}" aria-pressed="${topic.id === initialTopic}" aria-controls="topic-content">
        <span class="topic-number">${topic.number}</span><span>${topic.name}</span><span class="topic-arrow" aria-hidden="true">&nearr;</span>
      </button>`).join("");
  });

  function selectTopic(id, scroll = false) {
    const topic = TOPICS.find((item) => item.id === id);
    const sourcePage = `<a class="source-page" href="assets/source-en.pdf#page=${topic.page}" target="_blank" rel="noopener">Source p. ${topic.page} &nearr;</a>`;
    const topicActions = showQuizzes
      ? `<div class="course-topic-actions"><a class="source-page quiz-jump" href="#chapter-quiz">Quiz yourself &rarr;</a>${sourcePage}</div>`
      : sourcePage;
    disposeVisual();
    panel.innerHTML = `
      <div class="topic-panel-heading"><div><span class="eyebrow">Chapter ${topic.number} / Selected concepts</span>
        <h2 tabindex="-1">${topic.name}</h2></div>${topicActions}</div>
      <p class="topic-summary">${topic.summary}</p>
      ${showVisuals ? '<figure class="chapter-visual" data-chapter-visual aria-labelledby="chapter-visual-title"></figure>' : ""}
      <div class="concepts">${topic.concepts.map(([name, description], i) => `
        <details class="concept" ${i === 0 ? "open" : ""}><summary>${name}<span aria-hidden="true">+</span></summary><p>${description}</p></details>`).join("")}</div>
      <p class="demo-disclaimer">A concise, editorially qualified preview of this chapter; not the full cheatsheet or book.</p>
      ${showQuizzes ? '<section id="chapter-quiz" class="chapter-quiz" data-chapter-quiz aria-labelledby="quiz-heading"></section>' : ""}`;
    if (showVisuals) {
      disposeVisual = mountChapterVisual(panel.querySelector("[data-chapter-visual]"), id, {
        escape, isMotionEnabled: () => motionEnabled,
      });
    }
    if (showQuizzes) {
      if (!quizStates.has(id)) quizStates.set(id, createQuizState(id));
      mountChapterQuiz(panel.querySelector("[data-chapter-quiz]"), topic, { escape, state: quizStates.get(id) });
    }
    navs.forEach((nav) => nav.querySelectorAll("[data-topic]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.topic === id));
    }));
    if (scroll) {
      panel.scrollIntoView({ behavior: motionEnabled ? "smooth" : "auto", block: "start" });
      panel.querySelector("h2").focus({ preventScroll: true });
    }
  }
  navs.forEach((nav) => nav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (button) selectTopic(button.dataset.topic, true);
  }));
  document.querySelectorAll("[data-topic-search]").forEach((input) => input.addEventListener("input", () => {
    const query = input.value.toLocaleLowerCase().trim();
    let matches = 0;
    TOPICS.forEach((topic) => {
      const visible = matchesTopic(topic, query);
      if (visible) matches += 1;
      navs.forEach((nav) => {
        nav.querySelector(`[data-topic="${topic.id}"]`).hidden = !visible;
      });
    });
    document.querySelectorAll("[data-search-status]").forEach((status) => {
      status.textContent = query ? `${matches} matching chapter${matches === 1 ? "" : "s"}` : "9 chapters";
    });
  }));
  selectTopic(initialTopic);
}

function showError(message) {
  const notice = document.querySelector("[data-app-error]");
  notice.hidden = false;
  notice.textContent = `The interactive demo encountered an error: ${message}. Reload the page; if it persists, use the original PDF.`;
}

window.addEventListener("message", (event) => {
  if (event.origin === location.origin && event.source === parent &&
      event.data?.type === "prototype-motion" && typeof event.data.enabled === "boolean") {
    setMotion(event.data.enabled);
  }
});
window.addEventListener("error", (event) => showError(event.message));
window.addEventListener("unhandledrejection", (event) => showError(String(event.reason)));
mountChrome();
document.querySelectorAll("[data-attention]").forEach(mountAttention);
document.querySelectorAll("[data-temperature]").forEach(mountTemperature);
document.querySelectorAll("[data-diffusion]").forEach(mountDiffusion);
if (document.querySelector("[data-topic-panel]")) mountTopics();
const compactRail = matchMedia("(max-width: 780px)");
const updateRails = () => document.querySelectorAll("[data-responsive-rail]").forEach((rail) => {
  rail.open = !compactRail.matches;
});
compactRail.addEventListener("change", updateRails);
updateRails();
document.body.classList.add("ready");
