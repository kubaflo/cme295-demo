# CME 295 interactive demo

[Open the demo](https://kubaflo.github.io/cme295-demo/)

An independent English learning companion to the **VIP Cheatsheet: Transformers
& Large Language Models** by **Afshine Amidi and Shervine Amidi**.

Website created by [Jacob Florkowski (Microsoft)](https://www.linkedin.com/in/jakub-florkowski/)
as a personal learning project. This is not an official Stanford website,
Microsoft project or author-approved edition.

## Explore

- Nine chapter summaries with original interactive teaching diagrams.
- 108 quiz questions: 12 per chapter, with answer explanations, skill breakdowns
  and mistake-only practice.
- A separate [interactive illustrations page](https://kubaflo.github.io/cme295-demo/illustrations.html)
  for attention, temperature and sampling, and masked diffusion.
- The unchanged English source PDF and explicit attribution.

The examples use invented vectors, fixed logits and scripted demonstrations,
not trained language models. There are no AI API calls, analytics or submitted
quiz answers. Quiz progress stays in memory for the current page visit;
refreshing clears it.

## Attribution and licenses

The original reference is from
[afshinea/stanford-cme-295-transformers-large-language-models](https://github.com/afshinea/stanford-cme-295-transformers-large-language-models).
Its MIT license and copyright notice are preserved in `LICENSE.txt` and on the
[attribution page](https://kubaflo.github.io/cme295-demo/credits.html).

The self-hosted fonts retain their SIL Open Font License notices in
`assets/fonts/`. The layout and illustrations were independently created;
no Stanford seal, official logo or campus photography is reproduced.

This is a selected-concept companion, not a reproduction of the complete
cheatsheet, textbook or official course assessments.

## Run locally

No package installation or build step is required:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765/>.

## Hosting

GitHub Pages serves the root of the `gh-pages` branch as a static project site.
The `.nojekyll` file keeps the authored HTML, styles, modules and assets intact.
Relative URLs support both a local server and the `/cme295-demo/` project path.

Only the active companion, its illustrations, credits and assets are published.
Local QA reports, test dependencies and discarded design studies are excluded.
