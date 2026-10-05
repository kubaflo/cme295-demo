export const TOKENS = ["a", "cute", "teddy bear", "is", "reading", "."];

export const KEYS = [
  [0.2, 0.3],
  [1.6, 0.4],
  [1.4, 1.7],
  [-0.4, 0.15],
  [0.8, 1.2],
  [-0.6, -0.4],
];

export const VALUES = [
  [0.2, 0.1],
  [0.9, 0.3],
  [1.0, 0.9],
  [0.1, 0.2],
  [0.3, 1.0],
  [-0.2, 0.1],
];

export const CANDIDATES = ["cute", "soft", "small", "warm", "blue"];
export const LOGITS = [2.5, 1.7, 0.9, 0.4, -0.3];

export function softmax(scores, temperature = 1) {
  if (!scores.length || !Number.isFinite(temperature) || temperature <= 0) {
    throw new RangeError("Softmax needs scores and a positive finite temperature.");
  }
  if (scores.some((score) => !Number.isFinite(score) && score !== -Infinity)) {
    throw new RangeError("Scores must be finite, or negative infinity for a mask.");
  }
  const maximum = Math.max(...scores);
  if (maximum === -Infinity) {
    throw new RangeError("At least one score must be unmasked.");
  }
  const exponentials = scores.map((score) => Math.exp((score - maximum) / temperature));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

export function attention(queryIndex = 2, queryScale = 1, causal = false) {
  if (!Number.isInteger(queryIndex) || queryIndex < 0 || queryIndex >= TOKENS.length) {
    throw new RangeError("The query must be one of the six illustrative tokens.");
  }
  if (!Number.isFinite(queryScale) || queryScale <= 0) {
    throw new RangeError("The query scale must be positive and finite.");
  }
  const query = KEYS[queryIndex].map((value) => value * queryScale);
  const dots = KEYS.map((key) => query.reduce((sum, value, i) => sum + value * key[i], 0));
  const scores = dots.map((dot, i) => causal && i > queryIndex ? -Infinity : dot / Math.sqrt(2));
  const weights = softmax(scores);
  const output = [0, 1].map((dimension) =>
    weights.reduce((sum, weight, i) => sum + weight * VALUES[i][dimension], 0),
  );
  return { query, dots, scores, weights, output };
}

export function entropy(probabilities) {
  return -probabilities.reduce(
    (sum, probability) => sum + (probability === 0 ? 0 : probability * Math.log2(probability)),
    0,
  );
}

export function sample(probabilities, random = Math.random) {
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (probabilities.some((value) => !Number.isFinite(value) || value < 0) ||
      Math.abs(total - 1) > 1e-9) {
    throw new RangeError("Sampling needs non-negative probabilities that sum to one.");
  }
  const draw = random();
  if (!Number.isFinite(draw) || draw < 0 || draw >= 1) {
    throw new RangeError("The random draw must be in [0, 1).");
  }
  let cumulative = 0;
  for (let i = 0; i < probabilities.length; i += 1) {
    cumulative += probabilities[i];
    if (draw < cumulative) return i;
  }
  return probabilities.length - 1;
}

export const DIFFUSION_FRAMES = [
  ["[MASK]", "[MASK]", "[MASK]", "[MASK]", "[MASK]", "[MASK]"],
  ["[MASK]", "cute", "[MASK]", "[MASK]", "reading", "[MASK]"],
  ["a", "cute", "[MASK]", "[MASK]", "reading", "."],
  ["a", "cute", "teddy bear", "[MASK]", "reading", "."],
  [...TOKENS],
];

export const ATTENTION_STEPS = [
  {
    label: "Choose a query",
    explanation: "The selected token supplies a two-dimensional query vector q in this toy example.",
  },
  {
    label: "Compare with keys",
    explanation: "Compute q dot k for every key. These dot products are compatibility scores, not probabilities.",
  },
  {
    label: "Scale the scores",
    explanation: "Divide each score by the square root of the key dimension. Here, d_k = 2.",
  },
  {
    label: "Normalize",
    explanation: "Softmax turns the unmasked scores into non-negative weights that sum to one.",
  },
  {
    label: "Mix the values",
    explanation: "Use the attention weights to take a weighted sum of the value vectors.",
  },
];
