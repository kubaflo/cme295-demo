export const SOURCE = {
  authors: "Afshine Amidi and Shervine Amidi",
  repository: "https://github.com/afshinea/stanford-cme-295-transformers-large-language-models",
  course: "https://cme295.stanford.edu/",
  book: "https://superstudy.guide/transformers-large-language-models/",
  revision: "c086dee78457511da4a084f25339502bfc4ae899",
};

export const DIRECTIONS = [
  {
    id: "field",
    number: "01",
    name: "Field Guide",
    file: "01-field-guide.html",
    subtitle: "An illustrated, annotated textbook.",
    description: "Warm paper, expressive serif type, marginal notes and diagrams that feel like a book you can touch.",
    strengths: "Deep reading / illustrated explanations",
    palette: ["#f4efe4", "#26362c", "#b23f28"],
  },
  {
    id: "lab",
    number: "02",
    name: "Signal Lab",
    file: "02-signal-lab.html",
    subtitle: "An instrument panel for the curious.",
    description: "Dark graphite, electric lime, oversized condensed type and live experiments with their workings exposed.",
    strengths: "Experimentation / animated model internals",
    palette: ["#101311", "#d2fc61", "#a0b19b"],
  },
  {
    id: "workspace",
    number: "03",
    name: "Quiet Workspace",
    file: "03-quiet-workspace.html",
    subtitle: "A calm place to understand more.",
    description: "A restrained learning workspace with a persistent chapter rail, soft green accents and room to think.",
    strengths: "Guided learning / approachable navigation",
    palette: ["#f5f6f4", "#245b49", "#d8e8dd"],
  },
  {
    id: "playground",
    number: "04",
    name: "Token Playground",
    file: "04-token-playground.html",
    subtitle: "Serious concepts. Playful controls.",
    description: "Cobalt blue, butter yellow, chunky type and tangible tokens. A hands-on, diagram-first introduction.",
    strengths: "First-time learners / memorable interactions",
    palette: ["#2449d8", "#ffe99c", "#f2a2bf"],
  },
  {
    id: "manual",
    number: "05",
    name: "Operator Manual",
    file: "05-operator-manual.html",
    subtitle: "The reference, with the lights on.",
    description: "A compact, square-edged technical reference. Searchable chapters, visible equations and numerical inspection.",
    strengths: "Fast lookup / technical precision",
    palette: ["#eef0f4", "#2458c7", "#202b3c"],
  },
];

