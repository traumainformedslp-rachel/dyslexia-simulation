# Reading Simulation Experience

An interactive reading simulation designed to build empathy for students who struggle with reading. Created for professional development workshops on trauma-informed literacy instruction.

Participants read the same passage through three different text distortions, answer comprehension questions, then reflect on the experience and its connection to struggling readers in their classrooms.

## Distortion types

- **Version A: Vowels removed** — all vowels stripped, consonant skeleton remains
- **Version B: Letter fragments** — letters clipped, rotated, mirrored, and swapped (b/d, p/q)
- **Version C: Jumbled letters** — internal letters rearranged, first and last preserved

## How to use in a workshop

1. Share the link with participants
2. Allow 10 to 15 minutes for the full simulation (reading + questions)
3. Use the built-in reflection prompts to facilitate group discussion
4. Connect the experience to educational trauma and the daily reality of students with reading disabilities

## Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

This runs `vite build` and pushes the `dist/` folder to the `gh-pages` branch. Your site will be live at `https://[your-username].github.io/dyslexia-sim/`.

**First-time setup:** After pushing, go to your repo Settings > Pages and set the source to the `gh-pages` branch.

## Embed in another site

After deploying, embed the simulation in any page with an iframe:

```html
<iframe
  src="https://[your-username].github.io/dyslexia-sim/"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

## Credits

- Distortion approach inspired by the dyslexia awareness work of Daniel Britton
- Created by Rachel Terra Norton, MS, CCC-SLP
- RTN Communication & Literacy | [rachelslp.org](https://rachelslp.org)

## License

MIT
