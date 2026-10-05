import { createQuizState, getQuiz, isCorrectAnswer, missedQuestions, quizBreakdown, quizScore } from "./quiz-data.mjs";

export function mountChapterQuiz(root, topic, { escape, state }) {
  const questions = getQuiz(topic.id);
  quizScore(topic.id, state.answers, state.order);
  if (!state.order.includes(state.index) || !["chapter", "mistakes"].includes(state.mode) ||
      !Array.isArray(state.selections) || state.selections.length !== questions.length) {
    throw new RangeError("The quiz position, selections and practice mode must belong to this chapter.");
  }
  for (const [index, selection] of state.selections.entries()) {
    if (selection !== null) isCorrectAnswer(questions[index], selection);
  }
  if (state.mode === "mistakes" && state.originalAnswers === null) {
    throw new Error("Mistake practice needs a completed original attempt.");
  }
  if (state.originalAnswers !== null &&
      quizScore(topic.id, state.originalAnswers).answered !== questions.length) {
    throw new Error("The saved chapter attempt must be complete.");
  }
  root.dataset.quizTopic = topic.id;
  root.innerHTML = `<div class="quiz-heading"><div><span class="eyebrow">Chapter ${escape(topic.number)} / Knowledge check</span>
      <h3 id="quiz-heading">Put your knowledge to work</h3></div><span class="quiz-count" data-quiz-count></span></div>
    <p class="quiz-intro" data-quiz-intro></p>
    <p class="quiz-original-score" data-quiz-original-score hidden></p>
    <div class="quiz-progress-heading"><span data-quiz-position></span><span>Correct <strong data-quiz-score></strong></span></div>
    <div class="quiz-progress" role="progressbar" aria-label="Questions answered in this round" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="0"><span data-quiz-progress-fill></span></div>
    <nav class="quiz-navigator" aria-label="Chapter quiz questions">
      <div class="quiz-map-heading"><span>Jump to a question</span><span data-quiz-answered></span></div>
      <ol class="quiz-question-map" data-quiz-map></ol>
      <p class="quiz-map-key"><span>&#10003; Correct</span><span>! Revisit</span><span>&#8226; Selected, not checked</span></p>
    </nav>
    <div id="quiz-content" class="quiz-content" data-quiz-content></div>
    <div class="quiz-feedback" role="status" aria-live="polite" aria-atomic="true" data-quiz-feedback></div>
    <div class="quiz-actions"><button type="button" class="small-button quiz-action" data-quiz-action aria-controls="quiz-content">Check answer</button>
      <button type="button" class="small-button quiz-action" data-quiz-mistakes hidden></button>
      <button type="button" class="text-button" data-quiz-original hidden>Back to original results</button>
      <button type="button" class="text-button" data-quiz-retake hidden>Retake full quiz</button></div>
    <p class="quiz-source"><a href="assets/source-en.pdf#page=${topic.page}" target="_blank" rel="noopener">Revisit the source: cheatsheet page ${topic.page} &nearr;</a></p>
    <p class="quiz-privacy">Progress stays while this page is open; refreshing starts over. No answers are sent to a server.</p>`;
  const get = (selector) => {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`Missing ${selector} in the ${topic.id} quiz.`);
    return element;
  };
  const action = get("[data-quiz-action]");
  const retake = get("[data-quiz-retake]");
  const retry = get("[data-quiz-mistakes]");
  const original = get("[data-quiz-original]");
  const feedback = get("[data-quiz-feedback]");
  const content = get("[data-quiz-content]");
  const map = get("[data-quiz-map]");

  function renderMap() {
    map.innerHTML = state.order.map((index) => {
      const question = questions[index];
      const answer = state.answers[index];
      const status = answer === null
        ? state.selections[index] === null ? "unanswered" : "draft"
        : isCorrectAnswer(question, answer) ? "correct" : "missed";
      const description = { unanswered: "Not answered", draft: "Answer selected, not checked", correct: "Correct", missed: "Needs review" }[status];
      const marker = { unanswered: "", draft: "&#8226;", correct: "&#10003;", missed: "!" }[status];
      return `<li><button type="button" data-quiz-jump="${index}" data-quiz-status="${status}"
        aria-controls="quiz-content" ${!state.complete && index === state.index ? 'aria-current="step"' : ""}
        aria-label="${escape(`Question ${index + 1}. ${question.skill}: ${question.concept}. ${description}.`)}">
        <span>${index + 1}</span><span class="quiz-map-status" aria-hidden="true">${marker}</span></button></li>`;
    }).join("");
  }

  function explanation(question, answer) {
    const correct = isCorrectAnswer(question, answer);
    return `<strong tabindex="-1" data-quiz-feedback-title>${correct ? "Correct." : "Not quite."}</strong>
      <p class="quiz-selected-reason">${escape(question.feedback[answer])}</p>
      ${correct ? "" : `<p>Correct answer: <strong>${escape(question.choices[question.correct])}</strong></p>`}
      <p>${escape(question.explanation)}</p>`;
  }

  function render() {
    const score = quizScore(topic.id, state.answers, state.order);
    if (state.complete && score.answered !== score.total) throw new Error("Answer every question in this round before showing results.");
    const practice = state.mode === "mistakes";
    const missed = missedQuestions(topic.id, state.answers, state.order);
    root.dataset.quizMode = state.mode;
    root.dataset.quizComplete = String(state.complete);
    get("[data-quiz-count]").textContent = `${score.total} question${score.total === 1 ? "" : "s"}`;
    get("[data-quiz-intro]").textContent = practice
      ? "Focus on the questions you missed. This practice round is separate from your original chapter score."
      : `${questions.length} questions on ${topic.name.toLowerCase()}: recall the concepts, apply them, then reason through their limits. You can jump between questions without losing your selections.`;
    const originalScore = get("[data-quiz-original-score]");
    originalScore.hidden = !practice;
    if (practice) {
      const saved = quizScore(topic.id, state.originalAnswers);
      originalScore.textContent = `Original chapter score: ${saved.correct} / ${saved.total}. Practice does not change it.`;
    }
    get("[data-quiz-score]").textContent = `${score.correct} / ${score.total}`;
    get("[data-quiz-position]").textContent = state.complete
      ? practice ? "Practice complete" : "Quiz complete"
      : `${practice ? "Practice question" : "Question"} ${state.order.indexOf(state.index) + 1} of ${score.total}`;
    get("[data-quiz-answered]").textContent = `${score.answered} / ${score.total} checked`;
    get(".quiz-progress").setAttribute("aria-valuemax", String(score.total));
    get(".quiz-progress").setAttribute("aria-valuenow", String(score.answered));
    get("[data-quiz-progress-fill]").style.width = `${score.answered / score.total * 100}%`;
    retake.hidden = score.answered === 0 && !practice;
    original.hidden = !practice;
    retry.hidden = !state.complete || missed.length === 0;
    retry.textContent = `Practice ${missed.length} missed question${missed.length === 1 ? "" : "s"}`;
    action.hidden = state.complete;
    renderMap();
    if (state.complete) {
      feedback.replaceChildren();
      const groups = quizBreakdown(topic.id, state.answers, state.order);
      const weak = groups.filter((group) => group.correct < group.total).map((group) => group.skill.toLowerCase());
      content.innerHTML = `<div class="quiz-result"><span class="mini-label">${practice ? "Your mistake-practice score" : "Your chapter score"}</span>
        <p class="quiz-result-score">${score.correct}<span> / ${score.total}</span></p>
        <h4 tabindex="-1" data-quiz-result-title>${score.correct === score.total
          ? `${score.total === 1 ? "That one is correct." : `All ${score.total} correct.`} Nice work.`
          : `${missed.length} question${missed.length === 1 ? "" : "s"} to revisit. Keep building.`}</h4>
        <p>${weak.length
          ? `Focus next on ${escape(weak.join(", "))}. Review the explanations or practice only the questions you missed.`
          : "You checked every question in this round correctly. Review the reasoning to make the ideas stick."}</p>
        <ul class="quiz-skill-scores" aria-label="Results by question skill">${groups.map((group) => `<li>
          <span>${escape(group.skill)}</span><strong>${group.correct} / ${group.total}</strong>
          <span class="quiz-skill-track" aria-hidden="true"><span style="width:${group.correct / group.total * 100}%"></span></span></li>`).join("")}</ul></div>
        <details class="quiz-review"><summary>Review your answers</summary>
          <div class="quiz-review-filters" role="group" aria-label="Answer review filters">
            <button type="button" data-quiz-review-filter="all" aria-pressed="true">All answers (${score.total})</button>
            <button type="button" data-quiz-review-filter="missed" aria-pressed="false" ${missed.length ? "" : "disabled"}>Only mistakes (${missed.length})</button>
          </div><ol>${state.order.map((index) => {
            const question = questions[index];
            const answer = state.answers[index];
            const correct = isCorrectAnswer(question, answer);
            return `<li value="${index + 1}" data-quiz-review-correct="${correct}">
              <span class="quiz-review-status">${correct ? "Correct" : "Revisit"} / ${escape(question.skill)} / ${escape(question.concept)}</span>
              <strong>${escape(question.prompt)}</strong><p>Your answer: ${escape(question.choices[answer])}</p>
              <p>${escape(question.feedback[answer])}</p>
              <p class="quiz-review-correct">Correct answer: ${escape(question.choices[question.correct])}</p>
              <p>${escape(question.explanation)}</p></li>`;
          }).join("")}</ol></details>`;
      return;
    }
    const question = questions[state.index];
    const answer = state.answers[state.index];
    const revealed = answer !== null;
    const selected = revealed ? answer : state.selections[state.index];
    content.innerHTML = `<div class="quiz-question-meta" id="quiz-question-context"><span>${escape(question.concept)}</span><span class="quiz-skill">${escape(question.skill)}</span></div>
      <fieldset class="quiz-options" aria-describedby="quiz-question-context" ${revealed ? "disabled" : ""}>
      <legend class="quiz-question" tabindex="-1" data-quiz-question>${escape(question.prompt)}</legend>
      ${question.choices.map((choice, index) => {
        const correct = revealed && index === question.correct;
        const chosen = index === selected;
        return `<label class="quiz-option${chosen ? " is-selected" : ""}${correct ? " is-correct" : ""}${revealed && chosen && !correct ? " is-incorrect" : ""}">
          <input type="radio" name="chapter-quiz-answer" value="${index}" data-quiz-choice="${index}" ${chosen ? "checked" : ""}>
          <span class="quiz-option-copy"><span>${escape(choice)}</span>${correct ? '<strong class="quiz-choice-status">Correct answer</strong>' : revealed && chosen ? '<strong class="quiz-choice-status">Your answer</strong>' : ""}</span></label>`;
      }).join("")}</fieldset>${revealed ? `<details class="quiz-option-reasons"><summary>Compare all four choices</summary><ol>
        ${question.choices.map((choice, index) => `<li><strong>${escape(choice)}</strong>
          ${index === question.correct ? '<span class="quiz-choice-status">Correct answer</span>' : ""}
          <p>${escape(question.feedback[index])}</p></li>`).join("")}</ol></details>` : ""}`;
    feedback.innerHTML = revealed ? explanation(question, answer) : "";
    action.textContent = !revealed ? "Check answer" : score.answered === score.total ? "See results \u2192" : "Next question \u2192";
    action.disabled = !revealed && selected === null;
  }

  function goTo(index) {
    if (!state.order.includes(index)) throw new RangeError("Choose a question in the current practice round.");
    state.index = index;
    state.selected = state.selections[index];
    state.complete = false;
    render();
    get("[data-quiz-question]").focus();
  }

  function startRound(order, mode) {
    const originalAnswers = state.originalAnswers;
    const fresh = createQuizState(topic.id);
    quizScore(topic.id, fresh.answers, order);
    Object.assign(state, fresh, {
      order: [...order], index: order[0], mode,
      originalAnswers: mode === "mistakes" ? originalAnswers : null,
    });
    render();
    get("[data-quiz-question]").focus();
  }

  map.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quiz-jump]");
    if (button) goTo(Number(button.dataset.quizJump));
  });
  content.addEventListener("change", (event) => {
    if (!event.target.matches("[data-quiz-choice]")) return;
    if (state.answers[state.index] !== null) throw new Error("A checked answer cannot be changed.");
    const answer = Number(event.target.value);
    isCorrectAnswer(questions[state.index], answer);
    state.selected = answer;
    state.selections[state.index] = answer;
    root.querySelectorAll(".quiz-option").forEach((option) => {
      option.classList.toggle("is-selected", option.querySelector("input").checked);
    });
    action.disabled = false;
    renderMap();
  });
  content.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quiz-review-filter]");
    if (!button) return;
    const missedOnly = button.dataset.quizReviewFilter === "missed";
    content.querySelectorAll("[data-quiz-review-filter]").forEach((filter) => {
      filter.setAttribute("aria-pressed", String(filter === button));
    });
    content.querySelectorAll("[data-quiz-review-correct]").forEach((item) => {
      item.hidden = missedOnly && item.dataset.quizReviewCorrect === "true";
    });
  });
  action.addEventListener("click", () => {
    if (state.answers[state.index] === null) {
      isCorrectAnswer(questions[state.index], state.selected);
      state.answers[state.index] = state.selected;
      render();
      get("[data-quiz-feedback-title]").focus();
      return;
    }
    const position = state.order.indexOf(state.index);
    const remaining = [...state.order.slice(position + 1), ...state.order.slice(0, position + 1)];
    const next = remaining.find((index) => state.answers[index] === null);
    if (next !== undefined) {
      goTo(next);
      return;
    }
    state.complete = true;
    if (state.mode === "chapter") state.originalAnswers = [...state.answers];
    render();
    get("[data-quiz-result-title]").focus();
  });
  retry.addEventListener("click", () => {
    const missed = missedQuestions(topic.id, state.answers, state.order);
    startRound(missed, "mistakes");
  });
  original.addEventListener("click", () => {
    const answers = [...state.originalAnswers];
    Object.assign(state, createQuizState(topic.id), {
      answers, selections: [...answers], originalAnswers: [...answers], complete: true,
    });
    render();
    get("[data-quiz-result-title]").focus();
  });
  retake.addEventListener("click", () => startRound(questions.map((_, index) => index), "chapter"));
  render();
}