export const TOPICS = [
  {
    id: "foundations", number: "01", name: "Foundations", page: 1,
    summary: "Turn text into tokens, then represent those tokens with numerical vectors.",
    concepts: [
      ["Tokens & tokenizers", "A token is an indivisible unit from a vocabulary. Word, subword, character and byte tokenizers make different trade-offs between vocabulary size and sequence length."],
      ["Embeddings", "An embedding is a numerical vector representing a token, sentence or other element. Its dimensionality depends on the model."],
      ["Cosine similarity", "Cosine similarity measures the angle between two nonzero vectors: their dot product divided by the product of their norms. Its range is -1 to 1."],
    ],
  },
  {
    id: "transformers", number: "02", name: "Transformers", page: 1,
    summary: "Attention builds a contextual representation by mixing value vectors according to query-key compatibility.",
    concepts: [
      ["Scaled dot-product attention", "Compute QK transposed, scale by the square root of the key dimension, apply softmax over keys and multiply by V. A causal mask blocks attention to future positions."],
      ["Multi-head attention", "Different learned projections form multiple attention heads. Their outputs are combined and projected into the output space. GQA and MQA share keys and values across query heads."],
      ["Architecture & position", "Transformer blocks combine attention and feed-forward layers with residual connections. Position representations provide sequence-order information; RoPE rotates query and key vectors."],
      ["Encoder and decoder variants", "BERT uses encoder blocks for bidirectional representations. GPT-style models use causal decoder blocks for next-token prediction. Encoder-decoder models such as T5 combine both."],
    ],
  },
  {
    id: "language-models", number: "03", name: "Large language models", page: 2,
    summary: "Large models learn language representations and token predictions. Prompting and decoding determine how those predictions are used.",
    concepts: [
      ["Mixture of experts", "A learned gate routes each token to a subset of feed-forward experts, activating only part of the model for that token."],
      ["Context windows", "The context window limits the number of tokens a model can process. Having a long window does not guarantee equally good use of every token."],
      ["Temperature", "Temperature rescales logits before softmax. Lower values concentrate probability on high-scoring candidates; higher values flatten the distribution."],
    ],
  },
  {
    id: "training", number: "04", name: "LLM training", page: 3,
    summary: "Pretraining learns broad patterns. Finetuning and preference optimization shape task behavior.",
    concepts: [
      ["Pretraining & scaling laws", "Cross-entropy penalizes low probability assigned to the target token. Scaling laws describe empirical trends as model size, data and compute increase."],
      ["SFT & LoRA", "Supervised finetuning learns from task-aligned input-output pairs. LoRA freezes base weights and learns a low-rank update, reducing the number of trainable parameters."],
      ["Preferences & DPO", "Reward models score responses for desired behavior. RLHF uses human-preference-derived rewards; DPO directly optimizes preference pairs without fitting an explicit reward model in its training loop."],
      ["Reasoning & distillation", "Intermediate reasoning steps, additional training compute and inference-time compute can support complex tasks. On-policy distillation uses a stronger teacher to supervise the student's sampled trajectories."],
    ],
  },
  {
    id: "reinforcement-learning", number: "05", name: "Reinforcement learning", page: 4,
    summary: "Treat next-token generation as a policy, and use rewards to improve sampled responses.",
    concepts: [
      ["Policy gradients", "The state is the prompt plus generated tokens; an action is the next token. A baseline can reduce the variance of updates driven by sampled returns."],
      ["PPO", "Proximal Policy Optimization uses a clipped policy-ratio objective to constrain updates. Clipping alone is not a guarantee against reward hacking."],
      ["GRPO", "Group Relative Policy Optimization compares rewards within a group of sampled responses to estimate advantages, avoiding a separate value model."],
      ["Verifiable rewards", "Exact answers, executable tests or formal checks can provide automatically computed rewards for objectively checkable outcomes."],
    ],
  },
  {
    id: "systems", number: "06", name: "LLM systems", page: 4,
    summary: "Make training and inference more efficient without losing sight of the underlying computation.",
    concepts: [
      ["FlashAttention & PagedAttention", "FlashAttention optimizes exact attention through memory-aware GPU computation. PagedAttention organizes KV-cache storage in blocks to improve memory management."],
      ["Parallelism", "Data parallelism splits batches; tensor parallelism splits layer computation; pipeline parallelism splits stages; expert parallelism distributes MoE experts."],
      ["Prefill, decode & KV cache", "Prefill processes a prompt to initialize its key-value cache. Decode produces new tokens autoregressively while reusing previously computed keys and values."],
      ["Speculative decoding", "A draft model proposes tokens, and a target model verifies them in parallel. The acceptance procedure determines whether the target sampling distribution is preserved."],
    ],
  },
  {
    id: "agents", number: "07", name: "AI agents", page: 5,
    summary: "Wrap a model in a loop that can observe, plan and act using tools and external knowledge.",
    concepts: [
      ["ReAct", "Reason-and-act frameworks interleave observations, planning and actions to handle multi-step tasks."],
      ["Harness", "The system around the model manages context, tools, state and the agent loop."],
      ["Retrieval & reranking", "Retrievers select relevant documents using sparse, dense or hybrid methods. Rerankers reorder the retrieved candidates using a relevance model."],
      ["RAG", "Retrieval-augmented generation adds retrieved context to a prompt before generating an answer. Chunking, retrieval quality and context selection all affect the result."],
    ],
  },
  {
    id: "evaluation", number: "08", name: "Evaluation", page: 5,
    summary: "Evaluate both individual components and complete trajectories, and calibrate model-based judgments against human judgments.",
    concepts: [
      ["LLM-as-a-Judge", "A model scores outputs against criteria and may provide a rationale. A rationale is useful context, not proof that the score is correct."],
      ["Judge biases", "Position, verbosity and self-enhancement biases can affect ratings. Randomized presentation, calibration and appropriate judge choice help expose these effects."],
      ["Components & trajectories", "Measure retrieval, tool selection and execution separately, then evaluate end-to-end task success, errors, latency and cost across the full trajectory."],
    ],
  },
  {
    id: "diffusion", number: "09", name: "Diffusion LLMs", page: 6,
    summary: "Generate through iterative denoising rather than only filling a sequence from left to right.",
    concepts: [
      ["Continuous & discrete diffusion", "Continuous approaches denoise embeddings before mapping them to tokens. Discrete approaches operate on tokens, often through masking and reconstruction."],
      ["Training", "Corrupt a sequence at a sampled noise level and train the model to reconstruct the original tokens."],
      ["Inference & schedules", "Start from a noisy or masked sequence, repeatedly predict tokens and use a schedule to accept or remask them. The schedule trades off speed and quality."],
    ],
  },
];

export function matchesTopic(topic, query) {
  if (!query.trim()) return true;
  const terms = query.toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu);
  if (!terms) return false;
  const words = [topic.name, topic.summary, ...topic.concepts.flat()]
    .join(" ").toLocaleLowerCase("en").match(/[\p{L}\p{N}]+/gu);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}
