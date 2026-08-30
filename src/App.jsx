import { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  RECALL v12 — the visit becomes a record you can hear               */
/*                                                                     */
/*  New in v12 (visit recording end to end):                           */
/*  · Record screen: consent-first arming screen ("one ask before the  */
/*    red button"), then a ticker waveform — sound born at the red     */
/*    now-line, drifting into history. No orb: Recall is the notebook  */
/*    here, not a participant. Pause, finish-confirm, two-tap discard. */
/*  · Live translate: the interpreter table. Two halves, two mics,     */
/*    each side in its own language (EN·FR·TA); face-to-face flips     */
/*    the doctor's half so a phone flat on the desk reads right for    */
/*    both chairs; the doctor can type instead. Recording continues,   */
/*    visibly, on the center seam.                                     */
/*  · Processing: save fast, process in place. Five explainable steps  */
/*    tick on a card in Past visits (~14s); tapping in early opens     */
/*    the page mid-write — transcript cascades in, term colors sweep   */
/*    in when tagging lands, summary arrives last. One pipeline        */
/*    clock at app level; the card and the page can't disagree.        */
/*  · The visit page: Speechify's grammar for a doctor's visit. A      */
/*    floating dock owns the audio (±15s, speed, scrub); every word    */
/*    knows its moment (tap a word, hear it); karaoke follows with a   */
/*    break-away "Playing ·" pill; five term kinds in domain colors    */
/*    with counts-as-filters; every colored term opens a plain-words   */
/*    sheet with "hear this moment" and a MedlinePlus door out;        */
/*    summary lines carry ▶ receipts to their exact seconds; quiet     */
/*    stretches (the cuff, the stethoscope) are honest rows. FR is a   */
/*    full second rendering with per-line EN peek — the rule change:   */
/*    transcripts translate now; the original stays adjacent.          */
/* ------------------------------------------------------------------ */
/*  RECALL v10 — care spaces + real capture: scan, log, file        */
/*                                                                     */
/*  Everything from v9 (turn-by-turn check-in conversations, one       */
/*  script for call & chat, confirm policy, reopenable days) plus a    */
/*  full capture pipeline for the two "paper" tabs:                    */
/*                                                                     */
/*  · Meds — Add a medication is a real flow now. Type-to-search       */
/*    (suggestions only appear after two letters, keyboard rises       */
/*    from the bottom, field stays anchored on top) or scan the        */
/*    bottle: viewfinder → label lock → recognition chips → confirm    */
/*    card (names always get an explicit confirm). Dose has presets    */
/*    AND a stepper with units (mg/mcg/IU/mL) — no keyboard needed.    */
/*    Schedule has presets AND an exact-time picker + "with food".     */
/*  · Every medication now has a visual identity — shape × color      */
/*    (capsule, tablet, oval, oblong, liquid, inhaler), chosen with    */
/*    a live preview and shown in the cabinet, on Today's dose list,   */
/*    and on the med's own page. Existing meds got looks too.          */
/*  · Documents — scanning is simulated end-to-end: edge-detect quad   */
/*    locks onto the page, auto-capture flashes, pages stack in a      */
/*    thumbnail counter. Processing is a staged checklist (straighten  */
/*    → read text → type detected → plain summary → Français ready),   */
/*    not an anonymous spinner — each step ticks as Recall works.      */
/*  · Document detail shows the real page inline (tap to open) and a   */
/*    full-screen viewer with zoom and Recall's flagged-result         */
/*    highlight — the original is a first-class citizen, not a         */
/*    320-px placeholder square.                                       */
/*  · People are places, not modes. Your own Recall is home; each      */
/*    person you help is a room you VISIT — entered from the avatar,   */
/*    exited by a labeled "‹ Your Recall" pinned on every room screen. */
/*    A supporter never sees the owner's view — rooms render only      */
/*    what the role allows (no Journal tab exists in a room).          */
/*  · One door: the circle sheet is now purely people — every row      */
/*    opens the page about that relationship. Your own row = profile   */
/*    & settings (commitments moved there). Helper rows = member       */
/*    pages with fact-toggles. Helped rows = their rooms.              */
/*  · News routing: the bell stays "about your record" (badge =        */
/*    open requests, unchanged). News from rooms you help puts a DOT   */
/*    on the avatar — never a number; counts sit one level down,       */
/*    per person, and each room clears by reading in place.            */
/*  · Sharing doctrine: facts automate (visits/refills/meds-list       */
/*    toggles, default off); WORDS never do — every share of words     */
/*    is a choice list with minimal defaults, and curation reviews     */
/*    end in a receipt ("nothing sends until you approve exactly       */
/*    this"). Care update = authored by you; insight = discovered.     */
/*  · Care notes: a caregiver's second notebook alongside the          */
/*    owner's journal — voice-first ("How was his day?"), stamped,     */
/*    always readable by the owner, never blended into his words.      */
/*  · Internal preview controls: the 9:41/••• menu now also switches   */
/*    DEVICE — Amma's phone (owner + caregiver for Thatha) ⇄ Sarah's   */
/*    phone (supporter-only: People home + family room). Thatha's     */
/*    own receiving experience is already demoed by Amma's (requests,  */
/*    undo, Updates) — same surfaces, so no third dataset.             */
/* ------------------------------------------------------------------ */

const C = {
  canvas: "#DFE1E6", bg: "#F2F2F7", card: "#FFFFFF",
  ink: "#1C1C1E", sub: "#6E6E73", ter: "#8E8E93", line: "#E5E5EA",
  track: "#E4E4E9",
  blue: "#007AFF", blueSoft: "#E5F1FF", blueDeep: "#0A2C4F",
  green: "#34C759", greenSoft: "#E4F8EA", greenInk: "#1F7A38",
  orange: "#FF9500", orangeSoft: "#FFF3E0", orangeInk: "#9A5B00",
  red: "#FF3B30", redSoft: "#FFE9E7",
  purple: "#AF52DE", purpleSoft: "#F5EBFB", purpleInk: "#7A2FA3",
  teal: "#30B0C7", tealSoft: "#E3F5F9", tealInk: "#0C5C69",
  /* inks & outlines that sit on tinted or grouped surfaces — tokenized
     so dark mode can swap them; a hex literal can't re-theme */
  blueSub: "#3A5D80", ctrl: "#D1D1D6", dash: "#B9BDC6",
};

/* ------------------------- appearance ------------------------------ */
/* Dark is a PALETTE SWAP, not an inversion: iOS system dark values.
   Ground and card separate by elevation (near-black ground, #1C1C1E
   cards); accents jump to their brighter dark-mode siblings so they
   hold contrast on dark cards; the soft tints become deep versions of
   their hue with LIGHT ink partners, so every tinted card keeps its
   meaning in both themes. Components read C.* at render, so assigning
   over C and re-rendering re-themes the whole app. */
const THEME_LIGHT = { ...C };
const THEME_DARK = {
  canvas: "#101114", bg: "#0E0F12", card: "#1C1C1E",
  ink: "#F2F2F7", sub: "#A7A7AE", ter: "#78787E", line: "#33343A",
  track: "#2C2D33",
  blue: "#409CFF", blueSoft: "#122E4E", blueDeep: "#A9CCF2",
  green: "#30D158", greenSoft: "#12331E", greenInk: "#6FDE8B",
  orange: "#FF9F0A", orangeSoft: "#382908", orangeInk: "#FFB340",
  red: "#FF453A", redSoft: "#3B1512",
  purple: "#BF5AF2", purpleSoft: "#2E1A3B", purpleInk: "#DCA9F8",
  teal: "#4CC9DE", tealSoft: "#0F3238", tealInk: "#7ADEEA",
  blueSub: "#8FB8E8", ctrl: "#48484A", dash: "#4A4B52",
};
const applyTheme = (dark) => Object.assign(C, dark ? THEME_DARK : THEME_LIGHT);

/* haptics — a state change is FELT, not just seen: every confirmed act
   (anything worth a toast) gives one small tick; the two celebration
   moments thump. Android web vibrates for real; iOS Safari has no
   vibration API, so there this is a documented no-op — the native
   build maps tick/thump to UIImpactFeedbackGenerator light/medium. */
const buzz = (pattern = 10) => {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
};
const BUZZ_THUMP = [16, 90, 24];

/* text size: the whole UI scales together (like iOS Display Zoom) so
   touch targets grow with the words they label. Single-word labels so
   the segmented control never wraps unevenly at any scale. */
const TEXT_SIZES = { Normal: 1, Large: 1.15, Largest: 1.3 };

/* set by App each render (same pattern as the theme): full-bleed on a
   real phone hides every fake status clock — the phone has a real one */
let CHROMELESS = false;

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;

const PERIODS = [
  { id: "day1", label: "Day 1" },
  { id: "week1", label: "Week 1" },
  { id: "week2", label: "Week 2" },
  { id: "visitday", label: "Visit day" },
  { id: "month1", label: "Month 1" },
];

const PERIOD_NOTES = {
  day1: "Day 1 — the default. Conversations play turn by turn (flask tests 12 moments). NEW: Meds → Add a medication — type to search or scan the bottle. Documents → Add a document — a real camera scan with staged processing.",
  week1: "Week 1 — Sarah's request rides in The days ahead, named. Voice goes straight into the call. Documents: try Add a document — edge-detect scan, page counter, then a step-by-step filing checklist.",
  week2: "Week 2 — insight ready keeps top billing. Finalize a check-in and watch it land back on Today as a processing card, then a finished entry.",
  visitday: "Visit day — NEW: the whole recording arc. Record (hero or Visits) → consent screen → live waveform → try Translate (two chairs, two mics, flip it). Finish → watch the five steps in Past visits, tap in early if you like — then a visit you can HEAR: tap any word, tap colored terms, flip to Français.",
  month1: "Month 1 — three requests summarized as one row in The days ahead, overdue calcium in Meds, Français toggles in documents & past visits. Tap the written entry: a wrapped day can still take an evening note.",
};

/* ------------------------- primitives ----------------------------- */

const Icon = ({ d, size = 22, color = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const icons = {
  today: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" /></>),
  journal: (<><rect x="4.5" y="3" width="15" height="18" rx="2.5" /><path d="M8.5 3v18" /><path d="M13 3v6l2-1.6L17 9V3" /></>),
  visits: (<><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></>),
  meds: (<><rect x="4.5" y="8.75" width="15" height="6.5" rx="3.25" transform="rotate(45 12 12)" /><path d="M9.6 14.4l4.8-4.8" transform="rotate(90 12 12)" /></>),
  docs: (<><path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" /><path d="M14 2.5V7h4" /></>),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  mic: (<><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" /></>),
  micOff: (<><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22" /><path d="M4 4l16 16" /></>),
  bell: (<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10.5 20a1.8 1.8 0 0 0 3 0" /></>),
  scan: (<><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M4 12h16" /></>),
  camera: (<><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2l1.6-2.2h5.8L16.5 6h2A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" /><circle cx="12" cy="13" r="3.6" /></>),
  bulb: (<><path d="M9.5 18h5M10.5 21h3" /><path d="M12 3a6 6 0 0 1 3.6 10.8c-.7.5-1.1 1.3-1.1 2.2h-5c0-.9-.4-1.7-1.1-2.2A6 6 0 0 1 12 3z" /></>),
  flask: (<><path d="M10 3h4M11 3v5.2L5.8 17a2.2 2.2 0 0 0 2 3.2h8.4a2.2 2.2 0 0 0 2-3.2L13 8.2V3" /><path d="M8.2 14.5h7.6" /></>),
  speaker: (<><path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" /><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></>),
  chevron: <path d="M9 5.5l7 6.5-7 6.5" />,
  ff: <path d="M4 6l6.5 6L4 18M12.5 6l6.5 6-6.5 6" />,
  spark: <path d="M12 2.5l2.2 6.3 6.6.4-5.1 4.2 1.7 6.4L12 16.2l-5.4 3.6 1.7-6.4-5.1-4.2 6.6-.4z" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 21l1.6-4.6A8.5 8.5 0 1 1 21 12z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  share: (<><path d="M12 15V3M8 6.5L12 2.5l4 4" /><path d="M5 11v9a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20v-9" /></>),
  person: (<><circle cx="12" cy="8" r="4" /><path d="M4.5 21c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></>),
  undo: (<><path d="M8 5L3 10l5 5" /><path d="M3 10h11a6 6 0 0 1 0 12h-3" /></>),
  pause: <path d="M8 5v14M16 5v14" />,
  pattern: <path d="M3 17l5-6 4 3 6-8 3 4" />,
  heart: <path d="M12 20.2S4 15.1 4 9.8C4 7.2 6 5.2 8.4 5.2c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 5.2 20 7.2 20 9.8c0 5.3-8 10.4-8 10.4z" />,
  question: (<><path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.3-1.6 2.5" /><path d="M12 18h.01" /></>),
  eye: (<><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  back: <path d="M15 5.5L8 12l7 6.5" />,
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M20.5 20.5l-4.8-4.8" /></>),
  phoneEnd: <path d="M3.5 14.5c5.5-5 11.5-5 17 0l-2.5 3c-1-.6-2-1.2-3.3-1.6l-.4-2.6c-1.5-.4-3.1-.4-4.6 0l-.4 2.6c-1.3.4-2.3 1-3.3 1.6z" />,
  pencil: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  lock: (<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  expand: <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />,
  list: <path d="M4 6h16M4 12h16M4 18h9" />,
  topic: (<><circle cx="5.8" cy="18" r="2.1" /><circle cx="18.2" cy="6" r="2.1" /><path d="M7.9 18h5.1a5.2 5.2 0 0 0 5.2-5.2V8.1" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  lock: (<><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>),
  pencil: (<><path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" /><path d="M13.5 7.5l3 3" /></>),
  /* body-part icons for the specialty list — plain shapes, no anatomy lesson */
  tooth: <path d="M8 3.5C5.5 3.5 4 5.6 4 8.1c0 4.6 1.9 12.4 3.5 12.4 1.4 0 1-5 4.5-5s3.1 5 4.5 5C18.1 20.5 20 12.7 20 8.1c0-2.5-1.5-4.6-4-4.6-1.7 0-2.5 1.1-4 1.1s-2.3-1.1-4-1.1z" />,
  joint: (<><path d="M8 3v5.5a3.5 3.5 0 0 0 3.5 3.5h1" /><path d="M16 21v-5.5a3.5 3.5 0 0 0-3.5-3.5h-1" /></>),
  stomach: <path d="M15 3v3.2a4.3 4.3 0 0 1-4.3 4.3A5.25 5.25 0 0 0 11 21h.6a8.4 8.4 0 0 0 8.4-8.4V10" />,
  ear: (<><path d="M6.3 10.5a6 6 0 1 1 10.9 3.6c-.9 1.1-1.6 1.9-1.8 3.3a3.1 3.1 0 0 1-6.1-.4" /><path d="M9.8 11a3.3 3.3 0 0 1 6 1.8c0 .9-.4 1.5-1 2.2" /></>),
  lungs: (<><path d="M12 3.5v5.5" /><path d="M10 7.5c-3.6 1.4-6 5-6 9.5 0 2 1 3 2.6 3 2.4 0 3.9-2 3.9-5V9" /><path d="M14 7.5c3.6 1.4 6 5 6 9.5 0 2-1 3-2.6 3-2.4 0-3.9-2-3.9-5V9" /></>),
  droplet: <path d="M12 3.2c3.4 4.1 5.8 7.2 5.8 10.1a5.8 5.8 0 1 1-11.6 0C6.2 10.4 8.6 7.3 12 3.2z" />,
};

/* ---------------- Recall's face — the emote system ----------------- */
/* calm      blinking capsule eyes (awake, at rest)                    */
/* listening capsule eyes gently breathing (attention, sound coming in)*/
/* thinking  round eyes looking up-right + rising thought bubbles      */
/* sleeping  flat-dash eyes (muted / paused — "I can't hear you")      */
/* happy     horizontal squint (smiling with the eyes)                 */
/* delighted closed arc eyes + a single sparkle                        */
/* celebrate delighted + radiant rays + sparkles (the big moments)     */
/* talking   composable side "sound arcs"; adds a smile on happy/      */
/*           delighted so speech feels warm without forcing a grin     */

const RecallOrb = ({ size = 56, glow, mood = "calm", talking }) => {
  const party = mood === "celebrate";
  const arcsEyes = mood === "delighted" || party;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {mood === "thinking" && [0, 1, 2].map((i) => (
        <span key={i} className="thoughtDot" style={{ position: "absolute", borderRadius: 99,
          background: "#8FBFFF", width: ([5, 7, 10][i] * size) / 56, height: ([5, 7, 10][i] * size) / 56,
          left: size * (0.8 + i * 0.13), top: -size * (0.01 + i * 0.13), animationDelay: `${i * 0.25}s` }} />
      ))}
      {party && (
        <svg width={size * 1.74} height={size * 1.74} viewBox="0 0 100 100" className="rayPulse"
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = ((i * 45 + 22) * Math.PI) / 180;
            return <line key={i} x1={50 + Math.cos(a) * 37} y1={50 + Math.sin(a) * 37}
              x2={50 + Math.cos(a) * 45} y2={50 + Math.sin(a) * 45}
              stroke="#C0AFF2" strokeWidth="3.4" strokeLinecap="round" />;
          })}
        </svg>
      )}
      {mood === "delighted" && !party && (
        <span className="sparklePop" style={{ position: "absolute", right: -size * 0.14, top: -size * 0.1,
          fontSize: size * 0.22, color: "#F5B84C", lineHeight: 1 }}>✦</span>
      )}
      {party && (
        <>
          <span className="sparklePop" style={{ position: "absolute", right: -size * 0.22, top: -size * 0.08,
            fontSize: size * 0.24, color: "#F5B84C", lineHeight: 1 }}>✦</span>
          <span className="sparklePop" style={{ position: "absolute", left: -size * 0.2, top: size * 0.18,
            fontSize: size * 0.16, color: "#C0AFF2", lineHeight: 1, animationDelay: ".4s" }}>✦</span>
        </>
      )}
      {talking && (
        <>
          <svg width={size * 0.22} height={size * 0.5} viewBox="0 0 14 40" className="sideArc"
            style={{ position: "absolute", left: -size * 0.21, top: size * 0.25 }}>
            <path d="M 11 4 Q 2 20 11 36" stroke="#7FB4FF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </svg>
          <svg width={size * 0.22} height={size * 0.5} viewBox="0 0 14 40" className="sideArc"
            style={{ position: "absolute", right: -size * 0.21, top: size * 0.25, animationDelay: ".35s" }}>
            <path d="M 3 4 Q 12 20 3 36" stroke="#7FB4FF" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </svg>
        </>
      )}
      <div style={{ width: size, height: size, borderRadius: "50%",
        background: "radial-gradient(circle at 32% 28%, #66B2FF 0%, #007AFF 55%, #0058C7 100%)",
        boxShadow: party ? "0 0 30px rgba(168,132,255,.55), 0 6px 22px rgba(0,122,255,.4), inset 0 -3px 8px rgba(0,0,0,.12)"
          : glow ? "0 6px 22px rgba(0,122,255,.45), inset 0 -3px 8px rgba(0,0,0,.12)"
          : "0 3px 10px rgba(0,122,255,.3), inset 0 -3px 8px rgba(0,0,0,.12)" }} />
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        {mood === "thinking" ? (
          <>
            <circle cx="37" cy="46" r="9.5" fill="#fff" />
            <circle cx="62" cy="41" r="11.5" fill="#fff" />
            <circle cx="40.5" cy="42.5" r="4.4" fill="#0A2C4F" />
            <circle cx="66" cy="37" r="5.2" fill="#0A2C4F" />
          </>
        ) : mood === "sleeping" ? (
          <>
            <rect x="25" y="47" width="18" height="6.5" rx="3.2" fill="#fff" />
            <rect x="57" y="47" width="18" height="6.5" rx="3.2" fill="#fff" />
          </>
        ) : arcsEyes ? (
          <>
            <path d="M 28 47 Q 37 35 46 47" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 54 47 Q 63 35 72 47" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
            {talking && <path d="M 40 62 Q 50 71 60 62" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />}
          </>
        ) : mood === "happy" ? (
          <>
            <rect x="20" y="44" width="24" height="10" rx="5" fill="#fff" />
            <rect x="56" y="44" width="24" height="10" rx="5" fill="#fff" />
            {talking && <path d="M 41 64 Q 50 71 59 64" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />}
          </>
        ) : (
          <>
            <rect className={mood === "listening" ? "eyeBreathe" : "orbEye"}
              x="31.5" y="35" width="11.5" height="30" rx="5.7" fill="#fff" />
            <rect className={mood === "listening" ? "eyeBreathe" : "orbEye"}
              x="57" y="35" width="11.5" height="30" rx="5.7" fill="#fff" />
          </>
        )}
      </svg>
    </div>
  );
};

/* a one-shot confetti burst for the moments worth celebrating */
const Burst = ({ n = 12 }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 5 }}>
    {Array.from({ length: n }).map((_, i) => {
      const colors = [C.blue, C.green, C.purple, C.orange, C.red, C.teal];
      return (
        <span key={i} className="confetti" style={{
          left: `${8 + ((i * 83) % 84)}%`, background: colors[i % 6],
          width: i % 3 ? 7 : 5, height: i % 2 ? 10 : 6, borderRadius: i % 4 === 0 ? 99 : 2,
          animationDelay: `${(i % 5) * 0.07}s`, "--dx": `${(i % 2 ? -1 : 1) * (10 + ((i * 7) % 40))}px`,
        }} />
      );
    })}
  </div>
);

/* ------------------------ shared widgets --------------------------- */

/* on/off/ink override the palette so the ring can sit on a dark ground
   without a white puck under it; showCount keeps "5/5" where the count
   IS the message (the earn moment) instead of the settled checkmark */
const InsightRing = ({ filled, need = 5, size = 52, on, off, ink, showCount }) => {
  const segs = [];
  const r = size / 2 - 4;
  for (let i = 0; i < 7; i++) {
    const start = -90 + i * (360 / 7) + 4;
    const end = start + 360 / 7 - 8;
    const p = (a) => [size / 2 + r * Math.cos((a * Math.PI) / 180), size / 2 + r * Math.sin((a * Math.PI) / 180)];
    const [x1, y1] = p(start); const [x2, y2] = p(end);
    const bonus = i >= need;
    segs.push(<path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
      stroke={i < filled ? on || C.purple : off || (bonus ? C.track : C.line)}
      strokeDasharray={bonus && i >= filled ? "2 4" : "none"}
      strokeWidth="4.5" strokeLinecap="round" fill="none" />);
  }
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {segs}
      {filled >= need && !showCount ? (
        <path d={`M ${size * 0.33} ${size * 0.52} l ${size * 0.11} ${size * 0.12} l ${size * 0.23} ${size * -0.26}`}
          stroke={on || C.purple} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize={size * 0.26}
          fontWeight="700" fill={ink || C.ink} fontFamily={FONT}>{filled}/{need}</text>
      )}
    </svg>
  );
};

const DoseRing = ({ frac, size = 40, sw = 4.5, muted }) => {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const full = frac >= 1;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={muted ? C.track : C.line} strokeWidth={sw} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={C.green} strokeWidth={sw} fill="none"
        strokeDasharray={`${Math.max(frac, 0.001) * circ} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray .4s ease" }} />
      {full && (
        <g transform={`rotate(90 ${size / 2} ${size / 2})`}>
          <path d={`M ${size * 0.32} ${size * 0.52} l ${size * 0.12} ${size * 0.13} l ${size * 0.24} ${size * -0.28}`}
            stroke={C.green} strokeWidth={sw * 0.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

const SegBar = ({ total, done, states }) => {
  const arr = states || Array.from({ length: total }, (_, i) => (i < done ? "done" : "open"));
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {arr.map((s, i) => (
        <div key={i} style={{ flex: 1, height: 8, borderRadius: 99,
          background: s === "done" ? C.green : s === "partial" ? C.orange : C.track,
          transition: "background .3s" }} />
      ))}
    </div>
  );
};

/* six tiny pills — live commitment coverage inside a conversation */
const Dots6 = ({ n, light }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} style={{ width: 16, height: 5, borderRadius: 99,
        background: i < n ? C.green : light ? "rgba(255,255,255,.25)" : C.track,
        transition: "background .4s ease" }} />
    ))}
  </div>
);

const Card = ({ children, style, tone, onClick }) => (
  <div onClick={onClick} className={onClick ? "tap" : ""}
    style={{
      background: tone || C.card, borderRadius: 14, padding: 16,
      boxShadow: "0 0 0 0.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.04)",
      cursor: onClick ? "pointer" : "default", ...style,
    }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
    color: C.sub, margin: "22px 6px 8px" }}>
    {children}
  </div>
);

const BigButton = ({ children, tone = "blue", icon, small, onClick }) => {
  const styles = {
    blue: { background: C.blue, color: "#fff", border: "none" },
    tinted: { background: C.blueSoft, color: C.blue, border: "none" },
    ghost: { background: "transparent", color: C.blue, border: `1.5px solid ${C.blue}` },
    red: { background: C.red, color: "#fff", border: "none" },
    white: { background: "#fff", color: C.blue, border: "none" },
    /* on the navy completion ground — lit from the surface, not pasted on */
    glass: { background: "rgba(255,255,255,.17)", color: "#fff", border: "none" },
  }[tone];
  return (
    <button className="tap" onClick={onClick}
      style={{
        width: small ? "auto" : "100%", minHeight: small ? 44 : 54,
        padding: small ? "0 18px" : undefined, borderRadius: 13,
        fontSize: small ? 16 : 17.5, fontWeight: 600, fontFamily: FONT,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        cursor: "pointer", ...styles,
      }}>
      {icon}{children}
    </button>
  );
};

const Row = ({ title, sub, right, leadingBg = C.blueSoft, leading, leadColor = C.blue, pad = "12px 2px", onClick, titleColor }) => (
  <div onClick={onClick} className={onClick ? "tap" : ""}
    style={{ display: "flex", alignItems: "center", gap: 12, padding: pad, cursor: onClick ? "pointer" : "default" }}>
    {leading && (
      <div style={{ width: 42, height: 42, borderRadius: 11, background: leadingBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: leadColor }}>
        {leading}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 16.5, fontWeight: 600, color: titleColor || C.ink }}>{title}</div>
      {sub && <div style={{ fontSize: 14.5, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
    </div>
    {right !== undefined ? right : <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />}
  </div>
);

const Divider = () => <div style={{ height: 0.5, background: C.line, marginLeft: 54 }} />;
const FullDivider = () => <div style={{ height: 0.5, background: C.line }} />;

const UndoPill = ({ onClick }) => (
  <button className="tap" onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, border: "none",
    background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "9px 15px",
    fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT, flexShrink: 0,
  }}>
    <Icon d={icons.undo} size={14} sw={2.2} />Undo
  </button>
);

/* Slim, one-line attention strip — Today stays clean */
const NeedsStrip = ({ count, text, onClick }) => (
  <button className="tap" onClick={onClick} style={{ width: "100%", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", gap: 10, background: C.orangeSoft,
    borderRadius: 12, padding: "11px 13px", marginBottom: 4, fontFamily: FONT, textAlign: "left" }}>
    <span style={{ width: 22, height: 22, borderRadius: 99, background: C.card, color: C.orange,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontSize: 13, fontWeight: 800 }}>
      {count}
    </span>
    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: C.orangeInk,
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {text}
    </span>
    <Icon d={icons.chevron} size={14} color={C.orangeInk} sw={2.4} />
  </button>
);

/* a request STANDS WHERE ITS OUTCOME WILL LIVE, wearing the waiting
   state — never a banner wedged between the page's action and its
   content. The suggested visit waits inside Upcoming; the asked-for
   document waits in the file list; approving turns the row into the
   real thing, right where it stood. One orange chip does the calling
   out; the row is the door to the full request (why · what a yes does).
   The Updates inbox stays the roll-up — this is its in-place echo. */
const PendingRow = ({ icon, title, sub, onClick }) => (
  <div className="tap" onClick={onClick} style={{ display: "flex", alignItems: "flex-start",
    gap: 12, padding: "11px 2px", cursor: "pointer" }}>
    <div style={{ width: 40, height: 40, borderRadius: 11, background: C.orangeSoft, color: C.orange,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon d={icon} size={19} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 600, lineHeight: 1.3, minWidth: 0 }}>{title}</div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
          background: C.orangeSoft, color: C.orangeInk, flexShrink: 0 }}>
          Needs your OK
        </span>
      </div>
      <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

/* the pattern's other half: when the request is about a thing that
   already EXISTS, no new row appears — the waiting state rides ON the
   thing itself, one small orange line under its row. Same for applied
   changes ("moved by Denise — keep it, or undo"). The thing stays the
   subject; the request is a footnote on it. */
const RowNotice = ({ text, onClick, style }) => (
  <button className="tap" onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 6, border: "none",
      background: "none", margin: "-4px 0 2px 54px", padding: "8px 4px 10px 0",
      minHeight: 40, cursor: "pointer", fontFamily: FONT, textAlign: "left", ...style }}>
    <span style={{ fontSize: 13, fontWeight: 650, color: C.orangeInk, lineHeight: 1.35 }}>
      {text}
    </span>
    <Icon d={icons.chevron} size={12} color={C.orangeInk} sw={2.4} />
  </button>
);

const SourceChip = ({ type }) => {
  const cfg = {
    family: { label: "From Sarah · Family", bg: C.orangeSoft, color: C.orangeInk },
    caregiver: { label: "By Denise · Caregiver", bg: C.greenSoft, color: C.greenInk },
    recall: { label: "From Recall", bg: C.blueSoft, color: C.blue },
  }[type];
  return (
    <span style={{ display: "inline-flex", padding: "6px 12px", borderRadius: 99, fontSize: 13.5,
      fontWeight: 700, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

/* Manual confirmation — voice alone never saves a medication or name */
const ConfirmCard = ({ cfg, onAnswer, style }) => (
  <div className="sheetIn" style={{ background: C.card, borderRadius: 16, padding: 15,
    boxShadow: "0 10px 32px rgba(0,0,0,.22)", ...style }}>
    <div style={{ fontSize: 16.5, fontWeight: 700, color: C.ink }}>{cfg.title}</div>
    <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, margin: "4px 0 12px" }}>{cfg.sub}</div>
    <div style={{ display: "flex", gap: 9 }}>
      <button className="tap" onClick={() => onAnswer("yes")} style={{ flex: 1, minHeight: 46, borderRadius: 12,
        border: "none", background: C.blue, color: "#fff", fontSize: 15.5, fontWeight: 700,
        cursor: "pointer", fontFamily: FONT }}>
        {cfg.yes}
      </button>
      <button className="tap" onClick={() => onAnswer("no")} style={{ flex: 1, minHeight: 46, borderRadius: 12,
        border: "none", background: C.track, color: C.ink, fontSize: 15.5, fontWeight: 600,
        cursor: "pointer", fontFamily: FONT }}>
        {cfg.no}
      </button>
    </div>
    {/* the card exists because a NAME must be seen to be verified — she
        can't hear the difference between Osei and O'Shea — but the answer
        stays a TAP on purpose — a name or date is exactly the thing a
        voice can mishear, so the check never runs on the same channel
        it's checking. No "just say yes" here: the tap is the point. */}
  </div>
);

/* ------------------------ period data ------------------------------ */

const COMMITMENTS = ["Medications", "Sleep", "Symptoms", "Exercise", "Nutrition", "Mood"];

/* -------------------------------------------------------------------
   FRAMEWORKS — backend only, never shown to the user as jargon.
   Each commitment has a real clinical elicitation framework. Recall
   uses it as a checklist of what context makes a good visit brief and
   good pattern-finding — NOT as a script. It asks in plain words, fills
   slots opportunistically (one sentence can fill several), skips what's
   already answered, and follows the person out of the box when needed.

   Crucially: filling the framework ≠ "complete." It's *sufficient* —
   a rich-enough picture. The USER decides when a day is done by
   finalizing. `core` = the few slots that make it worth a doctor's
   time; the rest deepen it. `userClose` marks commitments (nutrition)
   where only the person can say they're finished (that missed snack).
------------------------------------------------------------------- */
const FRAMEWORKS = {
  Medications: { code: "MAST", plain: "what you take & how it's going",
    slots: ["Which medication", "Taken, missed or changed", "Side effects", "Timing"], core: 2 },
  Symptoms: { code: "OPQRST", plain: "the shape of a symptom",
    slots: ["When it started", "What helps or worsens it", "What it feels like", "Where it reaches", "How strong", "When it comes & goes"], core: 3 },
  Sleep: { code: "Sleep diary", plain: "how the night went",
    slots: ["Hours slept", "Time to fall asleep", "Waking in the night", "How rested you feel"], core: 2 },
  Exercise: { code: "FITT", plain: "movement & how the body took it",
    slots: ["What you did", "How long", "How hard it felt", "How the body responded"], core: 2 },
  Nutrition: { code: "24-hour recall", plain: "eating & drinking",
    slots: ["Meals", "Snacks", "Drinks & hydration", "Appetite"], core: 1, userClose: true },
  Mood: { code: "TIDE", plain: "how the day felt",
    slots: ["What stirred it", "How strong", "How long it lasted", "What it changed"], core: 2 },
};

/* depth label — never "Complete"; the finalize button is the completion act */
const depthOf = (name, filled) => {
  const f = FRAMEWORKS[name];
  const n = filled.length;
  if (n === 0) return { label: "Open", tone: "open" };
  if (n < f.core) return { label: "A start", tone: "some" };
  if (n < f.slots.length) return { label: "Solid", tone: "good" };
  return { label: "Rich", tone: "good" };
};

/* the demo day's captured slots — a realistic mid-day picture showing
   all three depths: Solid (green), A start (amber — mentioned once,
   below the core), and Open (grey). Order matches the six commitments. */
const REVIEW_DAY = [
  { c: "Medications", filled: ["Which medication", "Taken, missed or changed", "Timing"],
    line: "Both morning pills, taken with breakfast. Only side-effects would add more — and only if there were any." },
  { c: "Sleep", filled: ["Hours slept"],
    line: "Seven hours noted — a start. How rested you felt would tell me whether they were good hours." },
  { c: "Symptoms", filled: ["When it started", "What it feels like", "What helps or worsens it"],
    line: "The knee since your walk — dull, easier by evening. How strong it got is the one thing left to make it clear for Dr. Chen." },
  { c: "Exercise", filled: [],
    line: "Nothing kept here today — the walk waited out the rain. It still counts whenever it happens." },
  { c: "Nutrition", filled: ["Meals"],
    line: "Three meals noted. Snacks or a glass of water count too — but only you know if there were any." },
  { c: "Mood", filled: [],
    line: "Open — a word on how the day felt is plenty. No pressure to name a reason." },
];

/* lens names in Amma's words — "Exercise" and "Nutrition" are the
   clinic's vocabulary; the disclosure sheet speaks hers */
const LENS_NAME = { Medications: "Medications", Symptoms: "Symptoms", Sleep: "Sleep",
  Exercise: "Movement", Nutrition: "Meals", Mood: "Mood" };

/* Today's picture — the human render of REVIEW_DAY. The sentence is the
   interface: whole sentences that breathe on a quiet day, one line when
   decisions are waiting above it. The structure behind it (meters, what
   would add) lives one tap down in "What today covered" — never as a
   headline score. */
const REVIEW_PICTURE = {
  quiet: (<>A <b>solid picture of the knee</b> — since the walk, dull, easier by evening — and <b>your
    medications are current</b>. Sleep got a start: seven hours, nothing on how rested. Three meals
    noted; the walk waited out the rain, and mood didn't come up — that's fine.
    {/* the picture earns its card by SEEING ACROSS DAYS — one held-against-
        the-week line, stated as observation with its evidence, never a
        conclusion. Echoing the day back is a transcript; this is a read. */}
    <span style={{ display: "block", marginTop: 9 }}><b>Held against your week:</b> the knee kept
    Tuesday's shape — louder after a walk, easier by evening — and last night made it two
    seven-hour nights in a row.</span></>),
  short: (<>A <b>solid picture of the knee</b>, your medications current, sleep started — kept in
    your words.</>),
};

const DOSES = {
  day1: [],
  week1: [
    { id: "met-am", name: "Metformin 500 mg", time: "Morning, with food", slot: "morning" },
    { id: "lis-am", name: "Lisinopril 10 mg", time: "Morning", slot: "morning" },
    { id: "met-pm", name: "Metformin 500 mg", time: "Evening, with food", slot: "evening" },
  ],
  week2: [
    { id: "met-am", name: "Metformin 500 mg", time: "Morning, with food", slot: "morning" },
    { id: "lis-am", name: "Lisinopril 10 mg", time: "Morning", slot: "morning" },
    { id: "vitd-am", name: "Vitamin D 1000 IU", time: "Morning", slot: "morning" },
    { id: "met-pm", name: "Metformin 500 mg", time: "Evening, with food", slot: "evening" },
  ],
  visitday: [
    { id: "met-am", name: "Metformin 500 mg", time: "Morning, with food", slot: "morning" },
    { id: "lis-am", name: "Lisinopril 10 mg", time: "Morning", slot: "morning" },
    { id: "vitd-am", name: "Vitamin D 1000 IU", time: "Morning", slot: "morning" },
    { id: "met-pm", name: "Metformin 500 mg", time: "Evening, with food", slot: "evening" },
  ],
  month1: [
    { id: "met-am", name: "Metformin 500 mg", time: "Morning, with food", slot: "morning" },
    { id: "cal-am", name: "Calcium 600 mg", time: "Was due 8:00 AM", overdue: true, slot: "morning" },
    { id: "met-pm", name: "Metformin 500 mg", time: "Evening, with food", slot: "evening" },
    { id: "lis-pm", name: "Lisinopril 10 mg", time: "Evening · moved by Denise", slot: "evening" },
  ],
};

/* doses already logged when a period opens — with the time they happened */
const TAKEN_DEFAULT = {
  day1: [], week1: ["met-am", "lis-am"], week2: ["met-am", "lis-am", "vitd-am"],
  visitday: ["met-am", "lis-am", "vitd-am"], month1: ["met-am"],
};

/* the demo's frozen clock — matches the status bar */
const NOW_TIME = "9:41 AM";
const defaultDoseLog = (p) =>
  Object.fromEntries(TAKEN_DEFAULT[p].map((id) => [id, { status: "taken", time: "8:05 AM" }]));

/* time-of-day groups: Today logs by MOMENT, not by pill */
const SLOTS = {
  morning: { label: "Morning", time: "8:00 AM", order: 8 },
  midday: { label: "Midday", time: "12:00 PM", order: 12 },
  evening: { label: "Evening", time: "8:00 PM", order: 20 },
};
const slotOf = (d) => (typeof d.slot === "string" ? { key: d.slot, ...SLOTS[d.slot] } : d.slot);
/* group by EXACT time — 8:00 AM and 10:00 AM never merge into "Morning" */
const dayPartOf = (order) => (order < 12 ? "Morning" : order < 17 ? "Afternoon" : "Evening");
const groupDoses = (doses) => {
  const map = new Map();
  doses.forEach((d) => {
    const s = slotOf(d);
    if (!s) return;
    const t = s.time || s.label;
    if (!map.has(t)) map.set(t, { key: t, time: t, daypart: dayPartOf(s.order), order: s.order, items: [] });
    map.get(t).items.push(d);
  });
  return [...map.values()].sort((a, b) => a.order - b.order);
};
const parseClock = (t) => {
  const [hm, ap] = t.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + m;
};
const shortMedName = (name) => name.replace(/\s+\(.+?\)/, "").replace(/\s\d.*$/, "");

/* base cabinet contents per period (custom meds stack on top) */
const CABINET_BASE = (period) =>
  period === "day1" ? []
  : ["Metformin 500 mg", "Lisinopril 10 mg",
     ...(period !== "week1" ? ["Vitamin D 1000 IU"] : []),
     ...(period === "month1" ? ["Calcium 600 mg", "Tylenol 500 mg"] : [])];

/* month 1 has an as-needed med in the cabinet already */
const BASE_ASNEEDED = {
  day1: [], week1: [], week2: [], visitday: [],
  month1: [{ id: "tyl-an", name: "Tylenol 500 mg", look: { shape: "oblong", color: "white" } }],
};

const WEEK_DAYS = {
  day1: [null, null, null, null, null, null, "today"],
  week1: [null, null, 1, 1, 0.5, 1, "today"],
  week2: [1, 1, 0.75, 1, 1, 1, "today"],
  visitday: [1, 0.75, 1, 1, 1, 1, "today"],
  month1: [1, 1, 0.5, 1, 1, 1, "today"],
};

/* one calendar, everywhere — every period has a real "today", and every
   strip, day label, and record header derives from it. A strip that says
   the 13th is a Sunday while the greeting says Thursday teaches her the
   app can't be trusted with dates. */
const PERIOD_TODAY = {
  day1: [2026, 6, 21], week1: [2026, 6, 28], week2: [2026, 6, 30],
  visitday: [2026, 6, 31], month1: [2026, 7, 13],
};
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
let CURRENT_PERIOD = "day1"; // set by App each render — read by strips that sit far from period props
const trailingWeek = (period) => {
  const [y, m, d] = PERIOD_TODAY[period] || PERIOD_TODAY[CURRENT_PERIOD] || PERIOD_TODAY.month1;
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(y, m, d - i);
    const w = WEEKDAY_NAMES[dt.getDay()];
    out.push({ letter: w[0], name: w, date: `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}` });
  }
  return out;
};

const PAST_DAY_DOSES = [
  { name: "Metformin 500 mg", time: "Morning", taken: true },
  { name: "Lisinopril 10 mg", time: "Morning", taken: true },
  { name: "Metformin 500 mg", time: "Evening · missed", taken: false },
];

/* prompt-first — status never leads */
const CHECKIN = {
  day1: {
    mode: "progress", started: "from your setup", done: 3, open: ["Exercise", "Nutrition", "Mood"],
    msgs: ["When you're ready — how has the morning been?", "We can pick up right where your setup left off."],
  },
  week1: {
    mode: "new",
    msgs: [
      "You mentioned the stairs yesterday — how did they treat you today?",
      "Did going to bed earlier help you sleep last night?",
      "Three walks this week already. Up for one today?",
    ],
    hint: "About two minutes, whenever you're ready",
  },
  week2: {
    mode: "progress", started: "started 8:40 AM", done: 4, open: ["Exercise", "Mood"],
    states: ["done", "partial", "done", "open", "done", "open"],
    line: "3 solid · sleep started",
    msgs: [
      "The stairs came up this morning — easier the second time?",
      "Just exercise and mood left. How's the afternoon going?",
    ],
  },
  visitday: { mode: "visitday" },
  month1: { mode: "done", finalizedAt: "9:05 AM" },
};

/* starting points — an in-conversation helper; each one launches the
   matching scripted moment, so the bulb feels real rather than decorative */
const IDEAS = [
  { t: "The stairs", s: "You've mentioned them twice this week", scen: "base" },
  { t: "Your knee after Tuesday's walk", s: "It was sore that evening", scen: "opqrst" },
  { t: "Sleep", s: "You were up at 3 AM on Friday", scen: "sleep" },
  { t: "Exercise & mood", s: "Still open today", scen: "wrap" },
];

/* internal scenario tester — the flask.
   ONE script per moment, rendered two ways: as live call captions and
   as chat bubbles. Turn kinds:
   r = Recall speaks (mood: calm | happy | thinking)  ·  a = Amma speaks
   think = visible thinking chip  ·  stage = backstage note (internal
   preview only — Amma never sees these)  ·  note = something captured
   quietly (cap = what it is + where it lands)  ·  confirm = blocking
   tap-to-confirm (used ONLY when a mishearing would corrupt the record)

   cap payloads — what the review does with each capture:
   kind "confirm"  a fact decision: an open Needs-your-OK card (yes/no)
   kind "done"     confirmed in the call already: a checked one-liner,
                   reopenable with "change" until finalize
   kind "kept"     no decision at all — the fact shows its fate in plain
                   words; routing happens AFTER finalize (the router),
                   and "which brief?" is decided inside the brief itself
   fields: sub (context line) · yes/no (the two actions) · doneLine /
   skipLine (the collapsed one-liners) · group (collapsed accordion
   label) · fate (+ fateTone "green" for the router's promise) · home
   (where it lands after finalize — "brief" = the building brief) ·
   fix + fixDone (the typed correction spec for "Fix a detail" and the
   verb its fixed one-liner ends with) · resay (the scoped script that
   re-opens the talk for facts kept in her words) */

/* the queued captures, shared — the same fact can arrive from its own
   moment or from the everything moment, and the review merges by title */
/* ------------------------- the topics layer ------------------------ */
/* A topic is a living container of receipts, never a diagnosis: Recall
   proposes, attaches and quotes; only Amma changes what a topic IS —
   follow, pause, resolve, reopen, rename, stop. Silence never resolves
   anything: a quiet topic ASKS, once, on its own page. Each period
   seeds the lifecycle it demonstrates; `moved` is what today's talk
   did to the story (the completion moment reads it); `bringup` is the
   turns the in-call drawer injects when she hands the topic to the
   conversation. A `proposed` topic exists only as a review card until
   she follows it. */
/* safety-netting, region-true: a symptom topic that can have an urgent
   face carries the when-to-worry line every good clinician gives — and
   the NUMBERS come from her profile's region, because "call 8‑1‑1"
   only helps in a province where 8‑1‑1 answers. Stated once, on the
   topic's own page — present, not alarming.                           */
const DIZ_SAFETY = "If a morning ever feels frightening — you fall, or the room won't settle — 8‑1‑1 reaches an Info-Santé nurse any hour, and 9‑1‑1 is for right now. Recall names the right numbers because your profile knows your region — you never have to guess in a hard moment.";
const DIZ_TOPIC = {
  id: "diz", name: "Morning dizziness", proposed: true, state: "active", since: "today",
  latest: "“a little when I stood up — gone in a minute”", latestWhen: "today",
  meta: "2 mentions this week · watching mornings",
  why: "Lisinopril can bring a brief dizziness on standing — with it in your cabinet, mornings earned a daily eye. Context, not a conclusion.",
  safety: DIZ_SAFETY,
  moved: "followed just now — its two mentions are already connected",
  bringup: [
    { k: "r", t: "The dizziness — did this morning bring any?" },
    { k: "a", t: "A little when I first stood up. It passes in a minute." },
    { k: "r", t: "Noted with the others — mornings, brief, passing. If the week keeps that shape, it's one for Dr. Chen." },
  ],
  story: [
    { icon: "mic", title: "“A little when I stood up today”", sub: "Check-in · today" },
    { icon: "mic", title: "“Dizzy when I got up too fast”", sub: "Check-in · Tuesday — where it started" },
  ],
  goes: [],
};
const TOPICS = {
  day1: [],
  week1: [
    { id: "knee", name: "The knee after walks", state: "active", since: "July 26",
      latest: "“I held the rail, but I didn't stop halfway”", latestWhen: "today",
      meta: "3 check-ins · Dr. Chen July 31",
      moved: "today's note joined its story — day 3",
      bringup: [
        { k: "r", t: "The knee — yesterday the stairs went better. How is it after today's walk?" },
        { k: "a", t: "Still good. A little stiff at the top, gone by the time I sat down." },
        { k: "r", mood: "happy", t: "Three days the same shape now — stiff briefly, then it lets go. It's in the knee's own story." },
      ],
      story: [
        { icon: "mic", title: "“Didn't stop halfway this time”", sub: "Check-in · today" },
        { icon: "mic", title: "“Stiff first thing, fine after”", sub: "Check-in · Monday" },
        { icon: "mic", title: "“The knee complained on the stairs”", sub: "Check-in · Sunday — where it started" },
      ],
      goes: [
        { icon: "visits", title: "Dr. Chen's brief — July 31", sub: "this week's shape, 2 lines", page: "briefReport" },
      ] },
  ],
  week2: [
    { id: "knee", name: "The knee after walks", state: "active", since: "July 26",
      latest: "“easier on the stairs this week”", latestWhen: "today",
      meta: "6 check-ins · 2 photos · Dr. Chen tomorrow",
      moved: "today's note joined its story — day 6",
      bringup: [
        { k: "r", t: "The knee — last time the stairs were easier. How were they today?" },
        { k: "a", t: "Good again. I only held the rail out of habit." },
        { k: "r", mood: "happy", t: "Out of habit is a lovely reason. That's another easy day in the knee's story — Dr. Chen will see the week whole." },
      ],
      story: [
        { icon: "mic", title: "“Easier on the stairs this week”", sub: "Check-in · today" },
        { icon: "camera", title: "Swelling photos", photos: ["JUL 25", "JUL 28"] },
        { icon: "pattern", title: "Blood pressure that week", sub: "3 readings, kept with their sources" },
        { icon: "mic", title: "“Barely complained on my walk”", sub: "Check-in · Monday" },
      ],
      goes: [
        { icon: "visits", title: "Dr. Chen's brief — tomorrow", sub: "2 lines from this topic", page: "briefReport" },
        { icon: "spark", title: "Weekly insight — watching", sub: "walk-day pattern · 3 of 5 days" },
      ] },
    { id: "sleep", name: "Sleep", state: "active", since: "July 26",
      latest: "“seven hours — best all week”", latestWhen: "today",
      meta: "4 check-ins · the earlier bedtime",
      moved: "third night the earlier bedtime held",
      bringup: [
        { k: "r", t: "Sleep — the earlier bedtime held twice. How was last night?" },
        { k: "a", t: "Right through to six again." },
        { k: "r", mood: "happy", t: "Three in a row. The shape is holding — it's all in the sleep story." },
      ],
      story: [
        { icon: "mic", title: "“Seven hours — best all week”", sub: "Check-in · today" },
        { icon: "mic", title: "“Up at 3 AM again”", sub: "Check-in · Sunday — where it started" },
      ],
      goes: [
        { icon: "spark", title: "Weekly insight — watching", sub: "earlier bedtime × steadier nights" },
      ] },
    DIZ_TOPIC,
  ],
  visitday: [
    { id: "knee", name: "The knee after walks", state: "active", since: "July 26",
      latest: "“barely complained this week”", latestWhen: "yesterday",
      meta: "the week's shape is in today's brief",
      moved: "ready for Dr. Chen — its whole week is in",
      story: [
        { icon: "mic", title: "“Barely complained this week”", sub: "Check-in · yesterday" },
        { icon: "mic", title: "“Easier on the stairs”", sub: "Check-in · Monday" },
      ],
      goes: [
        { icon: "visits", title: "Dr. Chen's brief — today", sub: "2 lines from this topic", page: "briefReport" },
      ] },
  ],
  month1: [
    { id: "knee", name: "The knee after walks", state: "active", since: "July 26",
      latest: "“walked with Sarah, knee fine”", latestWhen: "today",
      meta: "14 check-ins · 3 photos",
      moved: "today's walk joined its story — an easy day",
      story: [
        { icon: "mic", title: "“Walked with Sarah, knee fine”", sub: "Check-in · today" },
        { icon: "camera", title: "Swelling photos", photos: ["JUL 28", "AUG 1", "AUG 4"] },
        { icon: "mic", title: "“Easier on the stairs this week”", sub: "Check-in · August 6" },
      ],
      goes: [] },
    { id: "diz", name: "Morning dizziness", state: "active", since: "August 6",
      latest: "“only when I stand up fast now”", latestWhen: "today",
      meta: "New since the dose change — watching mornings",
      why: "Lisinopril can bring a brief dizziness on standing — with it in your cabinet, mornings earned a daily eye. Context, not a conclusion.",
      safety: DIZ_SAFETY,
      moved: "its fourth morning noted — the dose-change window is filling in",
      bringup: DIZ_TOPIC.bringup,
      story: [
        { icon: "mic", title: "“Only when I stand up fast now”", sub: "Check-in · today" },
        { icon: "mic", title: "“A little when I stood up”", sub: "Check-in · August 6 — where it started" },
      ],
      goes: [
        { icon: "spark", title: "Weekly insight — watching", sub: "mornings × the dose change" },
      ] },
    /* the quiet-topic ask, positively: the 3 AM problem this topic was
       born for stopped coming up — the good nights are the evidence,
       so the ask reads as a close-out, never a contradiction */
    { id: "sleep", name: "Sleep", state: "active", stale: true, since: "July 26",
      latest: "“slept eight hours — a good night”", latestWhen: "today",
      meta: "Sleeping well since July 30",
      staleLine: "Sleeping well for 2 weeks — mark it resolved?",
      story: [
        { icon: "mic", title: "“Slept eight hours — a good night”", sub: "Check-in · today" },
        { icon: "mic", title: "“Seven hours — best all week”", sub: "Check-in · July 30" },
        { icon: "mic", title: "“Up at 3 AM again”", sub: "Check-in · July 26 — where it started" },
      ],
      goes: [] },
    { id: "hearing", name: "Hearing test referral", state: "waiting", since: "August 6",
      line: "Thursday — nothing needed from you yet",
      story: [
        { icon: "visits", title: "Sarah booked it", sub: "next Thursday · in your Visits" },
      ],
      goes: [] },
    /* settled inside the diary's own era — a story that predates the
       first entry (July 21) would be a record the app can't have */
    { id: "rash", name: "Rash on left forearm", state: "settled", since: "August 2",
      line: "Resolved August 11 — “completely gone”",
      resolved: "August 11", latest: "“completely gone”",
      story: [
        { icon: "mic", title: "“Completely gone”", sub: "Check-in · August 11 — you resolved it" },
        { icon: "camera", title: "Rash photos", photos: ["AUG 3", "AUG 8"] },
      ],
      goes: [] },
  ],
};

/* the visible stack for a period: proposals stay invisible until
   followed — and a topic followed in ANY period's demo (the flask
   plays everywhere) still gets its page */
const topicsFor = (period, followed = []) => {
  const base = TOPICS[period] || [];
  const extra = followed.includes("diz") && !base.some((t) => t.id === "diz") ? [DIZ_TOPIC] : [];
  return [...base, ...extra].filter((t) => !t.proposed || followed.includes(t.id));
};

const CAPS = {
  question: { icon: "question", t: "“Should the water pill move to mornings?”", kind: "kept",
    group: "Question noted",
    fate: "kept for your visits — routed after you finalize", fateTone: "green", home: "brief",
    picture: "your water-pill question rides along to the right visit",
    short: "a kept question",
    resay: "resayq" },
  /* the visit arrived with no doctor named — that's the honest state.
     A KNOWN doctor named in the talk is resolved in-call (the drname
     check) and the card would arrive already linked; an unnamed one is
     attached here from the care team, or waits for Recall to ask. */
  visit: { icon: "visits", t: "Hearing test — next Thursday", kind: "confirm",
    sub: "Sarah booked it · a test · no doctor named yet — never added by voice alone",
    yes: "Add to Visits", no: "Not now", group: "Appointment heard",
    doneLine: "Hearing test — added to Visits", skipLine: "Hearing test — set aside, waits in Updates",
    fix: { type: "visit", what: "Hearing test", vkind: "Test", heard: "Next Thursday",
      people: [
        ["Dr. Osei", "Eyes — in your visit history"],
        ["Dr. Chen", "Cardiology — Thursday's brief is building"],
        ["Dr. Patel", "Family medicine — July 24 visit"],
      ] },
    fixDone: "added to Visits",
    picture: "the hearing test is on its way to Visits",
    home: "Visits" },
  /* the second appointment names its doctor out loud — so unlike the
     hearing test it arrives already attached: the two cards together
     show both identity states side by side */
  /* the WHAT is the visit's reason, never the doctor — the doctor has
     his own row (With). Naming him twice would make the drawer lie. */
  visit2: { icon: "visits", t: "Follow-up with Dr. Patel — in two weeks", kind: "confirm",
    sub: "a follow-up, about your lab results · you named him, so he's attached",
    yes: "Add to Visits", no: "Not now", group: "Appointment heard",
    doneLine: "Follow-up with Dr. Patel — added to Visits",
    skipLine: "The Patel follow-up — set aside, waits in Updates",
    fix: { type: "visit", what: "Your lab results", vkind: "Follow-up", heard: "In two weeks", who: "Dr. Patel",
      people: [
        ["Dr. Osei", "Eyes — in your visit history"],
        ["Dr. Chen", "Cardiology — Thursday's brief is building"],
        ["Dr. Patel", "Family medicine — July 24 visit"],
      ] },
    fixDone: "added to Visits",
    picture: "the Patel follow-up is set for two weeks out",
    home: "Visits" },
  scan: { icon: "scan", t: "Scan the lab letter", kind: "kept", scanNow: true,
    group: "Scan reminder",
    fate: "a reminder lands on Today when you finalize — or scan it right now",
    picture: "the lab letter waits for its scan",
    short: "a scan reminder",
    home: "Today" },
  /* the topic proposal — the first meeting IS the onboarding, asked at
     review where the decision is real. THREE outcomes, not two: Follow
     it (the topic is born), Just this entry (a real decision — the
     mention stays in today's note, nothing waits anywhere), or left
     unanswered (stays out of memory, waits in Updates). `alt` is the
     decided-no: settled, never skipped. */
  topicprop: { icon: "topic", t: "Follow “Morning dizziness”?", kind: "confirm",
    group: "Topic proposed",
    sub: "mentioned twice this week — following connects its check-ins, readings and visits in one place",
    yes: "Follow it", alt: "Just this entry",
    doneLine: "Morning dizziness — followed, in Journal › Topics",
    altLine: "Morning dizziness — kept in today's entry only",
    skipLine: "The dizziness proposal — set aside, waits in Updates",
    firstNote: "Your first one? Followed topics live under Journal, in Topics.",
    picture: "the morning dizziness is a story Recall now follows",
    topicId: "diz", topicName: "Morning dizziness",
    home: "Topics" },
};

/* each blurb tells the tester what plays, what to tap, and where to
   look for the result — the flask is a test bench, so the label IS the
   test plan. "Everything at once" sits on top: one talk that exercises
   every mechanism, for seeing the whole UI end to end. */
const SCEN_GROUPS = [
  ["The whole system", [
    ["everything", "Everything at once", "Every mechanism in one talk: a med confirm, a past visit filed, a kept question, TWO appointments (one with its doctor named, one without), a scan reminder and a topic proposal. Done → every review variant at once — two saved-in-call rows, open cards plus waiting cards, two kept facts, a Follow-it proposal — then the full completion sequence with the topics moment."],
  ]],
  ["The conversation itself", [
    ["base", "An ordinary moment", "The stairs follow-up, no captures. Done → the quiet review — nothing needs your OK, the picture breathes — then the one-screen put-away."],
    ["multi", "Three topics in one breath", "One answer touches four lenses, none re-asked. At review, open “How Recall read today” — each lens shows what that one sentence gave it."],
    ["opqrst", "A symptom, explored gently", "OPQRST fills backstage in plain words. The review sheet shows Symptoms as Solid, naming the one detail that would add more."],
    ["offtopic", "A wander off topic", "The grandson story becomes the mood entry, then a gentle return. No captures — the picture read at review carries it."],
    ["memory", "Recall pulls a memory", "A live lookup with a visible thinking state. A pattern candidate banks backstage; nothing queues for review."],
  ]],
  ["Needs your OK — mid-talk", [
    ["medconf", "A new medication is heard", "Blocking confirm — names are easy to mishear. Tap Save it → review shows a checked “saved in the call” row; change reopens it, and Fix a detail uses dose and timing pickers, search, or the bottle scanner — never a keyboard over heard health data."],
    ["drname", "A past visit, fuzzy name", "She mentions seeing “Dr. O-shay” — a past visit, filed into her history in her words; the confirm only pins WHO. Review shows “Tuesday's eye visit — filed under Dr. Osei”; Fix picks from her own care team."],
  ]],
  ["Beyond the six lenses", [
    ["question", "A question for the doctor", "Kept in your words, no chooser. Review shows its fate — “routed after you finalize.” Misheard? The row's own “Say it again” re-opens the talk and Recall replaces the wording; nothing is ever retyped."],
    ["visitmention", "A new appointment comes up", "Queues an open card at review: Add to Visits · Fix a detail (attach a doctor from your care team, pick the day on a calendar, or keep it honestly unsure) · Not now. Finalizing past it asks first."],
    ["docmention", "Papers to scan later", "Mid-call, scanning would yank her out of the talk — so it queues. At review the talk is over, so it's a choice: Scan now (the real scanner, files immediately) or let it land on Today."],
    ["topicprop", "A second mention becomes a topic", "Dizziness comes up again — the threshold (asked-for, recurring, or future-relevant) queues a proposal at review, never a topic by itself. Follow it → it lives in Journal › Topics; Just this entry → today's note keeps it and nothing else happens; unanswered → waits in Updates."],
  ]],
  ["Ending & after", [
    ["wrap", "All six — wrap up", "The goodbye beat: happy orb, all six touched, Done leads into the review."],
    ["reopen", "Adding after finalize", "A finalized day takes an evening note with its own time. Done → “Review the addition” — one primary action; the morning entry never mutates."],
  ]],
  ["In someone's room", [
    ["carenote", "A care note about Thatha", "Observer check-in — filed as Amma's words, his to read, never his journal. No review; its own filing pipeline."],
  ]],
];

const SCRIPTS = {
  /* one talk, every mechanism — the test bench's whole-system run.
     Composes the SAME caps as the single moments (the review merges by
     title), so it demos exactly what the pieces do, just together. */
  everything: { cover: 3, turns: [
    { k: "r", t: "Big morning, Amma — tell me everything, I'll sort it as we go." },
    { k: "a", t: "Slept seven hours, took both pills — and the pharmacist started me on atorvastatin yesterday. Little white pill, evenings." },
    { k: "think", t: "New medication heard — checking the name…" },
    { k: "r", mood: "thinking", t: "Atorvastatin, 20 milligrams, in the evening — did I hear that right? I won't save it until you tap yes." },
    { k: "confirm", c: "medconf" },
    { k: "r", mood: "happy", t: "It's in your cabinet with this evening as the first dose. What else?", ifYes: "medconf", cover: 4 },
    { k: "a", t: "I saw Dr. O-shay about my eyes on Tuesday. And I keep wondering — should the water pill move to mornings? It wakes me at night." },
    { k: "think", t: "That could be Dr. Osei from your visit history — checking…" },
    { k: "r", mood: "thinking", t: "Was that Dr. Osei — O, S, E, I — or someone new?" },
    { k: "confirm", c: "drname" },
    { k: "note", t: "Question kept, in your words — routed to the right visit after you finalize",
      cap: CAPS.question },
    { k: "r", t: "Tuesday's visit is in your history, and your water-pill question is kept exactly as you said it — it finds the right visit once you finalize.", ifYes: "drname" },
    { k: "a", t: "Before I forget — Sarah booked me a hearing test for next Thursday, and Dr. Patel wants to see me about the results in two weeks. Oh, and the lab mailed those results; the envelope is on the table." },
    { k: "think", t: "Two appointments and a letter — queuing all three…" },
    { k: "note", t: "Queued for review — voice alone never adds a visit", cap: CAPS.visit },
    { k: "note", t: "Queued for review — Dr. Patel is attached; the date waits for your OK", cap: CAPS.visit2 },
    { k: "note", t: "Scan reminder queued — it appears on Today once you finalize", cap: CAPS.scan },
    { k: "a", t: "And I've been a little dizzy in the mornings again — same as Tuesday, just for a minute when I stand up." },
    { k: "think", t: "Second dizziness mention this week — that could be its own story…" },
    { k: "note", t: "Topic proposed — you'll decide at review; nothing is followed without you", cap: CAPS.topicprop },
    { k: "r", mood: "happy", t: "Both appointments and the dizziness wait for your OK at review, and I'll remind you about the letter after we finish. That's a full morning — anything else, or shall I put it together?", cover: 6 },
  ]},
  base: { cover: 4, turns: [
    { k: "r", t: "The stairs — you said they were stiff yesterday. How did they go today?" },
    { k: "a", t: "Better, actually. I held the rail, but I didn't stop halfway this time." },
    /* a primed question SHOWS ITS WORK — the why appears only when the
       reason isn't hers (profile context), never on ordinary follow-ups */
    { k: "r", mood: "happy", t: "No stop halfway — that's new this week. Did the knee complain afterwards?",
      why: "Your knees are long-standing in your profile — so Recall asks about change, never the fact of them." },
    { k: "a", t: "A little at the top. Gone by breakfast." },
    { k: "stage", t: "Symptoms · OPQRST — timing (mornings) ✓ severity (mild, easing) ✓ what-eases (rest) ✓. Onset & quality still open — not chased" },
    { k: "r", t: "So mornings are the stiff part and it fades — that shape has held three days now. Anything else moving around?", cover: 5 },
    { k: "a", t: "Nothing else — though no walk yet. The rain hasn't let up since I woke. Maybe after tea." },
    { k: "r", mood: "happy", t: "Then the stairs were today's moving, and the walk keeps its chance this evening. Whenever you're ready, I'll put the morning together." },
  ]},
  multi: { cover: 2, turns: [
    { k: "r", t: "How has the day treated you so far?" },
    { k: "a", t: "Slept seven hours, took both pills with breakfast, and the knee barely complained on my walk." },
    { k: "think", t: "One answer, several things — sorting…" },
    { k: "stage", t: "One pass touched four: Sleep (hours) · Meds (taken+timing) · Symptoms (severity) · Exercise (type). Each still has open slots — none forced, none re-asked" },
    { k: "r", mood: "happy", t: "That one sentence gave me a piece of four things — sleep, the pills, the knee and your walk. I've noted them all; we can go deeper on any of them, or leave them as they are.", cover: 5 },
    { k: "a", t: "Ha — I didn't even notice I'd done that." },
    { k: "r", t: "That's the idea — talk normally, I'll sort it. Meals and mood haven't come up yet, whenever you feel like it." },
  ]},
  opqrst: { cover: 3, turns: [
    { k: "r", t: "Anything bothering you body-wise today?" },
    { k: "a", t: "That knee again. It's been acting up since my walk." },
    { k: "stage", t: "Symptoms · OPQRST — onset (after the walk) ✓. Next slot: quality — asked in plain words, never named" },
    { k: "r", t: "Since the walk — noted. Is it more of a dull ache, or sharp when you move?" },
    { k: "a", t: "Dull, mostly. Sharp if I twist it getting out of the chair." },
    { k: "stage", t: "quality (dull) ✓ what-worsens (twisting) ✓. Severity next — as a comparison, no 1-to-10 scales, ever" },
    { k: "r", t: "And next to last week — worse, better, or about the same?" },
    { k: "a", t: "About the same. Maybe a touch better in the evenings." },
    { k: "stage", t: "severity (stable) ✓ timing (eases evenings) ✓ — 5 of 6 slots, core met. Stop here; it's a chat, not an intake form" },
    { k: "r", mood: "happy", t: "That's a good picture of the knee, and it's in your journal in your words. If Dr. Chen asks, it's ready — and you can add more any time.", cover: 4 },
  ]},
  offtopic: { cover: 4, turns: [
    { k: "r", t: "Anything else about your energy today?" },
    { k: "a", t: "Oh — my grandson called! He's coming Saturday. I've been planning what to cook all afternoon…" },
    { k: "r", mood: "happy", t: "That's lovely — a Saturday visit to cook for. No wonder the afternoon flew by." },
    { k: "stage", t: "Off topic, but not lost — Mood · TIDE: trigger (grandson's visit) ✓ intensity (bright) ✓. Log it, then steer back through the door the story opened", cover: 5 },
    { k: "r", t: "And in all that excitement — did dinner still happen, or should I note a light one?" },
    { k: "a", t: "Soup and toast. I was too busy planning the real cooking!" },
    { k: "r", mood: "happy", t: "Soup and toast counts. That's a meal noted — and mood wrote itself today. Only you know if there was a snack in there too.", cover: 6 },
  ]},
  memory: { cover: 4, turns: [
    { k: "a", t: "The stairs were tricky again this morning." },
    { k: "think", t: "Checking your last mention of the stairs · July 27" },
    { k: "r", t: "Found it — last Tuesday they were stiff in the morning too, and better by noon. Same pattern today?" },
    { k: "a", t: "Exactly the same, actually." },
    { k: "r", t: "Then that's a shape worth watching — stiff starts, smooth afternoons. I'll see if the week keeps it up." },
    { k: "stage", t: "Pattern candidate saved — needs more days before it can become a weekly insight" },
  ]},
  medconf: { cover: 4, turns: [
    { k: "r", t: "Anything change with your medications?" },
    { k: "a", t: "Oh — the pharmacist started me on atorvastatin yesterday. Little white pill, evenings." },
    { k: "think", t: "New medication heard — checking the name…" },
    { k: "r", mood: "thinking", t: "Atorvastatin, 20 milligrams, in the evening — did I hear that right? I won't save it until you tap yes." },
    { k: "confirm", c: "medconf" },
    { k: "r", mood: "happy", t: "It's in your cabinet with this evening as the first dose. You can change any detail there, any time.", ifYes: "medconf" },
  ]},
  drname: { cover: 4, turns: [
    { k: "a", t: "I saw Dr. O-shay about my eyes on Tuesday." },
    { k: "think", t: "That could be Dr. Osei from your visit history — checking…" },
    { k: "r", mood: "thinking", t: "Was that Dr. Osei — O, S, E, I — or someone new?" },
    { k: "confirm", c: "drname" },
    { k: "r", t: "Got it — Tuesday's eye visit is in your history under Dr. Osei, kept in your words.", ifYes: "drname" },
  ]},
  question: { cover: 4, turns: [
    { k: "a", t: "I keep wondering if I should take the water pill in the morning instead — it wakes me at night." },
    { k: "think", t: "That sounds like one for a doctor…" },
    { k: "r", t: "That's a good question for a doctor rather than me. Want me to keep it so you don't have to remember it?" },
    { k: "a", t: "Yes please." },
    { k: "note", t: "Question kept, in your words — routed to the right visit after you finalize",
      cap: CAPS.question },
    { k: "r", t: "Kept, exactly as you said it. Once your record is final it finds the right visit by itself — and you'll see where it landed." },
  ]},
  visitmention: { cover: 4, turns: [
    { k: "a", t: "Before I forget — Sarah booked me a hearing test for next Thursday." },
    { k: "think", t: "New appointment heard — next Thursday…" },
    { k: "r", t: "A hearing test next Thursday — shall I add it to your Visits so a brief can start building?" },
    { k: "a", t: "Yes, add it." },
    { k: "note", t: "Queued for review — voice alone never adds a visit", cap: CAPS.visit },
    { k: "r", t: "I've set it aside. You'll confirm the details when we finish, and then it lands in Visits — nothing is booked by voice alone." },
  ]},
  docmention: { cover: 4, turns: [
    { k: "a", t: "The lab mailed my results yesterday — the envelope is sitting on the table." },
    { k: "r", t: "Perfect timing. I'll remind you to scan it after we finish — no need to interrupt our talk to go get it." },
    { k: "note", t: "Scan reminder queued — it appears on Today once you finalize", cap: CAPS.scan },
    { k: "a", t: "Good. I'd have forgotten it by lunch." },
    { k: "r", mood: "happy", t: "That's what I'm for. One tap when we're done — I'll read it, file it, and explain it in plain words." },
  ]},
  /* the topic threshold crossed out loud — the proposal QUEUES, the
     talk moves on. Recall never follows anything by itself; the first
     proposal card is also how topics introduce themselves. */
  topicprop: { cover: 3, turns: [
    { k: "r", t: "How were the mornings — any more of that dizziness?" },
    { k: "a", t: "A little when I stood up today. Same as Tuesday — gone in a minute." },
    { k: "think", t: "Second mention this week — same words, same time of day…" },
    { k: "stage", t: "Topic threshold met (recurring) — proposal queued for review. Recall proposes; only Amma follows" },
    { k: "r", t: "That's twice this week, so I'd like to keep the dizziness mentions together in one place. I'll ask you properly when we review — you decide." },
    { k: "note", t: "Topic proposed — you'll decide at review; nothing is followed without you", cap: CAPS.topicprop },
    { k: "r", t: "Nothing to do now — it just waits for the end of our talk. What else about today?", cover: 4 },
  ]},
  sleep: { cover: 4, turns: [
    { k: "r", t: "You were up at 3 AM on Friday — how did last night compare?" },
    { k: "a", t: "Right through to six. The earlier bedtime is working." },
    { k: "r", mood: "happy", t: "Three nights in a row now. I'll keep watching whether the earlier bedtime holds the pattern.", cover: 5 },
  ]},
  wrap: { cover: 6, turns: [
    { k: "r", mood: "happy", t: "You've touched all six today, Amma — medications, sleep, the knee, your walk, meals and a bright mood." },
    { k: "a", t: "Already? That was quick." },
    { k: "stage", t: "All six hold at least one detail; three are rich. 'Done' isn't Recall's to declare — Amma decides that at review" },
    { k: "r", t: "About ninety seconds of talking, and a whole day is kept. It doesn't have to be more than that — anything else on your mind, or shall I put it together?" },
    { k: "a", t: "No, that's everything." },
    /* B6 — the weekly progression is SAID at the wrap, in Recall's voice,
       instead of sitting on Today as a permanent meter. Days, not
       check-ins: the copy says "tomorrow", never "check in again". */
    { k: "r", t: "And that's four days we've talked this week — tomorrow makes five, and Saturday I'll have a pattern to show you." },
    { k: "r", mood: "happy", t: "Then tap Done whenever you're ready. You'll see my read of the day, and you decide what's finished before anything becomes final." },
  ]},
  /* returning from the review — "oh, there's more" (or "fix that") */
  resume: { cover: 4, turns: [
    { k: "r", t: "We can keep going — tell me a fix, or what else today should remember." },
  ]},
  /* the say-it-again path — words are never retyped. The review's own
     button on a kept fact re-opens THE SAME talk, scoped to that fact;
     the replacement cap swaps the old wording out (`replaces`). */
  resayq: { cover: 4, turns: [
    { k: "r", t: "The water-pill question — say it again the way you meant it, or just tell me what I got wrong, and I'll fix what I kept." },
    { k: "a", t: "Ask Dr. Chen if the water pill should move to the morning — it wakes me at night." },
    { k: "think", t: "Replacing the kept question with your new words…" },
    { k: "note", t: "Replaced — kept in your new words; the old wording is let go",
      cap: { ...CAPS.question, t: "“Ask Dr. Chen — should the water pill move to the morning?”",
        replaces: CAPS.question.t } },
    { k: "r", mood: "happy", t: "Done — I kept your new wording and let the old one go. Anything else?" },
  ]},
  reopen: { cover: 6, turns: [
    { k: "r", t: "We finalized this morning — I've kept all of it. What's happened since?" },
    { k: "a", t: "My knee swelled up after dinner. That's not like this morning." },
    { k: "think", t: "Comparing with this morning's entry…" },
    { k: "r", t: "You're right — this morning it was only stiff. I'll add tonight's swelling as its own note, next to the morning one, with the time on it." },
    { k: "a", t: "Good. Sarah thinks I should mention it to Dr. Chen too." },
    { k: "note", t: "Question kept, in your words — routed after you finalize",
      cap: { icon: "question", t: "“Mention the evening knee swelling”", kind: "kept",
        fate: "kept for your visits — routed after you finalize", fateTone: "green", home: "brief" } },
    { k: "r", t: "Noted for the brief as well. Anything else from the afternoon?" },
    { k: "stage", t: "The morning entry stays finalized — tonight becomes a timestamped addendum" },
  ]},
  /* observer check-in — a caregiver talking ABOUT someone. No commitment
     bar (that's his record's shape, not hers); the scope chip keeps the
     room unmistakable. Filed as HER words, readable by him, never his journal */
  carenote: { cover: 0, scope: { name: "Thatha", chip: "About Thatha · a care note" }, turns: [
    { k: "r", t: "How was his day — anything stand out?" },
    { k: "a", t: "He ate better than yesterday. Finished his lunch, and we did the short walk after." },
    { k: "r", mood: "happy", t: "Appetite back and a walk in — that's a good day. Was his head clear this afternoon?" },
    { k: "a", t: "Mostly. He asked about the same letter twice, but he laughed about it." },
    { k: "stage", t: "Observer framing — logged as Amma's observation, marked 'From Amma', never blended into his entries" },
    { k: "think", t: "Writing this as your note…" },
    { k: "note", t: "Care note drafted — Thatha can always read it" },
    { k: "r", t: "I've kept that as your note: appetite better, the short walk, the letter question. He can read it any time. Anything else before I file it?" },
    { k: "a", t: "No — that's the day." },
  ]},
};

/* what the chat dictation flow appends after you tap ✓ — the Speak-app
   beat: hold to talk is too fiddly for elderly hands, so it's tap → talk
   → tap ✓, and the text appears as your bubble before Recall replies */
const DICTATION_TURNS = [
  { k: "a", t: "Oh — and I had a cup of tea with Sarah this afternoon. We sat outside for a bit." },
  { k: "stage", t: "Dictated, not typed — same pipeline. Nutrition · drinks ✓ Mood · lifted ✓ from one sentence" },
  { k: "r", mood: "happy", t: "Tea outside with Sarah — I've noted the drink, and it sounds like it lifted the afternoon. Anything else?" },
];

const CONFIRMS = {
  medconf: {
    title: "Save Atorvastatin 20 mg?",
    sub: "Names are easy to mishear — Recall never saves a medication from voice alone.",
    yes: "Save it", no: "I misspoke",
    yesMsg: "Saved to your cabinet — you can edit it any time ✓",
    noMsg: "Okay — nothing was saved.",
    cap: { icon: "meds", t: "Atorvastatin 20 mg · evenings", kind: "done",
      sub: "confirmed in the call — the name was checked with you",
      yes: "Keep it saved", no: "Not now", group: "Medication saved",
      doneLine: "Atorvastatin 20 mg — saved in the call", skipLine: "Atorvastatin — set aside, waits in Updates",
      fix: { type: "med", name: "Atorvastatin", dose: "20 mg", timing: "Evenings" }, fixDone: "saved",
      picture: "the new atorvastatin joins your evenings",
      home: "Meds" },
  },
  drname: {
    title: "Which doctor did you mean?",
    sub: "Recall checks names against your visit history before saving anything.",
    yes: "Dr. Osei", no: "Someone new",
    yesMsg: "Tuesday's visit filed under Dr. Osei — your history stays in one piece ✓",
    noMsg: "Got it — Recall will ask for the new doctor's details later.",
    /* she MENTIONED a past visit — "I saw Dr. O-shay about my eyes on
       Tuesday." The capture is that visit, filed into her history in
       her words; the in-call check only pinned WHO it was. Never call
       it a "link" — that's a database's verb, not a person's. */
    cap: { icon: "visits", t: "Tuesday's visit — Dr. Osei, about your eyes", kind: "done",
      sub: "“I saw him about my eyes on Tuesday” — filed in your visit history, in your words",
      yes: "Keep it", no: "Not now", group: "Past visit heard",
      doneLine: "Tuesday's eye visit — filed under Dr. Osei",
      skipLine: "Tuesday's visit — set aside, waits in Updates",
      fix: { type: "person", value: "Dr. Osei", options: [
        ["Dr. Osei", "Eyes — in your visit history"],
        ["Dr. Chen", "Cardiology — Thursday's brief is building"],
        ["Dr. Patel", "Family medicine — July 24 visit"],
      ]}, fixDone: "has Tuesday's eye visit",
      picture: "Tuesday's eye visit is filed under Dr. Osei",
      home: "Visit history" },
  },
};

/* the review gallery — every card variant at once, no conversation
   behind it. An internal bench shortcut (••• menu): testing a card
   shouldn't cost a whole talk. Same caps the everything moment yields,
   so what you verify here is exactly what the real flow produces. */
const REVIEW_GALLERY = [
  CONFIRMS.medconf.cap, CONFIRMS.drname.cap,
  CAPS.visit, CAPS.visit2, CAPS.topicprop, CAPS.question, CAPS.scan,
];

const PROC_LINES = [
  "Listening back to what you said…",
  "Filing each thing where it belongs…",
  "Comparing with earlier this week…",
];

const PROC_LINES_REOPEN = [
  "Reading tonight's note…",
  "Placing it next to this morning's entry…",
  "The morning entry stays untouched…",
];

const PROC_LINES_NOTE = [
  "Writing your note…",
  "Marking it as yours — 'From Amma'…",
  "Filing it in Thatha's record, where he can read it…",
];

const INSIGHT_STATE = {
  day1: { filled: 1, unlocked: 0 },
  week1: { filled: 4, unlocked: 0 },
  week2: { filled: 2, unlocked: 1, fresh: true },
  visitday: { filled: 3, unlocked: 1 },
  month1: { filled: 6, unlocked: 4, earned: true },
};

const INSIGHTS = [
  ["Week 4", "Knee pain eased on the new stretching routine."],
  ["Week 3", "Evening medication was easiest to remember after dinner."],
  ["Week 2", "Energy dipped on days with under 6 hours of sleep."],
  ["Week 1", "Sleep was steadier on days you walked in the morning."],
];

const JOURNAL_STATS = {
  day1: null,
  week1: "3 patterns spotted so far",
  week2: "7 patterns spotted · 4 questions carried into visits",
  visitday: "9 patterns spotted · 5 questions carried into visits",
  month1: "23 patterns spotted · 11 questions carried into visits",
};

const NEEDS = {
  day1: [], week2: [], visitday: [],
  week1: [{
    id: "ins", type: "family", icon: "docs",
    title: "Sarah asked for your insurance card",
    sub: "Scan it to Documents — it joins next week's brief.",
    evidence: "“Mom, the cardiologist's office needs your card on file before Thursday.”",
    evidenceSrc: "Sarah · this morning",
    effect: "Scanning it files the card in Documents and attaches it to Dr. Chen's brief automatically.",
    actions: ["Scan"],
  }],
  month1: [
    {
      id: "visit", type: "family", icon: "visits", sugId: "eye",
      title: "Sarah suggested a visit",
      sub: "Eye exam · Dr. Lam · September 3",
      evidence: "“Your eyes deserve a checkup before winter — Dr. Lam had a Sept 3 opening.”",
      evidenceSrc: "Sarah · yesterday",
      effect: "Approving adds the visit to your Visits tab. A brief starts building two weeks before. Nothing is booked without you.",
      actions: ["approve"], yesLabel: "Add to my Visits", noLabel: "Not this time",
      ansYes: "Amma added it — the eye exam is on her Visits for September 3.",
    },
    {
      id: "denise", type: "caregiver", icon: "meds", applied: true,
      title: "Denise moved Lisinopril to evenings",
      sub: "Yesterday · already applied — you can undo",
      evidence: "Changed yesterday at 4:12 PM from the caregiver app, after your pharmacist's advice.",
      evidenceSrc: "Denise · caregiver",
      effect: "Keeping it leaves Lisinopril at evenings. Undo returns it to mornings — no questions asked.",
      actions: ["undo"],
    },
    {
      id: "followup", type: "recall", icon: "visits",
      title: "Book a follow-up with Dr. Patel",
      sub: "He mentioned it in your July 24 visit",
      evidence: "“Let's see each other again in about three months to recheck that vitamin D.”",
      evidenceSrc: "Dr. Patel · July 24 visit transcript",
      effect: "Approving drafts an October visit for you to confirm — Recall never books on its own.",
      /* every decision button names its outcome — no generic "Approve"
         survives on a screen where the outcome is knowable */
      actions: ["approve"], yesLabel: "Draft it for October", noLabel: "Not yet",
    },
    /* the full grammar, one instance per cell — a request about
       something that EXISTS rides on the thing itself; a request about
       something NEW stands where it would live */
    {
      id: "oseimove", type: "family", icon: "visits", sugId: "osei",
      ansYes: "Amma moved it — Dr. Osei, August 28 at 10:30 AM.",
      title: "Sarah suggests moving Dr. Osei's visit",
      sub: "August 21 → August 28 · she can't drive you on the 21st",
      evidence: "“I have a work thing on the 21st — the 28th at the same time works, I already checked with the clinic.”",
      evidenceSrc: "Sarah · this morning",
      effect: "Approving moves the visit to August 28 · 10:30 AM and lets Sarah know. The brief simply keeps building — nothing is lost. Say no and it stays on the 21st.",
      actions: ["approve"], yesLabel: "Move it to August 28", noLabel: "Keep August 21",
    },
    {
      id: "metdose", type: "recall", icon: "meds",
      title: "Update Metformin to 850 mg?",
      sub: "Dr. Chen raised it from 500 mg at your July 31 visit",
      evidence: "“Let's take the metformin up to 850 in the morning — same routine, one stronger tablet.”",
      evidenceSrc: "Dr. Chen · July 31 visit transcript",
      effect: "Confirming updates your cabinet and Today's list to 850 mg, so reminders and briefs match what you actually take. Recall never changes your record on its own.",
      actions: ["approve"], yesLabel: "Update my record", noLabel: "Not yet",
    },
    {
      id: "aspirin", type: "recall", icon: "meds",
      title: "Add low-dose aspirin to your cabinet?",
      sub: "Heard at Dr. Chen's visit · 81 mg, mornings",
      evidence: "“I'd also like you on a low-dose aspirin each morning — the little 81-milligram one.”",
      evidenceSrc: "Dr. Chen · July 31 visit transcript",
      effect: "Saying yes adds Aspirin 81 mg to your cabinet and to Today's morning list. Nothing is tracked until you agree.",
      actions: ["approve"], yesLabel: "Add it", noLabel: "Not now",
    },
    /* the profile grows the only way anything grows here — heard at a
       visit, proposed, her yes. Recall-raised, so "Not yet" defers. */
    {
      id: "profile", type: "recall", icon: "heart",
      title: "Add type 2 diabetes to your profile?",
      sub: "Dr. Chen named it at your July 31 visit",
      evidence: "“With your sugar this steady, the stronger metformin tablet should hold you nicely.”",
      evidenceSrc: "Dr. Chen · July 31 visit transcript",
      effect: "Saying yes adds it to About your health, so check-ins and briefs account for it. It shows nowhere else — your circle never sees your profile.",
      actions: ["approve"], yesLabel: "Add it to my profile", noLabel: "Not yet",
    },
    {
      id: "intake", type: "family", icon: "docs", sugId: "intake",
      title: "Sarah asked for Dr. Osei's intake form",
      sub: "Sign & scan it before the August 21 visit",
      evidence: "“His office emailed the intake form — can you sign it and send it in before your visit?”",
      evidenceSrc: "Sarah · yesterday",
      effect: "Scanning files the form in Documents and attaches it to Dr. Osei's brief automatically.",
      actions: ["Scan"],
    },
  ],
};

const needById = (period, id) => NEEDS[period].find((n) => n.id === id);

/* --------------- the health profile — context, not content ---------- */
/* The facts that shape how Recall ASKS: a knee is a different question
   at 78 than at 40; Lisinopril makes a morning dizziness worth a daily
   eye. None of it was typed — the setup call was the form (heard, read
   back, kept), and it grows only the way everything grows here: a
   request, her yes. Facts prime questions and ride her briefs; they
   never write a word of the journal and the circle never sees them.
   Deliberately minimal — a fact earns its row by changing a question,
   nothing is collected for its own sake.
   The split is a safety line, not a preference: the basics are the few
   things a FIRST conversation can't be safe without (who she is, when
   she was born, sex, language, region, allergies — the wrong emergency
   number or a missed allergy can't wait to be "learned"). Everything
   else — conditions, history, baselines — arrives only as life names
   it: a doctor says it, or she does; Recall proposes; she decides.    */
const PROFILE_FACTS = {
  basics: [
    { id: "name", icon: "person", t: "You go by Amma · she/her", s: "How every hello begins",
      src: "You chose both at setup — never required, never asked why",
      works: "Your name opens every conversation, and your pronouns shape how Recall speaks of you to your circle. This row is respect, not medicine — the medical facts below stay separate.",
      keep: "Change either by saying so in any check-in — no reason needed." },
    { id: "born", icon: "person", t: "Born in 1948", s: "78 this year — Recall does the counting",
      src: "From your setup call — read back before it was kept",
      works: "Questions fit your age quietly. A knee at 78 is asked about as a companion, not an alarm.",
      keep: "Your year isn't removable — but if it's wrong, say so in any check-in and Recall will fix it with you." },
    { id: "sex", icon: "heart", t: "Female", s: "It changes how some symptoms are heard",
      src: "From your setup call — read back before it was kept",
      works: "Some things wear a different face in women — a struggling heart can whisper here where it shouts elsewhere. Recall listens with that in mind, and it rides your briefs the way any clinic chart carries it.",
      keep: "This is the medical fact only. How you're spoken of lives in the row above — yours to set, separately, any time." },
    { id: "lang", icon: "chat", t: "English & French", s: "Talks in English · summaries in both",
      src: "From your setup call — read back before it was kept",
      works: "Check-ins happen in the language you start in, and summaries arrive in both — you read in the one that rests you, Sarah reads in hers.",
      keep: "Switch mid-sentence and Recall follows — there's no setting to find first." },
    { id: "region", icon: "visits", t: "Québec — your health region", s: "It sets the numbers that matter",
      src: "From your setup call — read back before it was kept",
      works: "When something can't wait for a visit, Recall names the right door for where you live: 8‑1‑1 reaches an Info-Santé nurse any hour; 9‑1‑1 is for right now. The right numbers are different in the wrong province — so this is never guessed.",
      keep: "If you move, say so in any check-in — the numbers follow you." },
  ],
  ongoing: [
    { id: "knees", icon: "pattern", t: "Your knees — arthritis", s: "Long-standing, worse on stairs",
      src: "From your setup call — read back before it was kept",
      works: "Check-ins ask about change, never the fact of them — long-standing means your baseline is yours, not a red flag." },
    { id: "bp", icon: "heart", t: "Blood pressure", s: "Steady lately · one medication — Lisinopril",
      src: "From your setup call — read back before it was kept",
      works: "Recall keeps a quiet eye on what Lisinopril can bring — like a brief dizziness on standing — so you never have to connect it yourself." },
  ],
  diabetes: { id: "t2d", icon: "check", t: "Type 2 diabetes", s: "Steady — the Metformin is doing its job",
    src: "Dr. Chen · July 31 — added by you",
    works: "Check-ins can hear thirst, energy and appetite in context, and your briefs carry it so you never re-explain it in a waiting room." },
  allergies: [
    { id: "pen", icon: "docs", t: "Penicillin — allergic", s: "Rides every visit brief",
      src: "From your setup call — read back before it was kept",
      works: "It sits on every brief you take into a visit, so a new prescription never depends on anyone's memory in the room." },
  ],
};

/* ---------------- care spaces — one Recall, every role -------------- */
/* Full plan in care-spaces.md. Amma is an owner AND Thatha's caregiver;
   Sarah is family for Amma. Facts automate; words never do.            */

const DEVICE_NOTES = {
  amma: "Amma's phone — her own Recall. Thatha's room lives behind her avatar.",
  sarah: "Sarah's phone — no journal of her own, so her people are her home.",
};

/* news from rooms Amma helps in → the avatar DOT (never a number).
   Counts appear one level down, on the person's row in the circle sheet. */
const THATHA_NEWS = {
  day1: [],
  week1: [{ icon: "undo", t: "Thatha put Lisinopril back to mornings", s: "No action needed." }],
  week2: [{ icon: "docs", t: "Thatha shared a visit summary with you", s: "Dr. Patel · tap it under “Shared with you”" }],
  visitday: [],
  month1: [
    { icon: "undo", t: "Thatha put Lisinopril back to mornings", s: "No action needed." },
    { icon: "docs", t: "Thatha shared a visit summary with you", s: "Dr. Patel · under “Shared with you”" },
  ],
};

const THATHA = {
  doses: [
    { id: "t-lis", name: "Lisinopril 10 mg", when: "Morning · with breakfast" },
    { id: "t-met", name: "Metformin 500 mg", when: "Morning · with breakfast" },
  ],
  cabinet: [
    { id: "t-lis", name: "Lisinopril 10 mg", sub: "Mornings · added by you, June 2" },
    { id: "t-met", name: "Metformin 500 mg", sub: "With breakfast · from Dr. Osei's letter" },
  ],
  medHistory: [
    { when: "Jul 21", t: "Put back to mornings", s: "by Thatha" },
    { when: "Jul 20", t: "Moved to evenings", s: "by you · after the pharmacist's advice" },
    { when: "Jun 2", t: "Added", s: "by you · he kept it" },
  ],
  adherence: [1, 1, 1, 0.5, 1, 0, 0],
  visit: { title: "Dr. Moreau · Family medicine", date: "August 12 · 10:30 AM", place: "Clinique St-Denis",
    bring: "Health card · med list (printed)" },
  docs: [
    { id: "t-lab", title: "Lab letter — June bloodwork", sub: "Filed by you · July 18" },
    { id: "t-ins", title: "Insurance card", sub: "Filed by you · June 2" },
  ],
  notes: [
    { id: "n-tue", day: "Tuesday", sub: "Slept badly · confused in the afternoon", mark: true,
      body: "A rough night — he was up twice. In the afternoon he asked about the pension letter three times and got frustrated. Settled after tea on the balcony." },
    { id: "n-mon", day: "Monday", sub: "Good walk · took all doses", mark: false,
      body: "A good day. We did the long block without stopping, and he took both doses without me reminding him. Appetite fine." },
  ],
  activity: [
    ["Today", [
      { when: "8:05", t: "Lisinopril checked off", s: "by you" },
    ]],
    ["Yesterday", [
      { when: "4:12", t: "Lisinopril back to mornings", s: "by Thatha" },
      { when: "9:00", t: "Lisinopril moved to evenings", s: "by you" },
    ]],
    ["July 18", [
      { when: "2:30", t: "Lab letter filed to Documents", s: "by you" },
      { when: "11:15", t: "Visit summary shared with you", s: "by Thatha" },
    ]],
  ],
  sharedSummary: {
    title: "Visit summary · Dr. Patel", sub: "Shared by Thatha · July 18 · his choice, not a toggle",
    en: "Blood pressure is steady and the new morning routine is working. Dr. Patel wants the vitamin D rechecked in October and suggested keeping the daily walk. No medication changes.",
    fr: "La tension est stable et la nouvelle routine du matin fonctionne. Dr Patel veut revérifier la vitamine D en octobre et suggère de garder la marche quotidienne. Aucun changement de médicament.",
  },
};

/* member pages — the control center for one arrow. Toggles are FACTS
   only (schedules & lists, no voice in them). Words share each time.   */
const MEMBERS = {
  sarah: {
    id: "sarah", name: "Sarah", role: "Family", roleLine: "She can suggest. You decide.",
    color: "orange",
    facts: [
      { id: "visits", t: "Upcoming visits", on: true },
      { id: "refills", t: "Refill flags", on: false },
      { id: "meds", t: "Your meds list", on: false },
    ],
    since: "In your circle since July 21 — you said yes on your setup call.",
    foot: "Sarah never sees your journal or check-ins.",
  },
  denise: {
    id: "denise", name: "Denise", role: "Caregiver", roleLine: "She can add and fix things. You can undo anything.",
    color: "green",
    facts: [
      { id: "meds", t: "Meds list & schedule", on: true },
      { id: "adherence", t: "Dose check-offs", on: true },
      { id: "visits", t: "Visit logistics", on: true },
      { id: "refills", t: "Refill flags", on: true },
    ],
    factsNote: "The caregiver baseline — visible here, and yours to switch off.",
    since: "In your circle since July 21 — you introduced her on your setup call.",
    foot: "Denise never sees your journal or check-ins. Visit summaries reach her only when you share them.",
  },
};

/* what a member did LATELY is period-true — the same canon the rest of
   the app tells, at that period's today. A static list here claimed an
   eye-exam yes that month-1's Updates still shows waiting, and claimed
   week-old favors on day 1, when the circle was three hours old. */
const MEMBER_LATELY = {
  sarah: {
    day1: [{ icon: "check", good: true, t: "Helped you set Recall up", s: "This morning — the three of you on one call" }],
    week1: [{ icon: "docs", good: false, t: "Asked for the insurance card", s: "Asked today · it waits in your Documents" }],
    week2: [{ icon: "check", good: true, t: "Asked for the insurance card", s: "You added it — July 29" }],
    visitday: [{ icon: "check", good: true, t: "Asked for the insurance card", s: "You added it — July 29" }],
    month1: [
      { icon: "check", good: true, t: "Suggested a hearing check", s: "You said yes — on your Visits, August 20" },
      { icon: "docs", good: false, t: "Sent Dr. Osei's intake form", s: "Waiting in your Documents" },
    ],
  },
  denise: {
    day1: [{ icon: "person", good: true, t: "Joined your circle", s: "This morning — your Tuesday caregiver" }],
    week1: [{ icon: "docs", good: true, t: "Filed your pharmacy renewal", s: "July 24" }],
    week2: [{ icon: "docs", good: true, t: "Filed your pharmacy renewal", s: "July 24" }],
    visitday: [{ icon: "docs", good: true, t: "Filed your pharmacy renewal", s: "July 24" }],
    month1: [
      { icon: "meds", good: true, t: "Sorted your pills for the week", s: "Sunday, August 2 — you noted it that day" },
      { icon: "docs", good: true, t: "Filed your pharmacy renewal", s: "July 24" },
    ],
  },
};
const latelyFor = (id, period) => (MEMBER_LATELY[id] || {})[period] || [];

/* the care update — the family-facing sibling of the visit brief.
   An insight is DISCOVERED about you; an update is AUTHORED by you.    */
const CARE_UPDATE = {
  title: "July, in short", to: "Sarah", range: "July 21 – 31 · her first ten days",
  sections: [
    { id: "felt", t: "How the ten days felt", on: true,
      body: "A steady start. The stairs got easier by the second week, and the evening walks stuck — 8 of 10 evenings." },
    { id: "sleep", t: "Sleep, over the ten days", on: true,
      body: "Going to bed earlier helped — about an hour more sleep than the first nights.", bars: [40, 55, 70, 80] },
    { id: "chen", t: "The Chen visit, in plain words", on: true,
      body: "Dr. Chen is happy with the blood pressure trend. One medication moved to evenings. Next check-up in October." },
    { id: "mood", t: "Mood", on: false, out: "You said to skip it" },
  ],
  quotes: [
    "“I didn't stop halfway on the stairs this time.”",
    "“The evening walk is the best part of my day now.”",
  ],
};

/* Sarah's device — supporter-only shape: People page is home.
   These seeds MIRROR month-1 on Amma's phone, ask for ask: the Osei
   move and the eye exam are the very requests waiting in her Updates,
   the insurance card is the one she added July 29, the hearing test is
   the one on her Visits. Two phones, one truth. `where` teaches the
   sender how quietly the ask arrives; `ans` closes the loop in Amma's
   own terms — yes, or a warm no, never silence. */
const SARAH_SUGGESTIONS = [
  { id: "osei", t: "Move Dr. Osei to August 28", status: "wait", s: "Sent this morning",
    where: "Riding her Dr. Osei row as a small note — she'll see it next time she looks at Visits. Not a pop-up." },
  { id: "intake", t: "Dr. Osei's intake form", status: "wait", s: "Sent yesterday",
    where: "Waiting in her Documents under “Waiting on you” — scanning it attaches to Dr. Osei's brief." },
  { id: "eye", t: "Eye exam before winter", status: "wait", s: "Sent Tuesday",
    where: "Waiting in her Visits list as a pending plan, in date order — she opens it when she's ready." },
  { id: "card", t: "Insurance card scan", status: "yes", s: "Asked July 28",
    ans: "Amma added it — July 29, it's in her Documents." },
  { id: "org", t: "A pill organizer with alarms", status: "no", s: "Asked July 26",
    ans: "She said: “I like my own routine — but thank you.”" },
];

const SARAH_SHARED = [
  { id: "chen", icon: "docs", t: "Visit summary · Dr. Chen", s: "July 31 · in English", kind: "summary" },
  { id: "july", icon: "spark", t: "July, in short", s: "Her first ten days · a care update", kind: "update" },
];

const AMMA_SHARED_SUMMARY = {
  title: "Visit summary · Dr. Chen", sub: "Shared by Amma · July 31 · exactly what she checked, nothing else",
  en: "Dr. Chen is happy with the blood pressure trend — the readings have been steady for three weeks. One medication moved to evenings on the pharmacist's advice. Next check-up in October.",
  fr: "Dr Chen est satisfaite de la tendance de la tension — stable depuis trois semaines. Un médicament est passé au soir sur conseil du pharmacien. Prochain contrôle en octobre.",
};

const VISITS = {
  day1: [{
    id: "patel", title: "Dr. Patel · Annual physical", date: "July 24 · in 3 days",
    briefLine: "Brief just started", focus: null, patterns: [], questions: [], docs: [],
    note: "Your check-ins from here to July 24 will fill this brief. Recall assembles the readable version the day before.",
  }],
  week1: [{
    id: "chen", title: "Dr. Chen · Cardiology", date: "Friday, July 31 · in 3 days",
    briefLine: "Brief: 2 patterns · 1 question",
    focus: "Blood-pressure follow-up — and the morning dizziness",
    focusBy: "From Dr. Patel\u2019s referral — the dizziness joined from your check-ins",
    patterns: ["Knee pain follows walks over 30 minutes", "Sleep steadier on morning-walk days"],
    questions: ["Should the water pill move to mornings?"],
    docs: ["Missing: insurance card (Sarah's request)"],
    note: "Recall assembles the readable brief the day before your visit.",
  }],
  week2: [{
    id: "chen", title: "Dr. Chen · Cardiology", date: "Tomorrow · 10:15 AM",
    briefLine: "Brief ready ✓", ready: true,
    focus: "Blood-pressure follow-up — and the morning dizziness",
    focusBy: "From Dr. Patel\u2019s referral — the dizziness joined from your check-ins",
    patterns: ["Knee pain follows walks over 30 minutes", "Sleep steadier on morning-walk days", "Energy dips after nights under 6 hours"],
    questions: ["Should the water pill move to mornings?", "Is a knee brace worth trying?"],
    docs: ["Blood test results (July 25)", "Insurance card"],
  }],
  visitday: [],
  month1: [
    {
      id: "osei", title: "Dr. Osei · Family medicine", date: "August 21 · 8 days away",
      briefLine: "Brief: 1 pattern · building",
      focus: "Prescription renewals before fall",
      focusBy: "You said it in a check-in — August 6",
      patterns: ["Energy dips after short sleep"], questions: [], docs: ["Blood pressure log"],
      note: "Recall assembles the readable brief the day before your visit.",
    },
    {
      id: "lam", title: "Eye exam · Dr. Lam", date: "September 3 · 3 weeks away",
      briefLine: "Brief: starts building Aug 20", focus: null,
      patterns: [], questions: [], docs: [],
      note: "Briefs start collecting two weeks before a visit — nothing to do until then.",
    },
  ],
};

/* ============ adding an upcoming appointment (v12.3) =============== */
/* Progressive disclosure, three questions the user actually has:      */
/* WHO (specialty rides with the doctor — picking Dr. Chen never asks  */
/* "what specialty?"; only a brand-new name earns that question, in    */
/* plain words) · WHEN (or honestly "no date yet") · WHAT FOR          */
/* (optional — the brief's first line, never a required form field).   */

/* the doctors Recall already knows — from visits, briefs, referrals.
   Fixed identity tones like the medication system (theme-stable). */
const DOCTOR_BOOK = [
  { id: "chen", name: "Dr. Chen", spec: "Heart · Cardiology", tone: "#5AA9FF", from: "Your cardiologist · last visit July 31" },
  { id: "patel", name: "Dr. Patel", spec: "Family doctor", tone: "#63D08C", from: "Annual physicals · last visit July 24" },
  { id: "osei", name: "Dr. Osei", spec: "Family medicine", tone: "#B98AE8", from: "Seen August 21" },
  { id: "lam", name: "Dr. Lam", spec: "Eyes · Optometry", tone: "#4CC9DE", from: "Eye exams" },
];

/* the directory a real build would search (RAMQ / clinic registries);
   here, enough rows to make two typed letters feel like a search */
const DOCTOR_DIRECTORY = [
  { name: "Dr. Boucher", spec: "Skin · Dermatology", place: "Clinique St-Denis" },
  { name: "Dr. Bouchard", spec: "Family doctor", place: "CLSC Côte-des-Neiges" },
  { name: "Dr. Beaulieu", spec: "Bones & joints · Orthopedics", place: "Hôpital général" },
  { name: "Dr. Bianchi", spec: "Stomach · Gastroenterology", place: "Clinique Rosemont" },
  { name: "Dr. Singh", spec: "Ears, nose & throat", place: "Clinique Parc-Extension" },
  { name: "Dr. Sekhon", spec: "Kidneys · Nephrology", place: "Hôpital général" },
  { name: "Dr. Nguyen", spec: "Feet · Podiatry", place: "Clinique Villeray" },
  { name: "Dr. Tremblay", spec: "Heart · Cardiology", place: "Institut de cardiologie" },
  { name: "Dr. Trinh", spec: "Family doctor", place: "GMF Jarry" },
];

/* the specialty list — body part first, the trade name as the subtitle
   (plain words carry the choice; the medical word rides along and
   quietly teaches itself). A searchable list, not a chips grid: the
   real taxonomy runs long, and lists with icons scan; chip walls don't. */
const SPEC_LIST = [
  { l: "Family doctor", s: "General care", i: "person", spec: "Family doctor" },
  { l: "Walk-in clinic", s: "No fixed doctor", i: "visits", spec: "Walk-in clinic" },
  { l: "Heart", s: "Cardiology", i: "heart", spec: "Heart · Cardiology" },
  { l: "Skin", s: "Dermatology", i: "spark", spec: "Skin · Dermatology" },
  { l: "Eyes", s: "Optometry · Ophthalmology", i: "eye", spec: "Eyes · Optometry" },
  { l: "Teeth", s: "Dentist", i: "tooth", spec: "Teeth · Dentist" },
  { l: "Bones & joints", s: "Orthopedics", i: "joint", spec: "Bones & joints · Orthopedics" },
  { l: "Stomach & digestion", s: "Gastroenterology", i: "stomach", spec: "Stomach · Gastroenterology" },
  { l: "Ears, nose & throat", s: "ENT · Otolaryngology", i: "ear", spec: "Ears, nose & throat" },
  { l: "Lungs & breathing", s: "Respirology", i: "lungs", spec: "Lungs · Respirology" },
  { l: "Kidneys", s: "Nephrology", i: "droplet", spec: "Kidneys · Nephrology" },
  { l: "Mind & mood", s: "Psychiatry · Psychology", i: "chat", spec: "Mind & mood · Psychiatry" },
  { l: "Brain & nerves", s: "Neurology", i: "bulb", spec: "Brain & nerves · Neurology" },
];

/* reason starters — ROWS, not chips: these are sentences with
   receipts, and sentences scan in a list where a chip cloud goes
   ragged (Seyon caught the rag). Threads come from the record and say
   so — the provenance line is what makes them feel like Recall
   remembering instead of a generic form. They are starters, not the
   universe: saying it or typing it are peers, never fallbacks. */
const REASON_THREADS = [
  { t: "The morning dizziness", s: "In 4 check-ins this week" },
  { t: "Knee pain on walks", s: "Tracked since July — it's a pattern" },
  { t: "The tiredness after lunch", s: "You mentioned it Tuesday" },
];
const REASON_COMMON = [
  { t: "Routine check-up", icon: "visits" },
  { t: "Medication questions", icon: "meds" },
  { t: "Going over test results", icon: "flask" },
];
const VISIT_SAY_LINE = "A new ache in my left shoulder when I reach up — started last week.";

/* the demo calendar: anchored labels, no live clock (the prototype's
   world holds still) */
const UPV_DAYS = (() => {
  const out = ["Tomorrow · Aug 14"];
  const wd = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  let d = 15, m = "Aug", wi = 0;
  for (let i = 0; i < 45; i++) {
    out.push(`${wd[wi % 7]} · ${m} ${d}`);
    wi += 1; d += 1;
    if (m === "Aug" && d > 31) { d = 1; m = "Sep"; }
    else if (m === "Sep" && d > 30) { d = 1; m = "Oct"; }
  }
  return out;
})();
const UPV_TIMES = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
  "3:30 PM", "4:00 PM", "4:30 PM"];

const PAST_VISITS = {
  week2: [{ id: "patel-past", title: "Dr. Patel · Annual physical", sub: "July 24 · Recording, transcript & summary" }],
  visitday: [{ id: "patel-past", title: "Dr. Patel · Annual physical", sub: "July 24 · Recording, transcript & summary" }],
  month1: [
    { id: "chen-past", title: "Dr. Chen · Cardiology", sub: "July 31 · Recording & summary" },
    { id: "patel-past", title: "Dr. Patel · Annual physical", sub: "July 24 · Recording & summary" },
    { id: "pharm-past", title: "Pharmacy consultation", sub: "July 22 · Recording & summary" },
  ],
};

const PAST_VISIT_DETAIL = {
  summaryEn: "Dr. Patel says your overall health is steady. Blood pressure is good. Vitamin D came back low, so he started a daily supplement and wants to recheck it in about three months. He liked your walking routine and said to keep it up.",
  summaryFr: "Le Dr Patel trouve votre santé stable dans l'ensemble. La tension artérielle est bonne. La vitamine D est un peu basse : il a commencé un supplément quotidien et veut la recontrôler dans environ trois mois. Il aime votre routine de marche — continuez.",
  transcript: [
    ["Dr. Patel", "Blood pressure looks great, Amma. The walking is clearly working."],
    ["Amma", "I do the park loop most mornings, when the knee lets me."],
    ["Dr. Patel", "Your vitamin D is a bit low — I'll start you on 1000 units daily."],
    ["Dr. Patel", "Let's see each other again in about three months to recheck it."],
  ],
  suggestion: { title: "Book the 3-month follow-up", sub: "Dr. Patel asked to recheck vitamin D in October" },
};

/* ================================================================== */
/*  THE RECORDED VISIT — record → staged processing → a page you HEAR  */
/*                                                                     */
/*  The demo recording: Dr. Chen, cardiology, July 31 — 18:24. Every   */
/*  turn is word-timed for karaoke playback; medical terms are tagged  */
/*  in five kinds and every tag opens a plain-language card. FR is a   */
/*  full second rendering (Seyon's rule change: transcripts now        */
/*  translate too — the original stays one tap away as the receipt,   */
/*  because a translation of medical speech is an interpretation).     */
/* ================================================================== */

/* five kinds of medical thing, mapped onto the app's existing domain
   colors — meds are green everywhere, labs/tests already wear purple
   (DOC_META's flask), attention is orange, measurements teal like the
   BP log, and to-dos ride the brand blue of every other actionable */
const TERM_KINDS = {
  med:   { label: "Medication",  labelFr: "Médicament", bg: () => C.greenSoft,  ink: () => C.greenInk },
  cond:  { label: "Condition",   labelFr: "Condition",  bg: () => C.orangeSoft, ink: () => C.orangeInk },
  test:  { label: "Test",        labelFr: "Examen",     bg: () => C.purpleSoft, ink: () => C.purpleInk },
  vital: { label: "Measurement", labelFr: "Mesure",     bg: () => C.tealSoft,   ink: () => C.tealInk },
  act:   { label: "To do",       labelFr: "À faire",    bg: () => C.blueSoft,   ink: () => C.blue },
};
const TERM_KIND_ORDER = ["med", "cond", "test", "vital", "act"];

/* the visit script — turns and quiet stretches on one timeline.
   A turn: { w: "dr"|"you", at: seconds, en: parts, fr: parts } where
   parts mix plain strings with [text, kind, glossaryId] tuples.
   A quiet stretch: { gap: 1, at, until, en, fr } — real transcription
   marks its silences (the cuff, the stethoscope); pretending the talk
   was wall-to-wall would make playback feel broken exactly there. */
const CHEN_SCRIPT = [
  { w: "dr", at: 0,
    en: ["Come in, come in — good to see you, Amma. Sit down. Was the waiting long?"],
    fr: ["Entrez, entrez — ça me fait plaisir de vous voir, Amma. Assoyez-vous. L'attente a été longue ?"] },
  { w: "you", at: 10,
    en: ["Not long. Sarah dropped me off — she's finding parking."],
    fr: ["Pas longue. Sarah m'a déposée — elle cherche du stationnement."] },
  { w: "dr", at: 19,
    en: ["Good. So — eight weeks since April. How have you been feeling, honestly?"],
    fr: ["Bien. Alors — huit semaines depuis avril. Comment vous sentez-vous, honnêtement ?"] },
  { w: "you", at: 33,
    en: ["Mostly fine. But some mornings I feel ", ["dizzy", "cond", "dizzy"], " when I stand up from the bed. Twice last week."],
    fr: ["Bien, la plupart du temps. Mais certains matins, j'ai des ", ["étourdissements", "cond", "dizzy"], " quand je me lève du lit. Deux fois la semaine passée."] },
  { w: "dr", at: 49,
    en: ["Tell me more. Does the room spin, or is it more like the lights dim for a moment?"],
    fr: ["Dites-m'en plus. Est-ce que la pièce tourne, ou c'est plutôt comme si la lumière baissait un instant ?"] },
  { w: "you", at: 63,
    en: ["Like the lights dim. A few seconds, then it passes once I sit back down."],
    fr: ["Comme si la lumière baissait. Quelques secondes, puis ça passe quand je me rassois."] },
  { w: "dr", at: 76,
    en: ["That sounds like ", ["orthostatic hypotension", "cond", "ortho"], " — a quick dip in ", ["blood pressure", "vital", "bp"], " when you stand. Very common, very manageable. Any falls?"],
    fr: ["Ça ressemble à de l'", ["hypotension orthostatique", "cond", "ortho"], " — une petite chute de ", ["tension artérielle", "vital", "bp"], " quand on se lève. Très fréquent, très gérable. Des chutes ?"] },
  { w: "you", at: 95,
    en: ["No falls. I hold the dresser, like Sarah tells me to."],
    fr: ["Aucune chute. Je me tiens à la commode, comme Sarah me le dit."] },
  { w: "dr", at: 105,
    en: ["Smart. Let's take your pressure now — arm relaxed, feet flat. There we go."],
    fr: ["Sage. On prend votre tension maintenant — le bras détendu, les pieds à plat. Voilà."] },
  { gap: 1, at: 116, until: 190, en: "Blood-pressure cuff — a quiet minute", fr: "Brassard de tension — une minute de silence" },
  { w: "dr", at: 190,
    en: [["132 over 84", "vital", "bpread"], ". Better than April — the ", ["Lisinopril", "med", "lisinopril"], " is doing its job."],
    fr: [["132 sur 84", "vital", "bpread"], ". Mieux qu'en avril — le ", ["Lisinopril", "med", "lisinopril"], " fait son travail."] },
  { w: "you", at: 204,
    en: ["That's the pressure pill? The small white one, in the morning?"],
    fr: ["C'est la pilule pour la tension ? La petite blanche, le matin ?"] },
  { w: "dr", at: 212,
    en: ["That's the one — ", ["Lisinopril 10 mg", "med", "lisinopril"], ". Keep it exactly as it is. Did you bring your home readings?"],
    fr: ["Exactement — ", ["Lisinopril 10 mg", "med", "lisinopril"], ". On ne change rien. Vous avez apporté vos mesures de la maison ?"] },
  { w: "you", at: 231,
    en: ["Denise printed the log. Here — most days, after breakfast."],
    fr: ["Denise a imprimé le journal. Tenez — presque tous les jours, après le déjeuner."] },
  { w: "dr", at: 247,
    en: ["This is excellent, Amma. Most readings near ", ["128 over 78", "vital", "bpread"], ". Whatever you're doing — it's working."],
    fr: ["C'est excellent, Amma. La plupart des mesures autour de ", ["128 sur 78", "vital", "bpread"], ". Ce que vous faites, ça fonctionne."] },
  { w: "you", at: 264,
    en: ["The morning walks, when the knee allows it."],
    fr: ["Les marches du matin, quand le genou le permet."] },
  { w: "dr", at: 273,
    en: ["Keep the walks. Now — breathe normally, I'll listen to your heart. Deep breath… and again."],
    fr: ["Continuez les marches. Maintenant — respirez normalement, j'écoute votre cœur. Grande respiration… encore."] },
  { gap: 1, at: 288, until: 378, en: "Stethoscope — listening to your heart", fr: "Stéthoscope — écoute du cœur" },
  { w: "dr", at: 378,
    en: ["Heart sounds steady. No new ", ["murmur", "cond", "murmur"], " — nothing I don't like."],
    fr: ["Le cœur est régulier. Pas de nouveau ", ["souffle", "cond", "murmur"], " — rien qui m'inquiète."] },
  { w: "you", at: 391,
    en: ["That's a relief. My sister had the valve problem — you remember."],
    fr: ["Ça me soulage. Ma sœur avait le problème de valve — vous vous souvenez."] },
  { w: "dr", at: 403,
    en: ["I remember. That's partly why I want one more look — we'll get there. First, your sugar: last week's ", ["A1C", "test", "a1c"], " came back at ", ["7.9", "vital", "a1c"], "."],
    fr: ["Je me souviens. C'est en partie pour ça que je veux un examen de plus — on y arrive. D'abord, votre sucre : l'", ["A1C", "test", "a1c"], " de la semaine passée est à ", ["7,9", "vital", "a1c"], "."] },
  { w: "you", at: 428,
    en: ["Is that bad?"],
    fr: ["C'est mauvais ?"] },
  { w: "dr", at: 433,
    en: ["It's higher than I'd like. ", ["A1C", "test", "a1c"], " is your three-month average of ", ["blood sugar", "vital", "sugar"], " — a report card, not one day. For you, I want 7 or a little under."],
    fr: ["C'est plus haut que je voudrais. L'", ["A1C", "test", "a1c"], ", c'est la moyenne de votre ", ["glycémie", "vital", "sugar"], " sur trois mois — un bulletin, pas une seule journée. Pour vous, je vise 7 ou un peu moins."] },
  { w: "you", at: 459,
    en: ["It was 7.4 before, no?"],
    fr: ["C'était 7,4 avant, non ?"] },
  { w: "dr", at: 466,
    en: ["It was — it has drifted. So today we adjust your ", ["Metformin", "med", "metformin"], ". You take ", ["500 mg", "med", "metformin"], " twice a day now, yes?"],
    fr: ["Oui — ça a glissé. Alors aujourd'hui, on ajuste votre ", ["Metformine", "med", "metformin"], ". Vous prenez ", ["500 mg", "med", "metformin"], " deux fois par jour, c'est ça ?"] },
  { w: "you", at: 487,
    en: ["Morning and supper, with the first bite. Denise sets the box."],
    fr: ["Matin et souper, avec la première bouchée. Denise prépare le pilulier."] },
  { w: "dr", at: 498,
    en: ["Perfect. We move to ", ["850 mg", "med", "metformin"], " — same rhythm, morning and supper, always ", ["with food", "act", "withfood"], ". The pharmacy swaps the strength; the old tablets go back so the box never mixes."],
    fr: ["Parfait. On passe à ", ["850 mg", "med", "metformin"], " — même rythme, matin et souper, toujours ", ["avec de la nourriture", "act", "withfood"], ". La pharmacie change la dose ; les anciens comprimés retournent, pour que le pilulier ne mélange jamais."] },
  { w: "you", at: 528,
    en: ["Same times, bigger tablet. And if my stomach complains?"],
    fr: ["Mêmes heures, comprimé plus gros. Et si mon estomac se plaint ?"] },
  { w: "dr", at: 538,
    en: ["Good question. ", ["Metformin", "med", "metformin"], " can bother the stomach the first week — food usually settles it. If it hasn't settled after a week, call the office. Don't just stop it on your own."],
    fr: ["Bonne question. La ", ["Metformine", "med", "metformin"], " peut déranger l'estomac la première semaine — la nourriture arrange ça, d'habitude. Si ça ne passe pas après une semaine, appelez le bureau. Ne l'arrêtez pas toute seule."] },
  { w: "you", at: 566,
    en: ["Understood. I'll tell Denise about the box."],
    fr: ["Compris. Je vais avertir Denise pour le pilulier."] },
  { gap: 1, at: 576, until: 640, en: "Dr. Chen types into your chart", fr: "Dr Chen écrit dans votre dossier" },
  { w: "dr", at: 640,
    en: ["One more change. With your pressure history and the ", ["Type 2 diabetes", "cond", "t2d"], " together, I want you on a baby ", ["aspirin", "med", "aspirin"], " — ", ["81 mg", "med", "aspirin"], ", once each morning."],
    fr: ["Un autre changement. Avec votre historique de tension et le ", ["diabète de type 2", "cond", "t2d"], " ensemble, je veux vous mettre sur une petite ", ["aspirine", "med", "aspirin"], " — ", ["81 mg", "med", "aspirin"], ", une chaque matin."] },
  { w: "you", at: 664,
    en: ["The tiny orange one? My neighbour takes it."],
    fr: ["La petite orange ? Ma voisine la prend."] },
  { w: "dr", at: 672,
    en: ["That's the one. It thins the blood slightly — it lowers the chance of a clot. One at breakfast. If you ever notice ", ["easy bruising", "cond", "aspwatch"], " or ", ["dark stools", "cond", "aspwatch"], ", you call me — that's the one thing to watch."],
    fr: ["Celle-là. Elle éclaircit un peu le sang — ça réduit le risque de caillot. Une au déjeuner. Si vous remarquez des ", ["bleus faciles", "cond", "aspwatch"], " ou des ", ["selles foncées", "cond", "aspwatch"], ", vous m'appelez — c'est la seule chose à surveiller."] },
  { w: "you", at: 703,
    en: ["Aspirin every morning. I'll write it down — no, Recall is writing it."],
    fr: ["Aspirine chaque matin. Je vais le noter — non, Recall est en train de le noter."] },
  { w: "dr", at: 713,
    en: ["Ha — good. Now, that extra look at your heart: I'm ordering an ", ["echocardiogram", "test", "echo"], " — an ultrasound of the heart. Painless, about thirty minutes. With the family valve history and the dizziness, I want a clear picture."],
    fr: ["Ha — parfait. Maintenant, ce regard de plus sur votre cœur : je demande une ", ["échocardiographie", "test", "echo"], " — une échographie du cœur. Sans douleur, environ trente minutes. Avec l'histoire de valve dans la famille et les étourdissements, je veux une image claire."] },
  { w: "you", at: 745,
    en: ["The jelly-on-the-chest one? I had it years ago."],
    fr: ["Celle avec le gel sur la poitrine ? Je l'ai eue il y a des années."] },
  { w: "dr", at: 753,
    en: ["Exactly that one. The hospital calls you with a date — usually two to three weeks. Nothing to prepare; eat normally that day."],
    fr: ["Exactement celle-là. L'hôpital vous appelle avec une date — deux à trois semaines, d'habitude. Rien à préparer ; mangez normalement ce jour-là."] },
  { w: "you", at: 775,
    en: ["Okay. And the dizziness — is it the pills?"],
    fr: ["D'accord. Et les étourdissements — c'est les pilules ?"] },
  { w: "dr", at: 784,
    en: ["Maybe a small part. More likely the pressure dipping when you stand. So: ", ["stand up slowly", "act", "standslow"], " — sit at the edge of the bed, count to five, then up. And drink water through the morning, not only tea."],
    fr: ["Peut-être un peu. Plus probablement la tension qui baisse quand vous vous levez. Donc : ", ["levez-vous lentement", "act", "standslow"], " — assise au bord du lit, comptez jusqu'à cinq, puis debout. Et buvez de l'eau durant la matinée, pas seulement du thé."] },
  { w: "you", at: 812,
    en: ["Sit, count five, then stand. Water, not only tea."],
    fr: ["Assise, compter cinq, puis debout. De l'eau, pas seulement du thé."] },
  { w: "dr", at: 821,
    en: ["You're my easiest patient. One more thing — ", ["salt", "act", "salt"], ". The soup packets, the pickles: keep them small. Salt pulls pressure up, and your good numbers can hold without it."],
    fr: ["Vous êtes ma patiente la plus facile. Une dernière chose — le ", ["sel", "act", "salt"], ". Les sachets de soupe, les marinades : gardez-les petits. Le sel fait monter la tension, et vos bons chiffres peuvent tenir sans lui."] },
  { w: "you", at: 846,
    en: ["Sarah already hides the pickle jar."],
    fr: ["Sarah cache déjà le pot de marinades."] },
  { w: "dr", at: 854,
    en: ["Then Sarah and I agree. Before you leave, the lab downstairs will do a quick ", ["blood test", "test", "bloodtest"], " — no appointment needed. And I want to see you in ", ["October", "act", "octfu"], ": we recheck the ", ["A1C", "test", "a1c"], " and go over the ", ["echocardiogram", "test", "echo"], " together."],
    fr: ["Alors Sarah et moi sommes d'accord. Avant de partir, le laboratoire en bas fera une petite ", ["prise de sang", "test", "bloodtest"], " — sans rendez-vous. Et je veux vous revoir en ", ["octobre", "act", "octfu"], " : on revérifie l'", ["A1C", "test", "a1c"], " et on regarde l'", ["échocardiographie", "test", "echo"], " ensemble."] },
  { gap: 1, at: 886, until: 920, en: "Printing the lab slip", fr: "Impression du bon de laboratoire" },
  { w: "you", at: 920,
    en: ["October. Sarah books it at the desk?"],
    fr: ["Octobre. Sarah prend le rendez-vous au comptoir ?"] },
  { w: "dr", at: 929,
    en: ["At the desk, on your way out. Any other questions for me? Anything at all."],
    fr: ["Au comptoir, en sortant. D'autres questions pour moi ? N'importe quoi."] },
  { w: "you", at: 944,
    en: ["Only to say it back: the new tablet with food, morning and supper. Aspirin at breakfast. Stand up slowly. Did I get it all?"],
    fr: ["Juste pour le redire : le nouveau comprimé avec de la nourriture, matin et souper. L'aspirine au déjeuner. Me lever lentement. J'ai tout ?"] },
  { w: "dr", at: 963,
    en: ["Every word. And your phone got it too — listen back tonight, and call if anything feels unclear. Say hello to Sarah for me."],
    fr: ["Chaque mot. Et votre téléphone l'a aussi — réécoutez ce soir, et appelez si quelque chose n'est pas clair. Saluez Sarah pour moi."] },
  { w: "you", at: 1005,
    en: ["Thank you, Dr. Chen. See you in October."],
    fr: ["Merci, Dr Chen. À octobre."] },
  { gap: 1, at: 1015, until: 1104, en: "Goodbyes on the way out", fr: "Salutations en sortant" },
];

const CHEN_DUR = 1104; /* 18:24 */
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* every tagged term opens one of these — plain words first, the visit's
   own line second, and a door OUT to a source that isn't us. Receipts
   for the explanation itself. */
const GLOSSARY = {
  dizzy: { k: "cond", t: "Dizziness on standing", tFr: "Étourdissements au lever", at: 33, q: "dizziness",
    what: "A brief light-headed moment when you rise — the world dims or sways for a few seconds while blood pressure catches up with the move.",
    whatFr: "Un bref moment de tête légère au lever — tout baisse ou tangue quelques secondes, le temps que la tension rattrape le mouvement.",
    here: "Twice last week, getting up from bed. Dr. Chen ties it to a pressure dip on standing — and gave a fix (sit, count five, then up).",
    hereFr: "Deux fois la semaine passée, en vous levant du lit. Dr Chen y voit une baisse de tension au lever — avec un remède (assise, compter cinq, puis debout)." },
  ortho: { k: "cond", t: "Orthostatic hypotension", tFr: "Hypotension orthostatique", at: 76, q: "orthostatic hypotension",
    what: "A quick drop in blood pressure when you stand. Heart and vessels need a beat to catch up with gravity — until they do, you feel faint or dim.",
    whatFr: "Une chute rapide de tension quand on se lève. Le cœur et les vaisseaux prennent un instant à rattraper la gravité — d'ici là, on se sent faible.",
    here: "Dr. Chen's name for your morning dizziness. Not alarming on its own — the standing-slowly routine and morning water are the treatment.",
    hereFr: "Le nom que Dr Chen donne à vos étourdissements du matin. Rien d'alarmant en soi — se lever lentement et boire de l'eau le matin, c'est le traitement." },
  bp: { k: "vital", t: "Blood pressure", tFr: "Tension artérielle", at: 190, q: "blood pressure",
    what: "The push of blood against your artery walls, written as two numbers — while the heart beats (top) and while it rests between beats (bottom).",
    whatFr: "La poussée du sang contre les parois des artères, écrite en deux chiffres — pendant le battement (haut) et entre les battements (bas).",
    here: "Yours today: 132 over 84 — better than April. Dr. Chen credits the Lisinopril, the walks, and your steady home routine.",
    hereFr: "La vôtre aujourd'hui : 132 sur 84 — mieux qu'en avril. Dr Chen salue le Lisinopril, les marches et votre routine régulière." },
  bpread: { k: "vital", t: "132 over 84 — the numbers", tFr: "132 sur 84 — les chiffres", at: 190, q: "blood pressure reading",
    what: "Top number: pressure while the heart squeezes. Bottom: while it rests. For most adults the goal zone sits under about 130 over 80.",
    whatFr: "Chiffre du haut : la pression quand le cœur se contracte. Du bas : quand il se repose. Pour la plupart des adultes, la cible est sous environ 130 sur 80.",
    here: "Today's office reading — and your home log runs near 128 over 78, which Dr. Chen called excellent.",
    hereFr: "La mesure d'aujourd'hui au bureau — et votre journal à la maison tourne autour de 128 sur 78, que Dr Chen a trouvé excellent." },
  lisinopril: { k: "med", t: "Lisinopril 10 mg", tFr: "Lisinopril 10 mg", at: 190, q: "lisinopril",
    what: "A daily tablet that relaxes blood vessels so pressure comes down — one of the most common blood-pressure medicines.",
    whatFr: "Un comprimé quotidien qui détend les vaisseaux pour faire baisser la tension — un des médicaments les plus courants pour la tension.",
    here: "Your small white morning pill. Nothing changes today — Dr. Chen said to keep it exactly as it is.",
    hereFr: "Votre petite pilule blanche du matin. Rien ne change aujourd'hui — Dr Chen a dit de la garder exactement telle quelle." },
  murmur: { k: "cond", t: "Heart murmur", tFr: "Souffle au cœur", at: 378, q: "heart murmur",
    what: "An extra whooshing sound between heartbeats. Many are harmless; some point to a valve worth watching — which is why doctors listen for them.",
    whatFr: "Un bruit de souffle entre les battements. Beaucoup sont sans danger ; certains signalent une valve à surveiller — d'où l'écoute attentive.",
    here: "None heard today. With your sister's valve history, this is also part of why the echocardiogram is being booked — a clear picture, not a worry.",
    hereFr: "Aucun entendu aujourd'hui. Avec l'histoire de valve de votre sœur, c'est aussi pourquoi l'échocardiographie est demandée — une image claire, pas une inquiétude." },
  a1c: { k: "test", t: "A1C — yours is 7.9", tFr: "A1C — le vôtre est à 7,9", at: 403, q: "hemoglobin A1C",
    what: "A blood test showing your average blood sugar over about three months — a report card, not a single day.",
    whatFr: "Une analyse de sang qui montre la moyenne de votre glycémie sur environ trois mois — un bulletin, pas une seule journée.",
    here: "7.9, up from 7.4. Dr. Chen wants 7 or a little under — today's Metformin change is how you get there. Rechecked before October.",
    hereFr: "7,9, contre 7,4 avant. Dr Chen vise 7 ou un peu moins — le changement de Metformine d'aujourd'hui sert à ça. Revérifié avant octobre." },
  sugar: { k: "vital", t: "Blood sugar", tFr: "Glycémie", at: 433, q: "blood sugar",
    what: "The glucose your body runs on. With Type 2 diabetes it runs high, and medicines plus food rhythm bring it back into range.",
    whatFr: "Le glucose qui fait fonctionner le corps. Avec le diabète de type 2, il monte trop, et les médicaments plus le rythme des repas le ramènent dans la cible.",
    here: "The A1C tracks its three-month average — today's dose change is aimed straight at it.",
    hereFr: "L'A1C suit sa moyenne sur trois mois — le changement de dose d'aujourd'hui la vise directement." },
  metformin: { k: "med", t: "Metformin 500 → 850 mg", tFr: "Metformine 500 → 850 mg", at: 466, q: "metformin",
    what: "The most common first medicine for Type 2 diabetes — it helps your body use its own insulin and keeps sugar down between meals.",
    whatFr: "Le premier médicament le plus courant pour le diabète de type 2 — il aide le corps à utiliser sa propre insuline et garde le sucre bas entre les repas.",
    here: "Dose goes from 500 to 850 mg today — morning and supper, always with food. Old tablets return to the pharmacy so the box never mixes. A grumbling stomach in week one usually settles; if not, call — don't stop on your own.",
    hereFr: "La dose passe de 500 à 850 mg aujourd'hui — matin et souper, toujours avec de la nourriture. Les anciens comprimés retournent à la pharmacie pour que le pilulier ne mélange jamais. Un estomac dérangé la première semaine se calme d'habitude ; sinon, appelez — n'arrêtez pas seule." },
  withfood: { k: "act", t: "With food — why", tFr: "Avec de la nourriture — pourquoi", at: 498, q: "metformin with food",
    what: "Some medicines land softer on a full stomach. For Metformin, eating first is what keeps the early weeks comfortable.",
    whatFr: "Certains médicaments passent mieux l'estomac plein. Pour la Metformine, manger d'abord rend les premières semaines confortables.",
    here: "“With the first bite” — the rhythm Denise already sets in your pill box.",
    hereFr: "« Avec la première bouchée » — le rythme que Denise règle déjà dans votre pilulier." },
  aspirin: { k: "med", t: "Aspirin 81 mg", tFr: "Aspirine 81 mg", at: 640, q: "low dose aspirin",
    what: "A low daily dose that thins the blood slightly, lowering the chance of a clot — at this size it's heart protection, not a painkiller.",
    whatFr: "Une petite dose quotidienne qui éclaircit légèrement le sang et réduit le risque de caillot — à cette taille, c'est une protection du cœur, pas un antidouleur.",
    here: "New from today: one at breakfast, every morning. The one thing to watch: easy bruising or dark stools — if you see either, call.",
    hereFr: "Nouveau depuis aujourd'hui : une au déjeuner, chaque matin. La seule chose à surveiller : bleus faciles ou selles foncées — si vous en voyez, appelez." },
  aspwatch: { k: "cond", t: "Bruising & dark stools", tFr: "Bleus et selles foncées", at: 672, q: "aspirin side effects",
    what: "Blood-thinning medicines can occasionally cause bleeding — bruises that come easily, or stools that turn dark. Rare at 81 mg, but worth knowing by name.",
    whatFr: "Les médicaments qui éclaircissent le sang peuvent parfois causer des saignements — des bleus faciles, ou des selles qui deviennent foncées. Rare à 81 mg, mais bon à connaître.",
    here: "Dr. Chen's one thing to watch with the new aspirin. If either shows up: call the office right away — don't wait for October.",
    hereFr: "La seule chose que Dr Chen surveille avec la nouvelle aspirine. Si l'un des deux apparaît : appelez le bureau tout de suite — n'attendez pas octobre." },
  t2d: { k: "cond", t: "Type 2 diabetes", tFr: "Diabète de type 2", at: 640, q: "type 2 diabetes",
    what: "A condition where the body resists its own insulin, so blood sugar runs high. Managed with food rhythm, movement, and medicines like Metformin.",
    whatFr: "Une condition où le corps résiste à sa propre insuline, alors la glycémie reste haute. Géré par le rythme des repas, le mouvement et des médicaments comme la Metformine.",
    here: "Why the A1C is watched, why today's dose changed — and, together with the pressure history, why the aspirin was added.",
    hereFr: "Pourquoi l'A1C est suivi, pourquoi la dose a changé aujourd'hui — et, avec l'historique de tension, pourquoi l'aspirine s'est ajoutée." },
  echo: { k: "test", t: "Echocardiogram", tFr: "Échocardiographie", at: 713, q: "echocardiogram",
    what: "An ultrasound movie of the heart — sound waves, a wand, some gel on the chest. Painless, about thirty minutes, no needles.",
    whatFr: "Un film du cœur par ultrasons — des ondes sonores, une sonde, un peu de gel sur la poitrine. Sans douleur, environ trente minutes, sans aiguilles.",
    here: "Ordered for the family valve history plus the dizziness — a clear picture, in Dr. Chen's words. The hospital calls with a date in 2–3 weeks; eat normally, nothing to prepare.",
    hereFr: "Demandée pour l'histoire de valve dans la famille et les étourdissements — une image claire, selon Dr Chen. L'hôpital appelle avec une date d'ici 2–3 semaines ; mangez normalement, rien à préparer." },
  standslow: { k: "act", t: "Standing up slowly", tFr: "Se lever lentement", at: 784, q: "orthostatic hypotension prevention",
    what: "Giving your blood pressure the seconds it needs: sit at the edge, count to five, then rise. Water through the morning helps it along.",
    whatFr: "Donner à la tension les secondes qu'il lui faut : assise au bord, compter jusqu'à cinq, puis debout. De l'eau durant la matinée aide aussi.",
    here: "Dr. Chen's fix for the dim-lights mornings. Sit, count five, up — and water, not only tea.",
    hereFr: "Le remède de Dr Chen pour les matins où la lumière baisse. Assise, compter cinq, debout — et de l'eau, pas seulement du thé." },
  salt: { k: "act", t: "Salt & pressure", tFr: "Le sel et la tension", at: 821, q: "sodium blood pressure",
    what: "Salt holds water in the blood, which pushes pressure up. Packaged soups and pickles carry the most of it.",
    whatFr: "Le sel retient l'eau dans le sang, ce qui fait monter la tension. Les soupes en sachet et les marinades en portent le plus.",
    here: "Keep them small, said Dr. Chen — your good numbers can hold without them. Sarah, reportedly, is already on it.",
    hereFr: "Gardez-les petits, a dit Dr Chen — vos bons chiffres peuvent tenir sans eux. Sarah, paraît-il, s'en occupe déjà." },
  bloodtest: { k: "test", t: "Blood test — today", tFr: "Prise de sang — aujourd'hui", at: 854, q: "blood test",
    what: "A small sample from the arm, checked in the lab — this one covers sugar and general chemistry before the visit closes out.",
    whatFr: "Un petit prélèvement au bras, analysé au laboratoire — celui-ci couvre le sucre et la chimie générale avant de clore la visite.",
    here: "Downstairs, before you leave, no appointment — the slip is printed.",
    hereFr: "En bas, avant de partir, sans rendez-vous — le bon est imprimé." },
  octfu: { k: "act", t: "October follow-up", tFr: "Suivi en octobre", at: 854, q: "medical follow-up visit",
    what: "The next appointment — where the A1C gets rechecked and the echocardiogram is reviewed together.",
    whatFr: "Le prochain rendez-vous — où l'A1C est revérifié et l'échocardiographie regardée ensemble.",
    here: "Booked at the desk on your way out. Recall starts building the visit brief two weeks before.",
    hereFr: "Réservé au comptoir en sortant. Recall commence le résumé de visite deux semaines avant." },
};

/* the summary — every line carries the moment it came from. A claim
   you can HEAR is a claim you can trust; a summary without receipts
   is just another person talking. */
const CHEN_SUMMARY = {
  en: {
    short: "A good visit. Your blood pressure is where Dr. Chen wants it — the home log clearly landed well. The three-month sugar (A1C) has drifted to 7.9, so Metformin goes up to 850 mg today. A small daily aspirin was added to protect the heart, and a painless heart ultrasound is being booked for the morning dizziness and the family valve history. Back in October.",
    groups: [
      { h: "Your medicines", k: "med", rows: [
        { t: [["Metformin 500 → 850 mg", "med", "metformin"], " — same times, always ", ["with food", "act", "withfood"]], at: 498 },
        { t: ["New: ", ["aspirin 81 mg", "med", "aspirin"], ", one each morning at breakfast"], at: 640 },
        { t: [["Lisinopril 10 mg", "med", "lisinopril"], " stays exactly as it is"], at: 212 },
      ]},
      { h: "Tests", k: "test", rows: [
        { t: [["Blood test", "test", "bloodtest"], " downstairs before leaving — slip printed"], at: 854 },
        { t: [["Echocardiogram", "test", "echo"], " — the hospital calls with a date (2–3 weeks)"], at: 713 },
        { t: [["A1C", "test", "a1c"], " rechecked before October"], at: 854 },
      ]},
      { h: "What Dr. Chen asked you to do", k: "act", rows: [
        { t: [["Stand up slowly", "act", "standslow"], " — sit, count to five, then up"], at: 784 },
        { t: ["Water through the morning, not only tea"], at: 784 },
        { t: ["Keep ", ["salt", "act", "salt"], " small — soup packets, pickles"], at: 821 },
        { t: ["Keep the morning walks"], at: 264 },
      ]},
      { h: "Watch for", k: "cond", rows: [
        { t: ["Stomach upset in week one usually settles — if not, call the office"], at: 538 },
        { t: [["Easy bruising or dark stools", "cond", "aspwatch"], " on aspirin: call right away"], at: 672 },
      ]},
      { h: "Next", k: "act", rows: [
        { t: ["See Dr. Chen in ", ["October", "act", "octfu"], " — recheck the ", ["A1C", "test", "a1c"], ", review the ", ["echocardiogram", "test", "echo"]], at: 854 },
      ]},
    ],
  },
  fr: {
    short: "Une bonne visite. Votre tension est là où Dr Chen la veut — le journal de la maison a clairement fait bonne impression. Le sucre des trois mois (A1C) a glissé à 7,9, alors la Metformine monte à 850 mg aujourd'hui. Une petite aspirine quotidienne s'ajoute pour protéger le cœur, et une échographie du cœur, sans douleur, sera cédulée pour les étourdissements du matin et l'histoire de valve dans la famille. Retour en octobre.",
    groups: [
      { h: "Vos médicaments", k: "med", rows: [
        { t: [["Metformine 500 → 850 mg", "med", "metformin"], " — mêmes heures, toujours ", ["avec de la nourriture", "act", "withfood"]], at: 498 },
        { t: ["Nouveau : ", ["aspirine 81 mg", "med", "aspirin"], ", une chaque matin au déjeuner"], at: 640 },
        { t: [["Lisinopril 10 mg", "med", "lisinopril"], " reste exactement tel quel"], at: 212 },
      ]},
      { h: "Examens", k: "test", rows: [
        { t: [["Prise de sang", "test", "bloodtest"], " en bas avant de partir — bon imprimé"], at: 854 },
        { t: [["Échocardiographie", "test", "echo"], " — l'hôpital appelle avec une date (2–3 semaines)"], at: 713 },
        { t: [["A1C", "test", "a1c"], " revérifié avant octobre"], at: 854 },
      ]},
      { h: "Ce que Dr Chen vous demande", k: "act", rows: [
        { t: [["Se lever lentement", "act", "standslow"], " — assise, compter jusqu'à cinq, puis debout"], at: 784 },
        { t: ["De l'eau durant la matinée, pas seulement du thé"], at: 784 },
        { t: ["Garder le ", ["sel", "act", "salt"], " petit — sachets de soupe, marinades"], at: 821 },
        { t: ["Continuer les marches du matin"], at: 264 },
      ]},
      { h: "À surveiller", k: "cond", rows: [
        { t: ["Estomac dérangé la première semaine : ça se calme — sinon, appelez le bureau"], at: 538 },
        { t: [["Bleus faciles ou selles foncées", "cond", "aspwatch"], " avec l'aspirine : appelez tout de suite"], at: 672 },
      ]},
      { h: "La suite", k: "act", rows: [
        { t: ["Revoir Dr Chen en ", ["octobre", "act", "octfu"], " — revérifier l'", ["A1C", "test", "a1c"], ", regarder l'", ["échocardiographie", "test", "echo"]], at: 854 },
      ]},
    ],
  },
};

/* what the pipeline visibly does, in order — the same five lines on
   the Visits card and inside the early-opened page, so the story
   never forks. Durations land around fourteen seconds end to end. */
const VISIT_STEPS = [
  { en: "Saving the recording — 18 min, on your phone", fr: "Enregistrement sauvegardé — 18 min, sur votre téléphone" },
  { en: "Listening back for who spoke when", fr: "Réécoute — qui parle quand" },
  { en: "Writing the transcript — you and Dr. Chen", fr: "Écriture de la transcription — vous et Dr Chen" },
  { en: "Finding medications, tests & instructions", fr: "Repérage des médicaments, examens et consignes" },
  { en: "Writing the plain-language summary — English & Français", fr: "Rédaction du résumé en langage simple — English & Français" },
];

/* the fresh recording's row identity, before and after processing */
const FRESH_VISIT = { id: "chen-new", rich: true, fresh: true,
  title: "Dr. Chen · Cardiology", sub: "Today · 18 min · transcript & summary" };

/* -------- live translate — the interpreter table (two chairs) ------- */
/* Each line exists in all three demo languages; a side renders every
   line in ITS language, so the same exchange reads whole from both
   chairs. Queues are per role: tapping a mic delivers that person's
   next line — tap order can't derail the script. */
const XLATE_LANGS = [
  { id: "en", name: "English", short: "EN" },
  { id: "fr", name: "Français", short: "FR" },
  { id: "ta", name: "தமிழ்", short: "TA" },
];
const XLATE_LINES = [
  { who: "dr", en: "Any dizziness this week?", fr: "Des étourdissements cette semaine ?", ta: "இந்த வாரம் தலைச்சுற்றல் இருந்ததா?" },
  { who: "you", en: "Yes — two mornings, when I stand up quickly.", fr: "Oui — deux matins, quand je me lève vite.", ta: "ஆமாம் — இரண்டு காலை, வேகமா எழுந்தா வருது." },
  { who: "dr", en: "Does it pass after a few seconds?", fr: "Ça passe après quelques secondes ?", ta: "சில நொடிகளில் சரியாகிடுமா?" },
  { who: "you", en: "Yes, once I sit back down.", fr: "Oui, dès que je me rassois.", ta: "ஆமாம், உட்கார்ந்ததும் சரியாகிடும்." },
  { who: "dr", en: "I'm changing your diabetes medicine today — one tablet, morning and supper, always with food.", fr: "Je change votre médicament pour le diabète aujourd'hui — un comprimé, matin et souper, toujours avec de la nourriture.", ta: "இன்று உங்க சர்க்கரை மருந்தை மாத்துறேன் — ஒரு மாத்திரை, காலை & இரவு, எப்பவும் சாப்பாட்டுடன்." },
  { who: "you", en: "Understood — with food.", fr: "Compris — avec de la nourriture.", ta: "புரிஞ்சது — சாப்பாட்டுடன்." },
  { who: "dr", en: "We'll also do a quick blood test before you leave.", fr: "On fera aussi une petite prise de sang avant votre départ.", ta: "நீங்க போறதுக்கு முன்னாடி ஒரு சின்ன இரத்தப் பரிசோதனையும் செய்வோம்." },
  { who: "you", en: "Thank you, doctor.", fr: "Merci, docteur.", ta: "நன்றி, டாக்டர்." },
];
const XLATE_INTRO = {
  /* the doctor's seat gets its own button, so its intro is the consent
     artifact AND the invitation — with the hands-off door named second,
     never instead */
  dr: { en: "This phone translates between you and Amma, and records the visit so she can listen back at home. Tap the microphone on your side and speak normally — or Amma can tap it for you.",
    fr: "Ce téléphone traduit entre vous et Amma, et enregistre la visite pour qu'elle puisse la réécouter à la maison. Touchez le micro de votre côté et parlez normalement — ou Amma peut le toucher pour vous.",
    ta: "இந்த ஃபோன் உங்களுக்கும் அம்மாவுக்கும் இடையே மொழிபெயர்க்கிறது — விசிட்டையும் பதிவு செய்கிறது. உங்க பக்கம் இருக்கும் மைக்கைத் தட்டி இயல்பாகப் பேசுங்கள் — அல்லது அம்மா உங்களுக்காகத் தட்டுவார்." },
  you: { en: "Tap your microphone when you speak. The doctor has their own on their side — and you can tap theirs for them if they'd rather not touch the phone.",
    fr: "Touchez votre micro quand vous parlez. Le médecin a le sien de son côté — et vous pouvez toucher le sien pour lui s'il préfère ne pas toucher le téléphone.",
    ta: "நீங்கள் பேசும்போது உங்க மைக்கைத் தட்டுங்கள். டாக்டருக்கு அவங்க பக்கம் ஒன்னு இருக்கு — அவங்க ஃபோனைத் தொட விரும்பலைன்னா நீங்களே அதைத் தட்டலாம்." },
};
const XLATE_LABELS = {
  en: { me: "You", dr: "Dr. Chen", amma: "Amma", spoken: "Spoken aloud",
    listenBig: "Listening — just speak", ammaSpeaking: "Amma is speaking…",
    drSpeaking: "Dr. Chen is speaking…", tapForThem: "or tap for Dr. Chen",
    done: "The demo script is finished — the recording continues." },
  fr: { me: "Vous", dr: "Dr Chen", amma: "Amma", spoken: "Lu à voix haute",
    listenBig: "J'écoute — parlez normalement", ammaSpeaking: "Amma parle…",
    drSpeaking: "Dr Chen parle…", tapForThem: "ou touchez pour Dr Chen",
    done: "Le scénario de démo est terminé — l'enregistrement continue." },
  ta: { me: "நீங்கள்", dr: "டாக்டர் சென்", amma: "அம்மா", spoken: "சத்தமாக வாசிக்கப்பட்டது",
    listenBig: "கேட்கிறேன் — பேசுங்கள்", ammaSpeaking: "அம்மா பேசுகிறார்…",
    drSpeaking: "டாக்டர் பேசுகிறார்…", tapForThem: "அல்லது டாக்டருக்காகத் தட்டவும்",
    done: "டெமோ முடிந்தது — பதிவு தொடர்கிறது." },
};

const DOC_FILES = {
  day1: [], week1: [],
  week2: [
    { id: "card", title: "Insurance card", sub: "Added July 29" },
    { id: "blood", title: "Blood test results", sub: "Added July 25 · in Dr. Chen's brief" },
    { id: "ref", title: "Referral letter", sub: "Added July 24" },
  ],
  visitday: [
    { id: "card", title: "Insurance card", sub: "Added July 29" },
    { id: "blood", title: "Blood test results", sub: "Added July 25 · in Dr. Chen's brief" },
    { id: "ref", title: "Referral letter", sub: "Added July 24" },
  ],
  month1: [
    /* an addition that changes nothing about her routine carries
       PROVENANCE, not a request — who did it lives in the sub, and it
       never rolls into Updates */
    { id: "receipt", title: "Pharmacy receipt", sub: "Added by Denise yesterday" },
    { id: "bp", title: "Blood pressure log", sub: "Added Aug 6 · in Dr. Osei's brief" },
    { id: "card", title: "Insurance card", sub: "Added July 29" },
    { id: "blood", title: "Blood test results", sub: "Added July 25" },
    { id: "ref", title: "Referral letter", sub: "Added July 24" },
    { id: "rx", title: "Prescription — Vitamin D", sub: "Added July 24" },
    { id: "medicare", title: "Medicare summary", sub: "Added July 22" },
  ],
};

/* every document opens onto ITS OWN summary — one shared blurb would
   put blood-test numbers on a pharmacy receipt and quietly teach her
   the summaries can't be trusted */
const DOC_DETAILS_BY_ID = {
  blood: {
    summaryEn: "Blood test from July 25. Most results are in the normal range. Vitamin D is low (18 ng/mL — normal starts at 30), which matches what Dr. Patel said. Cholesterol and blood sugar are both fine.",
    summaryFr: "Analyse de sang du 25 juillet. La plupart des résultats sont dans la norme. La vitamine D est basse (18 ng/mL — la normale commence à 30), ce qui rejoint l'avis du Dr Patel. Cholestérol et glycémie : corrects.",
    suggestion: { title: "Ask Dr. Chen about the vitamin D result", sub: "Add it as a question in his brief" },
    usedIn: "Dr. Chen's brief",
  },
  receipt: {
    summaryEn: "Pharmacy receipt from August 12 — Metformin 500 mg, 90 tablets, picked up by Denise. $12.40 after insurance. Nothing to do; it's here for your records.",
    summaryFr: "Reçu de pharmacie du 12 août — Metformine 500 mg, 90 comprimés, récupérés par Denise. 12,40 $ après assurance. Rien à faire — c'est ici pour vos dossiers.",
    usedIn: null,
  },
  bp: {
    summaryEn: "Your home blood-pressure log, July 8 to August 5. Readings are steady, most around 128/78 — right where Dr. Chen likes them.",
    summaryFr: "Votre journal de tension à domicile, du 8 juillet au 5 août. Les mesures sont stables, la plupart autour de 128/78 — exactement ce que le Dr Chen souhaite.",
    usedIn: "Dr. Osei's brief",
  },
  card: {
    summaryEn: "Your insurance card, both sides. Member ID ending 4471. The plan renews January 1.",
    summaryFr: "Votre carte d'assurance, recto et verso. Numéro de membre se terminant par 4471. Le régime se renouvelle le 1er janvier.",
    usedIn: null,
  },
  ref: {
    summaryEn: "Referral letter from Dr. Patel to Dr. Chen (cardiology), July 24 — a routine follow-up on blood pressure. The visit it led to is in Past visits.",
    summaryFr: "Lettre de recommandation du Dr Patel au Dr Chen (cardiologie), 24 juillet — un suivi de routine pour la tension. La visite qui en a découlé est dans Visites passées.",
    usedIn: null,
  },
  rx: {
    summaryEn: "Prescription from Dr. Patel, July 24 — Vitamin D 1000 IU, one each morning. It's already in your cabinet.",
    summaryFr: "Ordonnance du Dr Patel, 24 juillet — Vitamine D 1000 UI, une chaque matin. Elle est déjà dans votre armoire.",
    usedIn: null,
  },
  "labs-new": {
    summaryEn: "Bloodwork from March, scanned from paper. Everything was in the usual range then — kept so your doctors can compare.",
    summaryFr: "Analyses de sang de mars, numérisées depuis le papier. Tout était dans la norme à l'époque — conservées pour que vos médecins puissent comparer.",
    usedIn: null,
  },
};
const docDetail = (id) => DOC_DETAILS_BY_ID[id] || DOC_DETAILS_BY_ID.blood;

const NEW_DOC = { id: "labs-new", title: "Lab results — March bloodwork", sub: "Scanned just now · 2 pages · filed under Lab results" };

/* each document type gets its own face in the list */
const DOC_META = {
  "labs-new": { icon: "flask", bg: C.purpleSoft, color: C.purpleInk },
  blood: { icon: "flask", bg: C.purpleSoft, color: C.purpleInk },
  bp: { icon: "pattern", bg: "#E2F7FA", color: "#1E7A8C" },
  rx: { icon: "meds", bg: C.greenSoft, color: C.greenInk },
  card: { icon: "docs", bg: C.blueSoft, color: C.blue },
  medicare: { icon: "docs", bg: C.blueSoft, color: C.blue },
  ref: { icon: "docs", bg: C.orangeSoft, color: C.orangeInk },
};
const docMeta = (id) => DOC_META[id] || { icon: "docs", bg: C.blueSoft, color: C.blue };

/* filing a scan is a pipeline, not a spinner — each step ticks live */
const DOC_STEPS = [
  "Straightening & sharpening 2 pages",
  "Reading the text",
  "Type detected — Lab results",
  "Writing a plain-language summary",
  "Preparing the Français translation",
];
const DocProcessingCard = () => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => Math.min(v + 1, DOC_STEPS.length)), 950);
    return () => clearInterval(t);
  }, []);
  return (
    <Card tone={C.blueSoft} style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <RecallOrb size={40} mood="thinking" />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.blueDeep }}>Filing your scan…</div>
          <div style={{ fontSize: 13.5, color: C.blueSub }}>You can leave — I'll finish on my own</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {DOC_STEPS.map((s, i) => {
          const done = i < n; const active = i === n;
          return (
            <div key={s} className={done || active ? "stepIn" : ""}
              style={{ display: "flex", alignItems: "center", gap: 9, opacity: done ? 1 : active ? 0.9 : 0.32 }}>
              <span style={{ width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                background: done ? C.green : "#fff", color: "#fff", display: "flex",
                alignItems: "center", justifyContent: "center",
                border: done ? "none" : `2px solid ${active ? C.blue : "#C4D4E6"}` }}>
                {done && <Icon d={icons.check} size={11} sw={3.4} />}
                {active && <span className="blink" style={{ width: 7, height: 7, borderRadius: 99, background: C.blue, display: "block" }} />}
              </span>
              <span style={{ fontSize: 14.5, fontWeight: done || active ? 600 : 500,
                color: done || active ? C.blueDeep : "#6B87A3" }}>{s}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* the WRITTEN entry — the diary page the pipeline composes from the
   talk. This is the page's content; the raw conversation is its
   provenance, kept word for word one fold away. First paragraph is
   her opening line verbatim (the same one completion quotes); the
   rest is the day retold in plain prose, never a form. */
const CHECKIN_ENTRY = {
  day1: { time: "9:41 AM", paras: [
    "“A little stiff first thing, fine after — and I took both with breakfast.”",
    "Your first entry — kept the way you said it: the stiffness that let go, breakfast, both pills.",
  ]},
  week1: { time: "8:52 AM", paras: [
    "“Better, actually. I held the rail, but I didn't stop halfway this time.”",
    "The stairs went better — no stop halfway, a first for the week. The knee complained a little at the top and was gone by breakfast.",
  ]},
  week2: { time: "9:05 AM", paras: [
    "“Seven hours — best all week. The earlier bedtime helped.”",
    "The stairs were easier today too — rail held, no stop halfway. The knee was a little stiff first thing, fine after.",
    "No walk this morning — too much pain, so it waited for the evening.",
    "Both pills with breakfast, on time.",
  ],
  /* the planted slip: after writing, the verifier pass reads the entry
     back against the talk. Para 2 it can't match to anything she said
     (she said RAIN) — so the line is marked, never silently rewritten.
     `said` is her verbatim line from the transcript; `fixed` is the
     realignment she can accept. Her word outranks the writing. */
  slip: { i: 2,
    said: "Not yet — the rain hasn't let up since I woke. Maybe after tea.",
    fixed: "No walk this morning — too much rain, so it waited for the evening." } },
  visitday: { time: "8:15 AM", paras: [
    "“Feeling alright going in. A bit nervous about the numbers.”",
    "A short note before Dr. Chen — kept with the brief, so today's visit knows how you went in.",
  ]},
  month1: { time: "9:05 AM", paras: [
    "“Walked with Sarah, knee fine. Slept eight hours.”",
    "A good stretch of it — the walk with Sarah, the knee quiet the whole way, both pills with breakfast. A good night behind a good morning.",
    "Lunch out of the good bowl, and the stairs taken without the rail on the way down. The kind of day the week's picture leans on.",
  ]},
};

const CHECKIN_TRANSCRIPTS = {
  progress: [
    ["Recall", "Morning, Amma. How did you sleep?"],
    ["Amma", "Seven hours — best all week. The earlier bedtime helped."],
    ["Recall", "Lovely. And the morning medications?"],
    ["Amma", "Took both with breakfast. The stairs were easier today too."],
    ["Recall", "Noted — that's twice this week the stairs came up. Knee holding up?",
      "Asked with your profile in mind — the knees are long-standing, so what matters is change."],
    ["Amma", "A little stiff first thing, fine after."],
    ["Recall", "And your walk — did it happen?"],
    ["Amma", "Not yet — the rain hasn't let up since I woke. Maybe after tea."],
  ],
  done: [
    ["Recall", "Anything else on your mind before we wrap up?"],
    ["Amma", "No, that's everything. Good day today."],
  ],
  addendum: [
    ["Recall", "We finalized this morning — I've kept all of it. What's happened since?"],
    ["Amma", "My knee swelled up after dinner. That's not like this morning."],
    ["Recall", "This morning it was only stiff — I've added tonight's swelling as its own note, with the time, and kept it as a question for the doctor."],
  ],
};

const MED_DETAILS = {
  "Metformin 500 mg": { schedule: "Morning & evening, with food", origin: "From your first day — scanned from the bottle, July 21", adherence: [1, 1, 1, 0.5, 1, 1, 1], refill: "About 6 days of pills left" },
  "Lisinopril 10 mg": { schedule: "Evenings", origin: "From your first day — scanned from the bottle, July 21", adherence: [1, 1, 1, 1, 0, 1, 1] },
  "Vitamin D 1000 IU": { schedule: "Every morning", origin: "Added after Dr. Patel's July 24 visit", adherence: [1, 1, 1, 1, 1, 1, 1] },
  "Calcium 600 mg": { schedule: "Every morning at 8:00 AM", origin: "Added by Denise, approved by you Aug 2", adherence: [1, 0.5, 1, 1, 1, 0, 1] },
  "Tylenol 500 mg": { schedule: "As needed", origin: "Added by you Aug 9", asNeeded: true },
  /* the two records a confirmed visit-change creates */
  "Metformin 850 mg": { schedule: "Morning & evening, with food", origin: "Raised from 500 mg at Dr. Chen's July 31 visit — confirmed by you today", adherence: [1, 1, 1, 0.5, 1, 1, 1], refill: "About 6 days of pills left" },
  "Aspirin 81 mg": { schedule: "Every morning", origin: "From Dr. Chen's July 31 visit — added by you today", justAdded: true },
};

/* -------- medication visual identity — shape × color (v10) --------- */
/* Every med gets a recognizable face: Apple-Health-style form icons   */
/* in a chosen color, shown in the cabinet, on Today, and in details.  */

const MED_COLORS = [
  ["white",  "#FFFFFF", "#EFEFF4"],
  ["blue",   "#5AA9FF", "#E5F1FF"],
  ["amber",  "#F5B84C", "#FFF3DC"],
  ["pink",   "#FF9EB5", "#FFEAF0"],
  ["purple", "#B98FE8", "#F3EAFC"],
  ["teal",   "#4CC8D9", "#E2F7FA"],
];
const medColor = (id) => MED_COLORS.find((c) => c[0] === id) || MED_COLORS[0];

const MED_SHAPES = [
  ["capsule", "Capsule"], ["tablet", "Tablet"], ["oval", "Oval"],
  ["oblong", "Oblong"], ["liquid", "Liquid"], ["inhaler", "Inhaler"],
];

const MedShape = ({ shape = "tablet", color = "#5AA9FF", size = 28 }) => {
  const line = "rgba(28,28,30,.25)";
  const score = "rgba(28,28,30,.18)";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0, display: "block" }}>
      {shape === "capsule" && (
        <g transform="rotate(-45 24 24)">
          <rect x="10" y="17" width="28" height="14" rx="7" fill="#fff" stroke={line} strokeWidth="1.4" />
          <path d="M17 17 h-0 a7 7 0 0 0 -7 7 a7 7 0 0 0 7 7 h7 v-14 z" fill={color} stroke={line} strokeWidth="1.4" />
        </g>
      )}
      {shape === "tablet" && (
        <>
          <circle cx="24" cy="24" r="13.5" fill={color} stroke={line} strokeWidth="1.4" />
          <path d="M11.5 24h25" stroke={score} strokeWidth="1.6" />
        </>
      )}
      {shape === "oval" && (
        <>
          <ellipse cx="24" cy="24" rx="15.5" ry="10" fill={color} stroke={line} strokeWidth="1.4" />
          <ellipse cx="18.5" cy="20.5" rx="5" ry="2.6" fill="rgba(255,255,255,.65)" />
        </>
      )}
      {shape === "oblong" && (
        <>
          <rect x="7" y="17.5" width="34" height="13" rx="6.5" fill={color} stroke={line} strokeWidth="1.4" />
          <path d="M24 17.5v13" stroke={score} strokeWidth="1.6" />
        </>
      )}
      {shape === "liquid" && (
        <>
          <rect x="18.5" y="6.5" width="11" height="6" rx="1.6" fill="#B9BEC7" />
          <rect x="14" y="12.5" width="20" height="29" rx="4.5" fill="#fff" stroke={line} strokeWidth="1.4" />
          <path d="M16.5 25.5h15v11a2.5 2.5 0 0 1-2.5 2.5h-10a2.5 2.5 0 0 1-2.5-2.5z" fill={color} />
        </>
      )}
      {shape === "inhaler" && (
        <>
          <rect x="16" y="7" width="12" height="21" rx="3" fill={color} stroke={line} strokeWidth="1.4" />
          <rect x="16" y="26" width="23" height="11" rx="3.5" fill="#fff" stroke={line} strokeWidth="1.4" />
        </>
      )}
    </svg>
  );
};

/* looks for the meds already in Amma's cabinet */
const MED_LOOKS = {
  "Metformin 500 mg": { shape: "oval", color: "white" },
  "Lisinopril 10 mg": { shape: "tablet", color: "pink" },
  "Vitamin D 1000 IU": { shape: "capsule", color: "amber" },
  "Calcium 600 mg": { shape: "oblong", color: "white" },
  "Tylenol 500 mg": { shape: "oblong", color: "white" },
  "Metformin 850 mg": { shape: "oval", color: "white" },
  "Aspirin 81 mg": { shape: "tablet", color: "white" },
};

/* typeahead database — the flow only suggests once you've typed */
const MED_DB = [
  { name: "Amlodipine", form: "Tablet", doses: ["2.5 mg", "5 mg", "10 mg"], when: "Morning", look: { shape: "tablet", color: "white" } },
  { name: "Atorvastatin", form: "Tablet", doses: ["10 mg", "20 mg", "40 mg"], when: "Evening", look: { shape: "oval", color: "white" } },
  { name: "Furosemide", form: "Tablet", doses: ["20 mg", "40 mg"], when: "Morning", look: { shape: "tablet", color: "amber" } },
  { name: "Gabapentin", form: "Capsule", doses: ["100 mg", "300 mg"], when: "Evening", look: { shape: "capsule", color: "amber" } },
  { name: "Levothyroxine", form: "Tablet", doses: ["25 mcg", "50 mcg", "75 mcg"], when: "Morning", look: { shape: "tablet", color: "purple" } },
  { name: "Lisinopril", form: "Tablet", doses: ["5 mg", "10 mg", "20 mg"], when: "Morning", look: { shape: "tablet", color: "pink" } },
  { name: "Melatonin", form: "Tablet", doses: ["3 mg", "5 mg", "10 mg"], when: "Evening", look: { shape: "tablet", color: "purple" } },
  { name: "Metformin", form: "Tablet", doses: ["500 mg", "850 mg", "1000 mg"], when: "Morning & evening", look: { shape: "oval", color: "white" } },
  { name: "Methotrexate", form: "Tablet", doses: ["2.5 mg", "10 mg"], when: "Morning", look: { shape: "tablet", color: "amber" } },
  { name: "Metoprolol", form: "Tablet", doses: ["25 mg", "50 mg", "100 mg"], when: "Morning", look: { shape: "oblong", color: "blue" } },
  { name: "Omeprazole", form: "Capsule", doses: ["20 mg", "40 mg"], when: "Morning", look: { shape: "capsule", color: "pink" } },
  { name: "Tylenol (acetaminophen)", form: "Tablet", doses: ["325 mg", "500 mg"], when: "As needed", look: { shape: "oblong", color: "white" } },
  { name: "Vitamin B12", form: "Tablet", doses: ["500 mcg", "1000 mcg"], when: "Morning", look: { shape: "tablet", color: "pink" } },
];

/* what the bottle-scan "reads" — one canonical demo label */
const SCAN_MED = {
  db: MED_DB.find((m) => m.name === "Atorvastatin"),
  dose: "20 mg",
  when: "Evening",
  directions: "Take one tablet by mouth every evening",
  source: "Riverside Pharmacy · Dr. Patel · filled Jul 12",
};

/* ------- simulated iOS keyboard — search stays anchored on top ----- */
/* The field lives at the TOP of the page and the keyboard rises from  */
/* the bottom, so suggestions always fit in between — nothing the      */
/* user needs is ever hidden behind the keys.                          */

const KB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const FakeKeyboard = ({ onKey, onBackspace, onDone }) => {
  /* mimics the system keyboard, so it themes like one: card keys on a
     track board, modifier keys one step darker */
  const key = (label, onClick, flex = 1, dark) => (
    <button key={label} className="tap" onClick={onClick}
      style={{ flex, height: 42, border: "none", borderRadius: 6, fontFamily: FONT,
        background: dark ? C.track : C.card, color: C.ink, fontSize: 16.5,
        boxShadow: "0 1px 0 rgba(0,0,0,.3)", cursor: "pointer", padding: 0, minWidth: 0 }}>
      {label}
    </button>
  );
  return (
    <div className="kbIn" style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 35,
      background: C.line, padding: "8px 5px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      {KB_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: "flex", gap: 5, padding: ri === 1 ? "0 16px" : 0 }}>
          {ri === 2 && key("⇧", () => {}, 1.3, true)}
          {row.split("").map((ch) => key(ch, () => onKey(ch)))}
          {ri === 2 && key("⌫", onBackspace, 1.3, true)}
        </div>
      ))}
      <div style={{ display: "flex", gap: 5 }}>
        {key("123", () => {}, 1.4, true)}
        {key("space", () => onKey(" "), 4.6)}
        <button className="tap" onClick={onDone}
          style={{ flex: 1.8, height: 42, border: "none", borderRadius: 6, fontFamily: FONT,
            background: C.blue, color: "#fff", fontSize: 15.5, fontWeight: 600,
            boxShadow: "0 1px 0 #898D97", cursor: "pointer" }}>
          Done
        </button>
      </div>
    </div>
  );
};

const TOUR_STEPS = [
  { tab: "today", title: "This is Today", body: "Your whole day on one screen — the check-in, your medications, and anything that needs you. When in doubt, come back here." },
  { tab: "meds", title: "Medications", body: "Log each time of day as you take it. Add new ones here — or just mention them in a check-in." },
  { tab: "journal", title: "Your Journal", body: "Everything you tell Recall lives here, in your own words. Private to you unless you choose to share." },
  { tab: "visits", title: "Visits", body: "Upcoming visits build a brief to bring your doctor. Past visits keep the recording and a plain-language summary." },
  { tab: "docs", title: "Documents", body: "Scan or upload papers. Recall files them, explains them simply, and can translate them." },
  { tab: "today", title: "And this is me", body: "The blue face is Recall. Tap it any time to check in, add something, or hear this tour again." },
];

/* --------------------- check-in card ------------------------------ */

/* the week, folded into the check-in card — five small pills instead of a
   second card on Today. Check-ins are what fill the ring, so the progress
   lives where the action is; tap opens the full insight page. */
const WeekPulse = ({ insight }) => {
  if (!insight) return null;
  const shown = Math.min(insight.filled + (insight.boost ? 1 : 0), 7);
  const earned = insight.earned || shown >= 5;
  return (
    <div className="tap" role="button"
      onClick={(e) => { e.stopPropagation(); insight.onOpen(); }}
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, paddingTop: 12,
        borderTop: `0.5px solid ${C.line}`, cursor: "pointer" }}>
      <Icon d={icons.spark} size={15} color={C.purple} sw={1.6} />
      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.sub, whiteSpace: "nowrap" }}>This week</span>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={insight.celebrate && i === shown - 1 ? "chipPop" : ""}
            style={{ width: 14, height: 6, borderRadius: 99,
              background: i < shown ? C.purple : C.track, transition: "background .4s" }} />
        ))}
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap",
        color: earned ? C.purpleInk : C.sub }}>
        {earned ? "Saturday ✓" : `${shown} of 5`}
      </span>
      <div style={{ flex: 1 }} />
      <Icon d={icons.chevron} size={13} color={C.ter} sw={2.2} />
    </div>
  );
};

const CheckinCard = ({ period, finalizeStage, reopened, celebrate, openCheckin, openDetail, insight }) => {
  const [i, setI] = useState(0);
  const cfg = CHECKIN[period];
  const msgs = cfg.msgs || [];
  useEffect(() => {
    setI(0);
    if (msgs.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % msgs.length), 5200);
    return () => clearInterval(t);
  }, [period]);

  /* finalize pipeline: the card itself writes the entry */
  if (finalizeStage === "processing")
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <RecallOrb size={40} mood="thinking" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Writing today's entry…</div>
            <div style={{ fontSize: 13.5, color: C.sub }}>From your own words — a few seconds</div>
          </div>
        </div>
        <div className="skel" style={{ height: 12, width: "88%", marginBottom: 8 }} />
        <div className="skel" style={{ height: 12, width: "72%", marginBottom: 8 }} />
        <div className="skel" style={{ height: 12, width: "80%" }} />
      </Card>
    );
  if (finalizeStage === "done")
    return (
      <Card onClick={() => openDetail("done")} style={{ position: "relative" }}>
        {celebrate && <Burst />}
        <Row leading={celebrate ? <RecallOrb size={38} mood="celebrate" /> : <Icon d={icons.check} size={20} sw={2.6} />}
          leadingBg={celebrate ? "transparent" : C.greenSoft} leadColor={C.green}
          title={reopened ? "Updated this evening" : "Finalized just now"}
          sub={reopened ? "Morning entry + tonight's note · tap to read" : "4 of 6 touched · tap to read your entry"}
          pad="2px" />
        <WeekPulse insight={insight} />
      </Card>
    );

  if (cfg.mode === "done")
    return (
      <Card onClick={() => openDetail("done")}>
        <Row leading={<Icon d={icons.check} size={20} sw={2.6} />} leadingBg={C.greenSoft} leadColor={C.green}
          title={`Finalized at ${cfg.finalizedAt}`}
          sub={reopened ? "Plus tonight's note · tap to read it" : "From this morning's talk · still open to additions · tap to read"}
          pad="2px" />
        <WeekPulse insight={insight} />
      </Card>
    );

  if (cfg.mode === "visitday")
    return (
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.45, marginBottom: 4 }}>
          Light one today — Recall will check in with you after the visit instead.
        </div>
        <div style={{ fontSize: 14.5, color: C.sub }}>How you're feeling going in, in one sentence.</div>
        <div style={{ marginTop: 12 }}>
          <BigButton tone="tinted" icon={<RecallOrb size={22} />} onClick={openCheckin}>Check-in</BigButton>
        </div>
        <WeekPulse insight={insight} />
      </Card>
    );

  /* two taps max on this card: the CTA and the week strip. Progress is
     ONE quiet line of text — no bars, no pager dots, no card-level tap
     (the transcript stays reachable from the Journal). */
  if (cfg.mode === "progress") {
    const left = cfg.open.length > 1
      ? `${cfg.open.slice(0, -1).join(", ")} & ${cfg.open[cfg.open.length - 1]}`
      : cfg.open[0];
    return (
      <Card>
        <div key={i} className="fadeMsg" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.4,
          minHeight: 52, letterSpacing: "-.01em" }}>
          {msgs[i]}
        </div>
        <div style={{ margin: "6px 0 13px", fontSize: 13.5, color: C.ter, lineHeight: 1.45 }}>
          {cfg.done} of 6 so far · {left} still open
        </div>

        <button className="tap" onClick={openCheckin} style={{ width: "100%", minHeight: 52, borderRadius: 13,
          border: "none", background: C.blueSoft, color: C.blue, fontSize: 16.5, fontWeight: 600,
          cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10 }}>
          <RecallOrb size={24} />Continue the check-in
        </button>
        <WeekPulse insight={insight} />
      </Card>
    );
  }

  return (
    <Card>
      <div key={i} className="fadeMsg" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4,
        minHeight: 56, letterSpacing: "-.01em" }}>
        {msgs[i]}
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, margin: "6px 0 13px" }}>{cfg.hint}</div>
      <button className="tap" onClick={openCheckin} style={{ width: "100%", minHeight: 52, borderRadius: 13,
        border: "none", background: C.blueSoft, color: C.blue, fontSize: 16.5, fontWeight: 600,
        cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10 }}>
        <RecallOrb size={24} />Answer the check-in
      </button>
      <WeekPulse insight={insight} />
    </Card>
  );
};

/* Today's card is today's medication STATE. Its tap must look like what
   it does: with a dose pending, the tap is an ACTION — it opens the same
   log sheet the Meds tab uses, right here, and you never leave Today
   (Today is where you act). Only when the day is done does the card
   become a DOOR, and then the label names where it goes — the record
   lives in Meds. The old version wore a chevron but teleported tabs:
   a door's face on a button's job. */
const MedsPointerCard = ({ doses, groups, doseLog, anMeds, doneCount, openLog, onOpenRecord }) => {
  const nextGroup = groups.find((g) => g.items.some((d) => !doseLog[d.id]));
  const pendingNames = nextGroup
    ? nextGroup.items.filter((d) => !doseLog[d.id]).map((d) => shortMedName(d.name)).join(", ")
    : "";
  const overdue = nextGroup && nextGroup.items.some((d) => d.overdue && !doseLog[d.id]);
  const allDone = doses.length > 0 && !nextGroup;
  const frac = doses.length ? doneCount / doses.length : 0;
  const acts = nextGroup ? () => openLog(`time:${nextGroup.key}`)
    : !allDone && anMeds.length > 0 ? () => openLog("asneeded")
    : null;
  return (
    <Card onClick={acts || onOpenRecord}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <DoseRing frac={frac} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: overdue ? C.orangeInk : C.ink }}>
            {allDone ? "All logged today"
              : nextGroup ? (overdue ? `Overdue since ${nextGroup.time.replace(" ", " ")}`
                : `Next dose: ${nextGroup.time.replace(" ", " ")}`)
              : "As-needed on hand"}
          </div>
          {/* med names WRAP, never truncate — "Metfor…" is not a medication
              name, and large text sizes make the cut worse */}
          <div style={{ fontSize: 13.5, color: allDone ? C.greenInk : C.sub, lineHeight: 1.35 }}>
            {allDone ? "The day's record lives in Meds — tap to see it"
              : nextGroup ? `${pendingNames} · tap to log`
              : "On hand — tap to log one"}
          </div>
        </div>
        {acts ? (
          <span style={{ background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "8px 16px",
            fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
            Log
          </span>
        ) : (
          <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
        )}
      </div>
    </Card>
  );
};

/* ------------------------ today screen ----------------------------- */

const TodayScreen = ({ period, ui, doses, doseLog, anMeds, anLog, logEvents, openLog, needs = [], welcomeClosed, closeWelcome, finalizeStage, reopened, finalizeCelebrate, medsCelebrate, insightBoost, visitRecorded }) => {
  const st = INSIGHT_STATE[period];
  const doneCount = doses.filter((d) => doseLog[d.id]?.status === "taken").length;
  const groups = groupDoses(doses);
  const nextVisit = VISITS[period][0];

  return (
    <>
      {needs.length === 1 && (
        <NeedsStrip count={1} text={needs[0].title} onClick={() => ui.openRequest(needs[0])} />
      )}
      {needs.length > 1 && (
        <NeedsStrip count={needs.length} text={`${needs.length} things need you — Sarah, Denise & Recall`}
          onClick={() => ui.openPage("needs")} />
      )}

      {st.fresh && (
        <Card tone={C.purpleSoft} style={{ marginBottom: 4 }} onClick={() => ui.openPage("insightReport")}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <RecallOrb size={46} mood="delighted" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: C.purpleInk }}>Week 1's insight is ready</div>
              <div style={{ fontSize: 14, color: C.purpleInk }}>Tap to read · this week's ring: 2 of 5</div>
            </div>
            <Icon d={icons.chevron} size={16} color={C.purpleInk} sw={2.2} />
          </div>
        </Card>
      )}

      {period === "visitday" && (
        <Card tone={C.blue} style={{ marginBottom: 4 }}>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.8, letterSpacing: ".04em",
              textTransform: "uppercase", marginBottom: 4 }}>
              Today · 10:15 AM
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Dr. Chen — Cardiology</div>
            <div style={{ fontSize: 15, opacity: 0.85, marginTop: 3 }}>Your brief is ready to bring in.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <BigButton tone="white" small onClick={() => ui.openPage("briefReport")}>Read brief</BigButton>
              {visitRecorded ? (
                <button className="tap" onClick={() => ui.goTab("visits")}
                  style={{ flex: 1, minHeight: 44, borderRadius: 13, border: "none", background: "rgba(255,255,255,.2)",
                    color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon d={icons.check} size={16} sw={2.6} />
                  Recorded — in Visits
                </button>
              ) : (
                <button className="tap" onClick={() => ui.openPage("record")}
                  style={{ flex: 1, minHeight: 44, borderRadius: 13, border: "none", background: "rgba(255,255,255,.2)",
                    color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: C.red }} />
                  Record the visit
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* no welcome banner — the header greets, and orientation lives in
          the guided tour (FAB → Show me around) instead of a dismissible card */}
      <SectionLabel>Today's check-in</SectionLabel>
      <CheckinCard period={period} finalizeStage={finalizeStage} reopened={reopened} celebrate={finalizeCelebrate}
        openCheckin={ui.openCheckin}
        openDetail={(status) => ui.openPage("checkinDetail", { status })}
        insight={{ filled: st.filled, earned: st.earned, boost: insightBoost,
          celebrate: finalizeCelebrate, onOpen: () => ui.openPage("insightProgress") }} />

      <SectionLabel>
        Today's medications{doses.length > 0 ? ` · ${doneCount} of ${doses.length} taken` : ""}
      </SectionLabel>
      {doses.length === 0 && anMeds.length === 0 ? (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: C.greenSoft, color: C.greenInk,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={icons.meds} size={21} />
            </div>
            <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.45, flex: 1 }}>
              None added yet — add them in Meds, or just mention them in a check-in and Recall will ask to save them.
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ position: "relative" }}>
          {medsCelebrate && <Burst />}
          <MedsPointerCard doses={doses} groups={groups} doseLog={doseLog} anMeds={anMeds}
            doneCount={doneCount} openLog={openLog} onOpenRecord={() => ui.goTab("meds")} />
        </div>
      )}

      {period !== "visitday" && nextVisit && (
        <>
          <SectionLabel>Next visit</SectionLabel>
          <Card onClick={() => ui.openVisit(nextVisit)}>
            <Row leading={<Icon d={icons.visits} size={21} />} title={nextVisit.title}
              sub={`${nextVisit.date.split("·")[0].trim()} · ${nextVisit.briefLine}`} pad="2px"
              right={finalizeStage === "done" && !reopened ? (
                <span className="chipPop" style={{ fontSize: 12, fontWeight: 700, color: C.greenInk,
                  background: C.greenSoft, borderRadius: 99, padding: "4px 9px", flexShrink: 0,
                  whiteSpace: "nowrap" }}>
                  updated ✓
                </span>
              ) : undefined} />
          </Card>
        </>
      )}

      {period === "month1" && (
        <>
          <SectionLabel>Reminders</SectionLabel>
          <Card tone={C.redSoft}>
            <Row leading={<Icon d={icons.meds} size={21} />} leadingBg="#fff" leadColor={C.red}
              title="Metformin refill due soon" sub="About 6 days of pills left" pad="2px"
              onClick={() => ui.openPage("medDetail", { name: "Metformin 500 mg" })} />
          </Card>
        </>
      )}
    </>
  );
};

/* ------------- Today V3 — "header carries the horizon" -------------- */
/* The composition picked on the design canvas, toggleable from the ••• */
/* menu so both Todays run on the same period data:                     */
/*  · A2 — the nearest visit rides as one line in the app header        */
/*    (rendered there, not here; hidden on visit day where the hero     */
/*    takes over).                                                      */
/*  · C2 — the still-open parts of the day are a plain sentence, never  */
/*    a count the user was never taught.                                */
/*  · F2 — the question cycles slowly (11s: every message clears a      */
/*    130-wpm reader with margin); the orb pulses a beat before the     */
/*    text changes so the change has an author; touching the card       */
/*    pauses it; "Ask me another" leafs through by hand.                */
/*  · B4 — the week speaks only within reach of Saturday (a fresh       */
/*    insight takes the slot first); the full ring lives in Journal.    */
/*  · H3 — days "wrap", they don't "finalize".                          */
/*  · G2/G3 — an empty shelf is a dashed slot with one action; an       */
/*    empty horizon renders nothing at all.                             */
/*  · M1/D3 — everything scheduled is ONE list under a fold: visits     */
/*    with brief-state phrases, refills, then requests (named when 1–2, */
/*    summarized at 3+). Brief state is words on a row, never a meter.  */
/*  · I3 — the fold label pins under the collapsed bar while scrolled.  */

const V3_STATE_LINES = {
  day1: "We haven't talked about moving, eating, or how the day felt yet.",
  week1: "About two minutes, whenever you're ready.",
  week2: "Moving and how you're feeling are still open.",
};

/* one purple line for PROGRESS only, shown within reach of Saturday (B4).
   An ARRIVED insight is a different class — content, not a meter — and
   gets its own card above the check-in (V3InsightCard). */
const V3WeekLine = ({ st, boost, openProgress }) => {
  const shown = Math.min(st.filled + (boost ? 1 : 0), 7);
  const earned = st.earned || shown >= 5;
  let text = null, onTap = null;
  if (st.fresh) return null;
  if (earned) { text = "That's five — Saturday's insight is earned"; onTap = openProgress; }
  else if (shown === 4) { text = "Tomorrow makes five — Saturday's insight unlocks"; onTap = openProgress; }
  if (!text) return null;
  return (
    <div className="tap" role="button"
      onClick={(e) => { e.stopPropagation(); onTap(); }}
      style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, minHeight: 44,
        padding: "10px 0 6px", marginBottom: -6, boxSizing: "border-box",
        borderTop: `0.5px solid ${C.line}`, cursor: "pointer" }}>
      <Icon d={icons.pattern} size={15} color={C.purple} sw={2} />
      <span style={{ fontSize: 13.5, fontWeight: 650, color: C.purpleInk, flex: 1, lineHeight: 1.35 }}>
        {text}
      </span>
      <Icon d={icons.chevron} size={13} color={C.ter} sw={2.2} />
    </div>
  );
};

const V3CheckinCard = ({ period, finalizeStage, reopened, celebrate, openCheckin, openDetail, week }) => {
  const cfg = CHECKIN[period];
  const msgs = cfg.msgs || [];
  const [i, setI] = useState(0);
  const [tell, setTell] = useState(false);
  const paused = useRef(false);
  const swapT = useRef(null);
  useEffect(() => {
    setI(0); setTell(false);
    if (msgs.length < 2) return;
    const iv = setInterval(() => {
      if (paused.current) return;
      setTell(true);
      swapT.current = setTimeout(() => {
        setI((v) => (v + 1) % msgs.length);
        setTell(false);
      }, 650);
    }, 11000);
    return () => { clearInterval(iv); if (swapT.current) clearTimeout(swapT.current); };
  }, [period]);
  const holdProps = {
    onPointerDown: () => { paused.current = true; },
    onPointerUp: () => { paused.current = false; },
    onPointerLeave: () => { paused.current = false; },
    onPointerCancel: () => { paused.current = false; },
  };

  if (finalizeStage === "processing")
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <RecallOrb size={40} mood="thinking" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Writing today's entry…</div>
            <div style={{ fontSize: 13.5, color: C.sub }}>From your own words — a few seconds</div>
          </div>
        </div>
        <div className="skel" style={{ height: 12, width: "88%", marginBottom: 8 }} />
        <div className="skel" style={{ height: 12, width: "72%", marginBottom: 8 }} />
        <div className="skel" style={{ height: 12, width: "80%" }} />
      </Card>
    );

  /* wrapped — H3 words: a written entry with an open door, not a filing */
  if (finalizeStage === "done" || cfg.mode === "done")
    return (
      <Card onClick={() => openDetail("done")} style={{ position: "relative" }}>
        {celebrate && <Burst />}
        <Row leading={celebrate ? <RecallOrb size={38} mood="celebrate" /> : <Icon d={icons.check} size={20} sw={2.6} />}
          leadingBg={celebrate ? "transparent" : C.greenSoft} leadColor={C.green}
          title={reopened ? "Updated this evening" : "Today's entry is written"}
          sub={reopened
            ? "The morning entry plus tonight's note · tap to read"
            : finalizeStage === "done"
            ? "From your own words, just now · anything you add joins it"
            : "From this morning's talk · anything you add joins it"}
          pad="2px" />
        <V3WeekLine {...week} />
      </Card>
    );

  if (cfg.mode === "visitday")
    return (
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.45, marginBottom: 4 }}>
          Light one today — Recall will check in with you after the visit instead.
        </div>
        <div style={{ fontSize: 14.5, color: C.sub }}>How you're feeling going in, in one sentence.</div>
        <div style={{ marginTop: 12 }}>
          <BigButton tone="tinted" icon={<RecallOrb size={22} />} onClick={openCheckin}>Check-in</BigButton>
        </div>
        <V3WeekLine {...week} />
      </Card>
    );

  const stateLine = V3_STATE_LINES[period] || cfg.hint;
  return (
    <Card>
      <div {...holdProps}>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <div className={tell ? "orbTell" : ""} style={{ borderRadius: 99, marginTop: 3, flexShrink: 0 }}>
            <RecallOrb size={26} mood={tell ? "thinking" : "calm"} />
          </div>
          {/* grid-stack rotator: every message occupies the same cell, so the
              card is sized to the TALLEST one for the whole period — nothing
              below ever shifts when a 2-line prompt swaps for a 3-line one.
              The fade is SEQUENCED, not crossed: the old line fades fully out
              during the orb's thinking beat, the index swaps, the new line
              fades in — text in the same spot must never double-expose. */}
          <div style={{ display: "grid", flex: 1 }}>
            {(msgs.length ? msgs : [cfg.hint]).map((m, idx) => (
              <div key={idx} aria-hidden={idx !== i} style={{ gridArea: "1 / 1", fontSize: 19,
                fontWeight: 700, lineHeight: 1.4, letterSpacing: "-.01em",
                opacity: idx === i && !tell ? 1 : 0,
                transform: idx === i && !tell ? "none" : "translateY(5px)",
                transition: "opacity .3s ease, transform .3s ease" }}>
                {m}
              </div>
            ))}
          </div>
        </div>
        <div style={{ margin: "6px 0 13px", fontSize: 13.5, color: C.ter, lineHeight: 1.45 }}>
          {stateLine}
        </div>
      </div>
      <button className="tap" onClick={openCheckin} style={{ width: "100%", minHeight: 52, borderRadius: 13,
        border: "none", background: C.blueSoft, color: C.blue, fontSize: 16.5, fontWeight: 600,
        cursor: "pointer", fontFamily: FONT }}>
        {cfg.mode === "progress" ? "Continue the check-in" : "Answer the check-in"}
      </button>
      {/* no "Ask me another": a manual control duplicating an automatic
          behavior is two mechanisms for one outcome, and the real way to
          ask another is the check-in itself. The orb's pulse keeps the
          change authored; a missed question costs nothing. */}
      <V3WeekLine {...week} />
    </Card>
  );
};

/* G2 — an empty shelf is a slot, not a card pretending to be content */
const V3EmptyShelf = ({ onAdd }) => (
  <button className="tap" onClick={onAdd} style={{ width: "100%", textAlign: "left", cursor: "pointer",
    background: "transparent", border: `1.5px dashed ${C.track}`, borderRadius: 14, padding: "13px 15px",
    fontFamily: FONT, display: "flex", alignItems: "center", gap: 12 }}>
    <span style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px dashed ${C.track}`,
      color: C.ter, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon d={icons.plus} size={18} sw={2.2} />
    </span>
    <span style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.4 }}>
      Your cabinet starts empty on purpose. Add a pill from its bottle — or just mention it when we talk
    </span>
  </button>
);

/* one grammar for every place that will fill later — dashed border,
   see-through, the cabinet's first-morning voice. A solid white card
   promises content it doesn't have; the dash says "this is a socket,
   not a thing" everywhere the same way. */
const EmptyHint = ({ children }) => (
  <div style={{ border: `1.5px dashed ${C.track}`, borderRadius: 14, background: "transparent",
    padding: "16px 15px", fontSize: 14.5, color: C.sub, lineHeight: 1.5, textAlign: "center" }}>
    {children}
  </div>
);

/* I3 — the fold divides now from ahead and pins while you're below it */
const V3Fold = () => (
  <div style={{ position: "sticky", top: -2, zIndex: 5, background: C.bg,
    margin: "6px -4px 0", padding: "8px 4px 6px", display: "flex", alignItems: "center", gap: 9 }}>
    <div style={{ height: 1, background: C.line, flex: 1 }} />
    <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".06em",
      textTransform: "uppercase", color: C.ter }}>
      The days ahead
    </span>
    <div style={{ height: 1, background: C.line, flex: 1 }} />
  </div>
);

/* M1 + D3 — every visit (brief state as words), then refills, then
   requests. One list, date order, one visual weight. Empty → nothing. */
const V3DaysAhead = ({ period, ui, needs = [] }) => {
  const visits = VISITS[period] || [];
  const rows = [];
  visits.forEach((v) => rows.push(
    <Row key={v.id} leading={<Icon d={icons.visits} size={20} />} title={v.title}
      sub={`${v.date.split("·")[0].trim()} · ${v.briefLine}`} onClick={() => ui.openVisit(v)} />
  ));
  if (period === "month1") rows.push(
    <Row key="refill" leading={<Icon d={icons.meds} size={20} />} leadingBg={C.greenSoft}
      leadColor={C.greenInk} title="Metformin refill" sub="About 6 days of pills left"
      onClick={() => ui.openPage("medDetail", { name: "Metformin 500 mg" })} />
  );
  if (needs.length > 0 && needs.length <= 2)
    needs.forEach((n) => rows.push(
      <Row key={n.id} leading={<Icon d={icons[n.icon]} size={19} />} leadingBg={C.orangeSoft}
        leadColor={C.orangeInk} title={n.title} sub={n.sub} onClick={() => ui.openRequest(n)} />
    ));
  else if (needs.length > 2)
    rows.push(
      <Row key="needs" leading={<Icon d={icons.bell} size={19} />} leadingBg={C.orangeSoft}
        leadColor={C.orangeInk} title={`${needs.length} things need you`}
        sub="Sarah, Denise & Recall · tap to review" onClick={() => ui.openPage("needs")} />
    );
  if (rows.length === 0) return null;
  return (
    <>
      <V3Fold />
      <Card>
        {rows.map((r, idx) => (
          <div key={idx}>
            {idx > 0 && <Divider />}
            {r}
          </div>
        ))}
      </Card>
    </>
  );
};

const TodayScreenV3 = ({ period, ui, doses, doseLog, anMeds, openLog, needs, finalizeStage, reopened,
  finalizeCelebrate, medsCelebrate, insightBoost, obSummary, visitRecorded }) => {
  const st = INSIGHT_STATE[period];
  const doneCount = doses.filter((d) => doseLog[d.id]?.status === "taken").length;
  const groups = groupDoses(doses);
  const week = { st, boost: insightBoost,
    openProgress: () => ui.openPage("insightProgress"),
    openReport: () => ui.openPage("insightReport") };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      {period === "visitday" && (
        <Card tone={C.blue}>
          <div style={{ color: "#fff" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.8, letterSpacing: ".04em",
              textTransform: "uppercase", marginBottom: 4 }}>
              Today · 10:15 AM
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Dr. Chen — Cardiology</div>
            <div style={{ fontSize: 15, opacity: 0.85, marginTop: 3 }}>Your brief is ready to bring in.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <BigButton tone="white" small onClick={() => ui.openPage("briefReport")}>Read brief</BigButton>
              {visitRecorded ? (
                <button className="tap" onClick={() => ui.goTab("visits")}
                  style={{ flex: 1, minHeight: 44, borderRadius: 13, border: "none", background: "rgba(255,255,255,.2)",
                    color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Icon d={icons.check} size={16} sw={2.6} />
                  Recorded — in Visits
                </button>
              ) : (
                <button className="tap" onClick={() => ui.openPage("record")}
                  style={{ flex: 1, minHeight: 44, borderRadius: 13, border: "none", background: "rgba(255,255,255,.2)",
                    color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: C.red }} />
                  Record the visit
                </button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* an arrived insight is the week's payoff — content, not a meter.
          It gets a card, the top slot for its one fresh day, and it SAYS
          the finding (telling beats teasing for this audience). Reading
          it moves it to Journal, so the slot frees itself. */}
      {st.fresh && (
        <Card tone={C.purpleSoft} onClick={() => ui.openPage("insightReport")}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            {/* NOT an orb — the orb appears only where Recall speaks or
                listens. A finding gets the app's pattern glyph. */}
            <div style={{ width: 42, height: 42, borderRadius: 12, background: C.card,
              color: C.purpleInk, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0 }}>
              <Icon d={icons.pattern} size={22} sw={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: C.purpleInk }}>
                Week 1's insight is ready
              </div>
              <div style={{ fontSize: 14, color: C.purpleInk, lineHeight: 1.35, marginTop: 1 }}>
                Sleep was steadier on days you walked — tap to read
              </div>
            </div>
            <Icon d={icons.chevron} size={16} color={C.purpleInk} sw={2.2} />
          </div>
        </Card>
      )}

      <V3CheckinCard period={period} finalizeStage={finalizeStage} reopened={reopened}
        celebrate={finalizeCelebrate} openCheckin={ui.openCheckin}
        openDetail={(status) => ui.openPage("checkinDetail", { status })} week={week} />

      {/* day 1 only — the morning's setup gets a door while it's still
          "this morning"; from tomorrow the story lives behind her avatar.
          TWO variants of one card: straight out of the flow you just
          walked, it reads back YOUR setup (obSummary); the demo's own
          Day 1 belongs to Amma, whose same setup was asked out loud in
          one assisted call. The sub claims only what its flow did. */}
      {period === "day1" && (obSummary ? (
        <Card onClick={() => ui.openPage("setupStory")}>
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title="Set up just now"
            sub="Your answers, your cabinet & a first short talk — read it back · today's check-in stays open" pad="2px 0" />
        </Card>
      ) : (
        <Card onClick={() => ui.openPage("setupStory")}>
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title="Set up this morning" sub="Your setup, asked out loud — one call, Sarah on the line · every piece read back" pad="2px 0" />
        </Card>
      ))}

      {doses.length === 0 && anMeds.length === 0 ? (
        <V3EmptyShelf onAdd={() => ui.openPage("addMed")} />
      ) : (
        <div style={{ position: "relative" }}>
          {medsCelebrate && <Burst />}
          <MedsPointerCard doses={doses} groups={groups} doseLog={doseLog} anMeds={anMeds}
            doneCount={doneCount} openLog={openLog} onOpenRecord={() => ui.goTab("meds")} />
        </div>
      )}

      <V3DaysAhead period={period} ui={ui} needs={needs} />
    </div>
  );
};

/* ------ dose logging (v10.3) — Log by exact time, Logged by record --- */
/* The Log list has one tinted card per scheduled TIME, meds listed     */
/* vertically inside (scales to any count). Logged is a separate trail  */
/* of record-events ("9:41 AM · Just now"), each reviewable in a sheet. */
/* One progress ring lives in the Today header — nowhere else.          */

const MiniAvatar = ({ look, size = 26 }) => {
  const col = medColor(look?.color);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: col[2],
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <MedShape shape={look?.shape} color={col[1]} size={size * 0.68} />
    </div>
  );
};

const PendingTimeCard = ({ g, doseLog, onClick }) => {
  const items = g.items.filter((d) => !doseLog[d.id]);
  const overdue = items.some((d) => d.overdue);
  if (items.length === 0) return null;
  const shown = items.length > 4 ? items.slice(0, 3) : items;
  return (
    <Card onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{g.time}</span>
        <span style={{ fontSize: 13.5, color: C.ter }}>{g.daypart}</span>
        {overdue && (
          <span style={{ fontSize: 12, fontWeight: 700, color: C.orangeInk, background: C.orangeSoft,
            borderRadius: 99, padding: "3px 9px" }}>overdue</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "8px 16px",
          fontSize: 15, fontWeight: 700 }}>
          Log
        </span>
      </div>
      {shown.map((d) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4.5px 0" }}>
          <MiniAvatar look={d.look || MED_LOOKS[d.name]} size={28} />
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>{shortMedName(d.name)}</span>
        </div>
      ))}
      {items.length > 4 && (
        <div style={{ fontSize: 14, color: C.ter, padding: "5px 0 0 38px" }}>
          + {items.length - 3} more — tap to see all
        </div>
      )}
    </Card>
  );
};

const AllLoggedBanner = () => (
  <div style={{ background: "linear-gradient(100deg, #34C759, #23934B)", borderRadius: 14,
    padding: "14px 16px", display: "flex", alignItems: "center", gap: 11 }}>
    <span style={{ width: 28, height: 28, borderRadius: 99, background: "rgba(255,255,255,.25)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Icon d={icons.check} size={15} sw={3} />
    </span>
    <span style={{ fontSize: 15.5, fontWeight: 700, color: "#fff" }}>
      All scheduled medications logged today
    </span>
  </div>
);

const AsNeededRow = ({ onClick }) => (
  <Card onClick={onClick}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>As-needed medications</span>
      <div style={{ flex: 1 }} />
      <span style={{ background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "8px 16px",
        fontSize: 15, fontWeight: 700 }}>
        Log
      </span>
    </div>
  </Card>
);

const EventBlock = ({ ev, onClick }) => (
  <div className="tap" onClick={onClick} role="button" style={{ padding: "10px 2px", cursor: "pointer" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 15.5, fontWeight: 700 }}>{ev.time}</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 13.5, color: C.ter }}>{ev.rel}</span>
      <Icon d={icons.chevron} size={13} color={C.ter} sw={2.2} />
    </div>
    <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 4 }}>
      {ev.items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {it.status === "taken"
            ? <Icon d={icons.check} size={14} sw={3} color={C.green} />
            : <Icon d={icons.close} size={13} sw={3} color={C.ter} />}
          <span style={{ fontSize: 14.5, color: C.sub }}>
            {shortMedName(it.name)}{it.status === "skipped" ? " (Skipped)" : ""}{it.an ? " · as needed" : ""}
          </span>
        </div>
      ))}
    </div>
  </div>
);

/* the Log area shared by Today and Meds — a stack of separate white    */
/* cards (med colors never fight a tinted wash), then the Logged trail  */
const DoseLogPanel = ({ doses, groups, doseLog, anMeds, logEvents, openLog }) => {
  const pending = groups.filter((g) => g.items.some((d) => !doseLog[d.id]));
  return (
    <>
      {doses.length > 0 && pending.length === 0 && <AllLoggedBanner />}
      {pending.map((g) => (
        <PendingTimeCard key={g.key} g={g} doseLog={doseLog} onClick={() => openLog(`time:${g.key}`)} />
      ))}
      {anMeds.length > 0 && <AsNeededRow onClick={() => openLog("asneeded")} />}
      {logEvents.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
            color: C.sub, margin: "6px 6px -2px" }}>
            Logged
          </div>
          <Card>
            {logEvents.map((ev, i) => (
              <div key={ev.time}>
                {i > 0 && <FullDivider />}
                <EventBlock ev={ev} onClick={() => openLog(`event:${ev.time}`)} />
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
};

/* the drawer: log a moment, review a record, or take an as-needed ----- */

const StatusBtn = ({ label, on, kind, onClick }) => (
  <button className="tap" onClick={onClick} style={{ flex: 1, minHeight: 46, border: "none",
    borderRadius: 11, fontSize: 15.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
    background: on ? (kind === "taken" ? C.green : "#8E8E93") : C.track,
    color: on ? "#fff" : kind === "taken" ? C.greenInk : C.sub }}>
    {on && <Icon d={kind === "taken" ? icons.check : icons.close} size={14} sw={3} />}
    {label}
  </button>
);

const MedStatusCard = ({ d, st, onSet }) => {
  const look = d.look || MED_LOOKS[d.name];
  const col = medColor(look?.color);
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: col[2],
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MedShape shape={look?.shape} color={col[1]} size={27} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 600 }}>{d.name}</div>
          <div style={{ fontSize: 14, color: st ? (st.status === "taken" ? C.greenInk : C.sub) : C.sub }}>
            {st ? `${st.status === "taken" ? "Taken" : "Skipped"} at ${st.time}` : d.time}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <StatusBtn label="Skipped" kind="skipped" on={st?.status === "skipped"}
          onClick={() => onSet(st?.status === "skipped" ? null : "skipped")} />
        <StatusBtn label="Taken" kind="taken" on={st?.status === "taken"}
          onClick={() => onSet(st?.status === "taken" ? null : "taken")} />
      </div>
    </Card>
  );
};

const LogSheet = ({ mode, group, event, anMeds, anLog, doseLog, onLog, onLogAll, onLogAn, onClose }) => {
  const title =
    mode === "asneeded" ? "As needed"
    : mode === "event" ? `Recorded at ${event.time}`
    : `${group.time} · ${group.daypart}`;
  const unresolved = mode === "group" ? group.items.filter((d) => !doseLog[d.id]) : [];
  return (
    <Sheet title={title} onClose={onClose}>
      {mode === "asneeded" && (
        <>
          {anMeds.map((m) => {
            const times = anLog.filter((e) => e.name === m.name);
            return (
              <Card key={m.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <MiniAvatar look={m.look || MED_LOOKS[m.name]} size={42} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 14, color: times.length ? C.greenInk : C.sub }}>
                      {times.length === 0 ? "None today" : `Taken today: ${times.map((t) => t.time).join(", ")}`}
                    </div>
                  </div>
                </div>
                <BigButton tone="tinted" onClick={() => onLogAn(m)}>I took one — {NOW_TIME}</BigButton>
              </Card>
            );
          })}
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "4px 6px 10px" }}>
            Each dose is recorded with its time. Saying it in a check-in — "I took a Tylenol after
            lunch" — works exactly the same way.
          </div>
        </>
      )}

      {mode === "group" && (
        <>
          {unresolved.length >= 2 && (
            <div style={{ marginBottom: 12 }}>
              <BigButton onClick={onLogAll}>Log all {unresolved.length} as taken</BigButton>
            </div>
          )}
          {group.items.map((d) => (
            <MedStatusCard key={d.id} d={d} st={doseLog[d.id]}
              onSet={(status) => onLog(d.id, status)} />
          ))}
        </>
      )}

      {mode === "event" && (
        <>
          <div style={{ fontSize: 14.5, color: C.sub, padding: "0 4px 12px", lineHeight: 1.45 }}>
            What Recall recorded at {event.time} — tap a button if something needs changing.
          </div>
          {event.items.filter((it) => !it.an).map((it) => (
            <MedStatusCard key={it.id} d={it.d} st={doseLog[it.id]}
              onSet={(status) => onLog(it.id, status, event.time)} />
          ))}
          {event.items.filter((it) => it.an).map((it, i) => (
            <Card key={`an-${i}`} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MiniAvatar look={it.look || MED_LOOKS[it.name]} size={42} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16.5, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 14, color: C.greenInk }}>Taken as needed at {event.time}</div>
                </div>
                <Icon d={icons.check} size={18} sw={2.8} color={C.green} />
              </div>
            </Card>
          ))}
        </>
      )}

      <div style={{ marginTop: 6 }}>
        <BigButton tone={mode === "group" && unresolved.length === 0 ? "blue" : "ghost"} onClick={onClose}>
          Done
        </BigButton>
      </div>
    </Sheet>
  );
};

/* ------------------------ journal screen --------------------------- */

/* the diary's unit of trust is the DAY — a small calendar block carries
   the chronology so the words can carry the day */
const DateBlock = ({ w, n, today }) => (
  <div style={{ width: 42, height: 46, borderRadius: 11, flexShrink: 0,
    background: today ? C.blueSoft : C.track,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
      color: today ? C.blue : C.ter }}>{w}</span>
    <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1,
      color: today ? C.blue : C.sub }}>{n}</span>
  </div>
);

/* a tag is a DOOR — it appears when a mention carries data (a followed
   topic, a medication) and opens that thing's own page */
const TagChip = ({ icon, color, label, onClick }) => (
  <button className="tap" onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
    style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none",
      background: C.track, color: C.sub, borderRadius: 99, padding: "7px 12px",
      fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
    <span style={{ display: "flex", color }}><Icon d={icon} size={13} sw={2} /></span>
    {label}
  </button>
);

const topicStateChip = (state) => {
  const map = {
    active: { label: "Active", bg: C.greenSoft, fg: C.greenInk },
    waiting: { label: "Waiting", bg: C.blueSoft, fg: C.blue },
    paused: { label: "Paused", bg: C.track, fg: C.sub },
    settled: { label: "Settled", bg: C.track, fg: C.sub },
  };
  const s = map[state] || map.active;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
      background: s.bg, color: s.fg, flexShrink: 0 }}>{s.label}</span>
  );
};

/* every kept day keeps its talk — "The conversation behind it" opens on
   past pages too, because provenance that expires was never provenance.
   A check-in is a few MINUTES of talk, so the fold has to read like
   minutes: greeting, the night, the pills, the day's own thread, a meal
   or a mood, the anything-else, the close. Notable days carry a full
   conversation, a written entry (prose after her quote), and a covered
   line in the same six words as "What today covered." The rest get an
   honest short shape. Keyed by weekday+date. */
const PAST_DAYS = {
  Wed12: {
    cov: "5 of 6 — meds, sleep, the knee, the walk & meals",
    paras: [
      "Sarah came by mid-morning and the short walk turned into the long way to the park — about forty minutes, the knee quiet the whole stretch, no rail needed on the way back up.",
      "Seven hours' sleep behind it, both pills with breakfast, and lunch out of the good bowl with Sarah — the kind of day the knee's story wants more of.",
    ],
    talk: [
      ["Recall", "Morning, Amma. How was the night?"],
      ["Amma", "Seven hours, near enough. I woke once for water and went straight back."],
      ["Recall", "That's a good night. And the morning medications?"],
      ["Amma", "Both with breakfast. Toast and the last of the plum jam, if you're keeping notes."],
      ["Recall", "Both kept — jam noted for my own envy. What's the day been?"],
      ["Amma", "Sarah came by — we walked the long way to the park."],
      ["Recall", "The long way — that's the forty-minute loop. How did the knee take it?",
        "Asked because longer walks are the knee's own test — its topic watches exactly this."],
      ["Amma", "Fine the whole way. Not a word out of it. Even the slope by the bakery."],
      ["Recall", "Kept — another good walk for the knee's story. Did you two eat?"],
      ["Amma", "Soup at mine after. She stayed for tea and we put the world right."],
      ["Recall", "A proper visit, then. How are you feeling as the day settles?"],
      ["Amma", "Bright. Days with Sarah do that."],
      ["Recall", "Anything else you want kept before I close it?"],
      ["Amma", "No — that's the day. A good one."],
      ["Recall", "Then it's all here, in your words. Talk tomorrow, Amma."],
    ],
  },
  Tue4: {
    cov: "4 of 6 — meds, sleep, meals & mood",
    paras: [
      "The evening Metformin didn't happen — asleep in the chair by eight, and the day is kept saying exactly that. The morning dose went fine, with breakfast.",
      "A flat, tired day behind it: short sleep the night before, a small lunch, no walk. One missed evening is a fact, not a fault — and it's the fact the week's picture will carry.",
    ],
    talk: [
      ["Recall", "Evening, Amma. We didn't finish this morning — how has the day been?"],
      ["Amma", "Long. I didn't sleep much last night, and it showed all day."],
      ["Recall", "How much sleep, roughly?"],
      ["Amma", "Five hours, maybe less. And I only picked at lunch."],
      ["Recall", "Kept — the short night and the small lunch. The morning Metformin happened, I have it with breakfast. And the evening one?"],
      ["Amma", "No — I fell asleep in the chair and missed it. I'll say it plainly."],
      ["Recall", "Said plainly and kept that way. One missed evening is a fact, not a fault — it goes on the medication's own week, nowhere louder.",
        "A missed dose never nags — it records. The pattern matters, not the day."],
      ["Amma", "Good. I don't need a scolding, I need my chair."],
      ["Recall", "No scolding here. How's the mood, under the tiredness?"],
      ["Amma", "Fine, just worn. Tomorrow will be better for a real night."],
      ["Recall", "Anything else before I close the day?"],
      ["Amma", "No. Bed, I think."],
      ["Recall", "Then sleep well, Amma. It's all kept — the honest version."],
    ],
  },
  Thu6: {
    cov: "5 of 6 — meds, sleep, the stairs, the dizziness & meals",
    paras: [
      "The stairs went easier again — rail held, no stop halfway, second week running they've been kinder. But standing up from the chair after breakfast the room swam for a moment; it passed in a breath and didn't come back.",
      "Six and a half hours' sleep, both pills with breakfast, porridge. The dizzy moment is kept as its own note — with the time — and it's the reason mornings now get a quiet daily question.",
    ],
    talk: [
      ["Recall", "Morning, Amma. How were the stairs today?"],
      ["Amma", "Easier — properly easier. I didn't stop at the landing."],
      ["Recall", "Second week the stairs have been kinder. And the night?"],
      ["Amma", "Six and a half hours. Not bad."],
      ["Recall", "Kept. The morning pills?"],
      ["Amma", "Both with breakfast. Porridge, before you ask."],
      ["Recall", "Noted, porridge and all. Anything else about the morning?"],
      ["Amma", "One thing — I went a little dizzy standing up from the chair. Just for a moment."],
      ["Recall", "Thank you for saying it. When exactly, and did it come back?",
        "A moment of dizziness on standing gets a when and a how-long — that's what makes it usable to a doctor."],
      ["Amma", "Right after breakfast. It passed in a breath and stayed away."],
      ["Recall", "Kept as its own note, with the time. If a morning ever feels frightening — the room won't settle — 8‑1‑1 reaches a nurse any hour, and 9‑1‑1 is for right now."],
      ["Amma", "I know the numbers. It was only a moment."],
      ["Recall", "Then that's how it's written — a moment, passed. Anything else for the day?"],
      ["Amma", "No, that's it."],
      ["Recall", "All kept, Amma. I'll ask after the mornings for a while — gently."],
    ],
  },
  Fri7: {
    cov: "5 of 6 — meds, sleep, movement, meals & mood",
    paras: [
      "Eight hours — the best night of the week, and the earlier bedtime gets the credit. The morning ran on it: both pills with breakfast, a proper appetite, the short loop walked before lunch.",
      "Third good night in a row now. The sleep story has a shape worth keeping.",
    ],
    talk: [
      ["Recall", "Morning, Amma. How was the night?"],
      ["Amma", "Eight hours. Best all week — the earlier bedtime is working."],
      ["Recall", "Three good nights running now. How do you feel on the back of it?"],
      ["Amma", "Like myself. I even wanted breakfast, which isn't every day."],
      ["Recall", "Kept — the appetite too. The pills went with it?"],
      ["Amma", "Both, with eggs no less."],
      ["Recall", "A feast. Any movement planned, or already done?"],
      ["Amma", "The short loop before lunch. Nothing heroic."],
      ["Recall", "The short loop counts the same as the long one here. Mood, one word?"],
      ["Amma", "Steady. Good, even."],
      ["Recall", "Anything else you want the day to remember?"],
      ["Amma", "That the bedtime trick works. Write that down twice."],
      ["Recall", "Written once, weighted twice. Sleep well again tonight, Amma."],
    ],
  },
  Wed29: {
    cov: "5 of 6 — meds, sleep, the knee, movement & meals",
    paras: [
      "The knee kept to mild all day — a word of it on the stairs first thing, gone by the kettle. Seven hours' sleep behind it, both pills with breakfast.",
      "A short walk in the afternoon between showers, soup for lunch. The knee's quiet day joins its story alongside the loud ones — that's what makes the pattern honest.",
    ],
    talk: [
      ["Recall", "Morning, Amma. Knee first — how is it?"],
      ["Amma", "Mild today. It had one word on the stairs and then let it go."],
      ["Recall", "Kept — a quiet day for it. And the night?"],
      ["Amma", "About seven hours. I'll take that."],
      ["Recall", "So will the week. Morning pills?"],
      ["Amma", "Both with breakfast, same as always."],
      ["Recall", "Any walking today, with the rain about?"],
      ["Amma", "A short one between showers. Enough to say I went."],
      ["Recall", "It counts. Lunch happen?"],
      ["Amma", "Soup. The good kind, not the tin."],
      ["Recall", "Noted with respect. Anything else for the day?"],
      ["Amma", "No — a plain day. Keep it anyway."],
      ["Recall", "Plain days are the spine of the story, Amma. Kept."],
    ],
  },
  Tue28: {
    cov: "4 of 6 — sleep, the knee, the walk & meds",
    paras: [
      "The long loop, on purpose — and the knee held up the whole way, even the slope, even the last stretch home. That's the test it kept failing in June, passed.",
      "Six and a half hours' sleep, both pills on time. The knee-after-walks story gets its best day yet to stand on.",
    ],
    talk: [
      ["Recall", "You mentioned wanting a longer walk — did it happen?"],
      ["Amma", "It did. The long loop, and the knee held up the whole way."],
      ["Recall", "The whole loop — slope included?",
        "The slope is where the knee complained in June; asking it by name is what makes today comparable."],
      ["Amma", "Slope included. I won't say it was nothing, but it wasn't a complaint."],
      ["Recall", "Kept exactly like that. How was the night before it?"],
      ["Amma", "Six and a half hours. Enough."],
      ["Recall", "And the pills?"],
      ["Amma", "Both, with breakfast, before the walk."],
      ["Recall", "So the day ran: sleep, pills, the long loop, a knee that held. Anything it should also remember?"],
      ["Amma", "That I was pleased with myself. That's allowed, isn't it?"],
      ["Recall", "It's required, Amma. Kept — the walk and the pride both."],
    ],
  },
  Fri24: {
    cov: "4 of 6 — meds, sleep, mood & the visit",
    paras: [
      "Dr. Patel this morning — in nervous, out lighter. The lab-results question got asked out loud, off the list, and answered: the numbers are steady, the vitamin D low, a recheck in the autumn.",
      "Both pills early so they were done before the clinic. The visit sits in your history with the recording; the day is kept the way it felt — a small brave thing, done.",
    ],
    talk: [
      ["Recall", "It's Dr. Patel this morning. How are you going in?"],
      ["Amma", "A bit nervous. I always am, and it always turns out fine."],
      ["Recall", "Your question list is on his page — the lab results on top. Did you sleep?"],
      ["Amma", "Six hours, nerves included."],
      ["Recall", "Kept. Pills before you go?"],
      ["Amma", "Took them early, with tea, so they're done."],
      ["Recall", "Good. I'll be quiet now — the visit is yours. Tell me how it went after."],
      ["Amma", "I'm back. And I asked him about my lab results — I actually asked."],
      ["Recall", "You did — off your own list. What did he say?"],
      ["Amma", "Steady numbers, low vitamin D, check again in the autumn. He was pleased, mostly."],
      ["Recall", "All of it kept, and the visit's in your history with the recording. How do you feel now it's done?"],
      ["Amma", "Lighter. It's always lighter for having asked."],
      ["Recall", "That's the whole trick, Amma. Kept — the answer and the lightness."],
    ],
  },
  Sun26: {
    cov: "4 of 6 — sleep, movement, meals & mood",
    paras: [
      "A poor night — up twice, awake between — and the walk was the first casualty of it. The day is kept saying so, without dressing it up.",
      "Meals were small, the mood flat but honest. Hard days belong in the story at full weight; they're half of what makes the good ones legible.",
    ],
    talk: [
      ["Recall", "Morning, Amma. How was the night?"],
      ["Amma", "Poor. Up twice, and awake in between for too long."],
      ["Recall", "How many hours, would you say?"],
      ["Amma", "Five, in pieces."],
      ["Recall", "Kept as it was. And the walk?"],
      ["Amma", "I skipped the walk — I'll just say it as it is."],
      ["Recall", "Said honestly and kept that way. A hard night is part of the story too. Did eating happen?"],
      ["Amma", "A little. Toast, soup later. Not my best table."],
      ["Recall", "Noted gently. Mood, one word?"],
      ["Amma", "Flat. Tomorrow can do better."],
      ["Recall", "Anything else to keep before I close it?"],
      ["Amma", "No. Just don't lose the honest version."],
      ["Recall", "Never, Amma — the honest version is the only one I keep."],
    ],
  },
  Tue21: {
    cov: "3 of 6 — meds, the knee & meals",
    paras: [
      "The first entry there is: a little stiffness first thing that let go by breakfast, both pills taken with it.",
      "The diary starts small on purpose — one true morning, kept in your own words. Everything after builds on days shaped like this one.",
    ],
    talk: [
      ["Recall", "This is your first one, Amma — how has the morning been?"],
      ["Amma", "A little stiff first thing, fine after. Both pills with breakfast."],
      ["Recall", "Then that's your first entry — the stiffness that let go, breakfast, both pills. Anything else worth keeping?"],
      ["Amma", "Not today. Let's see how this goes."],
      ["Recall", "Kept, in your words — your diary starts today. Tomorrow I'll know what to ask."],
    ],
  },
};
const pastDayFor = (e) => PAST_DAYS[`${e.w}${e.n}`] || {
  talk: [
    ["Recall", "Morning, Amma. How was the night?"],
    ["Amma", "Fair enough. Nothing to write home about."],
    ["Recall", "Kept. The morning pills?"],
    ["Amma", "With breakfast, both."],
    ["Recall", "And the day itself?"],
    ["Amma", e.said + "."],
    ["Recall", "Anything else worth keeping?"],
    ["Amma", "No — that's the day."],
    ["Recall", "Kept, word for word — that's the day's entry."],
  ],
};

/* tag → door resolver, shared by the journal tab and the archive */
const entryTagFor = (period, followed, ui) => ([kind, label]) =>
  kind === "topic"
    ? { icon: icons.topic, color: C.orange, label,
        go: () => {
          const t = topicsFor(period, followed).find((x) => x.name === label || x.id === label);
          if (t) ui.openPage("topic", t);
        } }
    : { icon: icons.meds, color: C.green, label: label.split(" ")[0],
        go: () => ui.openPage("medDetail", { name: label }) };

/* one check-in, one row — date block · what was said (clamped) · when ·
   tags as doors. The same row serves the tab's recent list and the
   full archive. */
const EntryRow = ({ e, tagFor, onOpen }) => (
  <div className="tap" onClick={onOpen}
    style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 2px",
      cursor: onOpen ? "pointer" : "default" }}>
    <DateBlock w={e.w} n={e.n} today={e.today} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* what was said leads, and long days ellipsize — the row is a
            doorway, the entry page holds the rest */}
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.4,
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
          overflow: "hidden" }}>{e.said}</div>
        {e.pill && (
          <span className={e.kind === "processing" ? "blink" : ""} style={{
            fontSize: 12.5, fontWeight: 600, padding: "4px 9px", borderRadius: 99, flexShrink: 0,
            background: e.kind === "processing" ? C.blueSoft : C.orangeSoft,
            color: e.kind === "processing" ? C.blue : C.orangeInk }}>
            {e.pill}
          </span>
        )}
      </div>
      {e.when && (
        <div style={{ fontSize: 12.5, color: C.ter, marginTop: 3 }}>{e.when}</div>
      )}
      {e.tags && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {e.tags.map((tg) => {
            const t = tagFor(tg);
            return <TagChip key={tg[1]} icon={t.icon} color={t.color} label={t.label} onClick={t.go} />;
          })}
        </div>
      )}
    </div>
    {!e.pill && (
      <span style={{ display: "flex", color: C.ter, paddingTop: 14, flexShrink: 0 }}>
        <Icon d={icons.chevron} size={14} sw={2.2} />
      </span>
    )}
  </div>
);

/* the archive behind "See all" — every kept day, month by month. The
   tab shows the recent few because the tab is a hub (insight and topic
   doors above the diary); the archive is where the diary's full
   length belongs, with month headers a dump-list can't have. */
/* One July, told once: every period's archive shows the same days with
   the same words, sliced at that period's today. The diary is born
   July 21 (the setup call); July 23 is simply missing — an honest gap,
   never back-filled. Tags appear only where that period's topicsFor
   can answer the door. */
const JULY_CANON = [
  { w: "Fri", n: 31, said: "Saw Dr. Chen — recorded it; lighter for having asked", kind: "done" },
  { w: "Thu", n: 30, said: "Slept well, ready for tomorrow", kind: "done" },
  { w: "Wed", n: 29, said: "Knee pain mild · slept 7 hours", kind: "done",
    tags: [["topic", "The knee after walks"], ["topic", "Sleep"]] },
  { w: "Tue", n: 28, said: "A longer walk — the knee held up", kind: "done",
    tags: [["topic", "The knee after walks"]] },
  { w: "Mon", n: 27, said: "Walked 20 minutes · the knee better", kind: "done",
    tags: [["topic", "The knee after walks"]] },
  { w: "Sun", n: 26, said: "Slept poorly, skipped the walk — said so honestly", kind: "done" },
  { w: "Sat", n: 25, said: "A quiet day, kept anyway", kind: "done" },
  { w: "Fri", n: 24, said: "Saw Dr. Patel — asked him about my lab results", kind: "done" },
  { w: "Wed", n: 22, said: "Tried the stairs twice — steady both times", kind: "done" },
  { w: "Tue", n: 21, said: "First entry — a little stiff, both pills with breakfast", kind: "done" },
];
/* slice the canon at a day-of-month, optionally stripping tags whose
   topic a period doesn't seed (a chip must never open onto nothing) */
const julyFrom = (day, dropTags = []) =>
  JULY_CANON.filter((r) => r.n < day).map((r) => {
    if (!r.tags) return r;
    const tags = r.tags.filter(([, label]) => !dropTags.includes(label));
    return tags.length ? { ...r, tags } : { ...r, tags: undefined };
  });
const ALL_CHECKINS = {
  day1: [{ m: "July", rows: [
    { w: "Tue", n: 21, today: true, said: "A little stiff first thing, fine after — both pills with breakfast",
      when: "From your setup call", pill: "In progress", kind: "progress" },
  ]}],
  week1: [{ m: "July", rows: julyFrom(28, ["Sleep"]) }],
  week2: [
    { m: "July", rows: [
      { w: "Thu", n: 30, today: true, said: "Moving and how you're feeling still open", pill: "In progress", kind: "progress" },
      ...julyFrom(30),
    ]},
  ],
  visitday: [
    { m: "July", rows: [
      { w: "Fri", n: 31, today: true, said: "Quick note before Dr. Chen", pill: "In progress", kind: "progress" },
      ...julyFrom(31, ["Sleep"]),
    ]},
  ],
  month1: [
    { m: "August", rows: [
      { w: "Thu", n: 13, today: true, said: "The stairs, both pills, a good night — slept eight hours",
        when: "Written at 9:05 AM", kind: "done",
        tags: [["topic", "The knee after walks"], ["med", "Metformin 500 mg"]] },
      { w: "Wed", n: 12, said: "Walked with Sarah, knee fine", kind: "done",
        tags: [["topic", "The knee after walks"]] },
      { w: "Tue", n: 11, said: "A quiet day, kept anyway", kind: "done" },
      { w: "Mon", n: 10, said: "Laundry day, and a good call with Priya", kind: "done" },
      { w: "Sun", n: 9, said: "Grandson called — a bright afternoon", kind: "done" },
      { w: "Sat", n: 8, said: "Longer walk than usual; the knee stayed quiet", kind: "done",
        tags: [["topic", "The knee after walks"]] },
      { w: "Fri", n: 7, said: "Slept 8 hours — best week yet", kind: "done",
        tags: [["topic", "Sleep"]] },
      { w: "Thu", n: 6, said: "The stairs easier · a little dizzy standing up", kind: "done",
        tags: [["topic", "Morning dizziness"]] },
      { w: "Wed", n: 5, said: "A slow start, better by lunch", kind: "done" },
      { w: "Tue", n: 4, said: "Missed the evening pill, said so honestly", kind: "done",
        tags: [["med", "Metformin 500 mg"]] },
      { w: "Mon", n: 3, said: "Rain all day — stretches instead of the walk", kind: "done" },
      { w: "Sun", n: 2, said: "Denise visited; pills sorted for the week", kind: "done" },
      { w: "Sat", n: 1, said: "Market morning, good energy", kind: "done" },
    ]},
    { m: "July", rows: julyFrom(32) },
  ],
};
const allCheckinsTotal = (period) =>
  (ALL_CHECKINS[period] || []).reduce((n, g) => n + g.rows.length, 0);

const JournalScreen = ({ period, ui, finalizeStage, reopened, followed = [], topicStates = {}, obSelf }) => {
  const st = INSIGHT_STATE[period];
  const cfg = CHECKIN[period];
  const ctaLabel =
    cfg.mode === "progress" ? "Continue today's check-in"
    : cfg.mode === "new" ? "Start today's check-in"
    : cfg.mode === "visitday" ? "Check-in"
    : null;

  /* rows say what was said, never arithmetic — the date block carries
     the chronology, the words carry the day, and tags are the doors
     into the things the day touched (a topic's page, a med's page) */
  const tagFor = entryTagFor(period, followed, ui);
  let baseEntries =
    period === "day1"
      ? [{ w: "Tue", n: 21, today: true, said: "A little stiff first thing, fine after — both pills with breakfast",
          when: obSelf ? "From your setup · still open" : "From your setup call",
          pill: "In progress", kind: "progress" }]
      : period === "week1"
      ? [
          { w: "Mon", n: 27, said: "Walked 20 minutes · the knee better", kind: "done",
            tags: [["topic", "The knee after walks"]] },
          { w: "Sun", n: 26, said: "Slept poorly, skipped the walk — said so honestly", kind: "done" },
          { w: "Sat", n: 25, said: "A quiet day, kept anyway", kind: "done" },
        ]
      : period === "week2"
      ? [
          { w: "Thu", n: 30, today: true, said: "Moving and how you're feeling still open", pill: "In progress", kind: "progress" },
          { w: "Wed", n: 29, said: "Knee pain mild · slept 7 hours", kind: "done",
            tags: [["topic", "The knee after walks"], ["topic", "Sleep"]] },
          { w: "Tue", n: 28, said: "A longer walk — the knee held up", kind: "done",
            tags: [["topic", "The knee after walks"]] },
        ]
      : period === "visitday"
      ? [
          { w: "Fri", n: 31, today: true, said: "Quick note before Dr. Chen", pill: "In progress", kind: "progress" },
          { w: "Thu", n: 30, said: "Slept well, ready for tomorrow", kind: "done" },
        ]
      : [
          { w: "Thu", n: 13, today: true, said: "The stairs, both pills, a good night — slept eight hours",
            when: "Written at 9:05 AM", kind: "done",
            tags: [["topic", "The knee after walks"], ["med", "Metformin 500 mg"]] },
          { w: "Wed", n: 12, said: "Walked with Sarah, knee fine", kind: "done",
            tags: [["topic", "The knee after walks"]] },
          { w: "Fri", n: 7, said: "Slept 8 hours — best week yet", kind: "done",
            tags: [["topic", "Sleep"]] },
        ];

  const todayBlock = { day1: ["Tue", 21], week1: ["Tue", 28], week2: ["Thu", 30],
    visitday: ["Fri", 31], month1: ["Thu", 13] }[period];
  if (finalizeStage === "processing")
    baseEntries = [{ w: todayBlock[0], n: todayBlock[1], today: true,
      said: "Creating your entry from the transcript…", pill: "Processing", kind: "processing" },
      ...baseEntries.filter((e) => !e.today)];
  if (finalizeStage === "done") {
    /* the finished row leads with HER WORDS — the entry's own opening
       line, clamped with an ellipsis — never a status where every
       other row has content; "written just now" is the caption. Tags
       appear for what the day just followed (only doors that exist). */
    const followedTags = followed
      .map((id) => topicsFor(period, followed).find((t) => t.id === id))
      .filter(Boolean).map((t) => ["topic", t.name]);
    baseEntries = [{ w: todayBlock[0], n: todayBlock[1], today: true,
      said: FINALIZE_ENTRY[period] || FINALIZE_ENTRY.week2,
      when: reopened ? "Updated this evening — morning entry + tonight's note" : "Written just now",
      kind: "done",
      tags: followedTags.length ? followedTags : undefined },
      ...baseEntries.filter((e) => !e.today)];
  }

  /* ---- the topics stack: base objects + Amma's lifecycle overrides ---- */
  const topicRows = topicsFor(period, followed)
    .map((base) => ({ base, m: { ...base, ...(topicStates[base.id] || {}) } }))
    .filter(({ m }) => m.state !== "removed");
  const followedRows = topicRows.filter(({ m }) => m.state === "active" || m.state === "paused");
  const waitingRows = topicRows.filter(({ m }) => m.state === "waiting");
  /* the door's one-line glance: who's being followed, plus a quiet
     count of what waits. Ellipsized — the page holds the rest. */
  const doorSub = followedRows.length
    ? followedRows.map(({ m }) => m.name).join(", ")
      + (waitingRows.length ? ` · ${waitingRows.length} waiting` : "")
    : waitingRows.length
    ? `${waitingRows[0].m.name} — waiting`
    : "Settled stories, kept";

  return (
    <>
      {ctaLabel && !finalizeStage && (
        <div style={{ marginBottom: 4 }}>
          <BigButton tone="tinted" icon={<Icon d={icons.plus} size={19} sw={2.2} />} onClick={ui.openCheckin}>{ctaLabel}</BigButton>
        </div>
      )}

      {/* stacked, left-aligned — a label + its proof line. The old
          label-left/stats-right split wrapped into a ragged three-line
          stagger at large text; stacked lines wrap like prose instead.
          The counts are a proof, not a door — the doors they point at
          (insights, topics, visits) are the cards right below. */}
      <div style={{ padding: "10px 6px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: 99, background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: C.sub }}>Private to you</span>
        </div>
        {JOURNAL_STATS[period] && (
          <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, marginTop: 4, paddingLeft: 14 }}>
            So far: {JOURNAL_STATS[period]}
          </div>
        )}
      </div>

      {/* the pattern glyph, not a star — a star reads as "favorite"; an
          insight is a line that rose out of the days, and the finding
          cards already wear this glyph. Locked, the sub counts the real
          progress instead of teasing a date from nowhere. */}
      <Card tone={st.unlocked ? C.purpleSoft : undefined}
        onClick={() => ui.openPage(st.unlocked ? "insightsList" : "insightProgress")}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: st.unlocked ? C.card : C.purpleSoft, color: C.purple,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.pattern} size={22} sw={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700 }}>
              {st.unlocked ? `${st.unlocked} weekly insight${st.unlocked > 1 ? "s" : ""}` : "Weekly insights"}
            </div>
            <div style={{ fontSize: 14, color: st.unlocked ? C.purpleInk : C.sub, lineHeight: 1.35 }}>
              {st.unlocked
                ? `Latest: "${INSIGHTS[st.unlocked === 1 ? 3 : 0][1]}"`
                : `${Math.min(st.filled, 5)} of 5 check-ins in — the first opens Saturday morning`}
            </div>
          </div>
          <Icon d={icons.chevron} size={16} color={st.unlocked ? C.purpleInk : C.ter} sw={2.2} />
        </div>
      </Card>

      {/* Topics are a DOOR, not a mode — the glance lives here, the
          manage surface lives behind it. No topics yet → no door: the
          concept introduces itself at the first proposal, never as an
          empty shelf to wonder about. */}
      {topicRows.length > 0 && (
        <Card style={{ marginTop: 10 }} onClick={() => ui.openPage("topicsList")}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: C.orangeSoft, color: C.orange,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.topic} size={22} sw={1.7} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                Topics{followedRows.length > 0 ? ` · ${followedRows.length}` : ""}
              </div>
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.35, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {doorSub}
              </div>
            </div>
            <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
          </div>
        </Card>
      )}

      <SectionLabel>Check-ins</SectionLabel>
      <Card>
        {baseEntries.map((e, i) => (
          <div key={e.w + e.n}>
            {i > 0 && <FullDivider />}
            <EntryRow e={e} tagFor={tagFor}
              onOpen={e.kind === "processing" ? undefined
                : () => ui.openPage("checkinDetail", { status: e.kind,
                    /* a past row opens ITS OWN day — today's page belongs
                       to today only. Recent rows share today's month. */
                    entry: e.today ? undefined
                      : { ...e, month: period === "month1" ? "August" : "July" } })} />
          </div>
        ))}
        {/* the fold exists only when there's an archive behind it — the
            tab is a hub (recent days + doors), the archive is the whole
            diary with month headers a dump-list can't have */}
        {allCheckinsTotal(period) > baseEntries.length && (
          <>
            <Divider />
            <div className="tap" onClick={() => ui.openPage("allCheckins")}
              style={{ textAlign: "center", padding: "14px 0 10px", cursor: "pointer" }}>
              <span style={{ fontSize: 15.5, fontWeight: 600, color: C.blue }}>
                See all {allCheckinsTotal(period)} check-ins
              </span>
            </div>
          </>
        )}
      </Card>
    </>
  );
};

/* the page behind the journal's Topics door — the manage surface.
   The tab used to be bimodal (an Entries|Topics segment): a mode makes
   the diary's location conditional on remembered state, and for this
   audience the diary's location must be absolute. A door subtracts
   nothing — glance on the door, decisions in here, housekeeping
   nowhere (Recall attaches mentions in the background). */
const TopicsListPage = ({ period, ui, followed = [], topicStates = {}, onBack }) => {
  const topicRows = topicsFor(period, followed)
    .map((base) => ({ base, m: { ...base, ...(topicStates[base.id] || {}) } }))
    .filter(({ m }) => m.state !== "removed");
  const followedRows = topicRows.filter(({ m }) => m.state === "active" || m.state === "paused");
  const waitingRows = topicRows.filter(({ m }) => m.state === "waiting");
  const settledRows = topicRows.filter(({ m }) => m.state === "settled");

  /* Back from a topic retraces to this list — `from` rides the page
     data the same way checkinDetail's does */
  const topicRow = ({ base, m }) => {
    const staleAsk = m.stale && !m.staleAnswered && m.state === "active";
    return (
      <div key={m.id} className="tap" onClick={() => ui.openPage("topic", { ...base, from: "topicsList" })}
        style={{ padding: "11px 2px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700, minWidth: 0 }}>{m.name}</div>
          {topicStateChip(m.state)}
        </div>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.4, marginTop: 3 }}>
          {m.state === "waiting" || m.state === "settled" ? m.line : <>You said: {m.latest}</>}
        </div>
        {staleAsk ? (
          <div style={{ fontSize: 13.5, fontWeight: 650, color: C.orangeInk, marginTop: 3 }}>
            {m.staleLine}
          </div>
        ) : m.meta && m.state === "active" ? (
          <div style={{ fontSize: 13, color: C.ter, marginTop: 3 }}>{m.meta}</div>
        ) : m.state === "paused" ? (
          <div style={{ fontSize: 13, color: C.ter, marginTop: 3 }}>
            Kept, quiet — new mentions still attach
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Page title="Topics" onBack={onBack}>
      <div style={{ paddingTop: 8 }}>
        {topicRows.length === 0 ? (
          <>
            {/* the empty state teaches in two sentences and promises zero
                setup; a ghost card previews the shape — recognition beats
                explanation */}
            <Card>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 12px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: C.orangeSoft,
                  color: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={icons.topic} size={22} />
                </div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, textAlign: "center" }}>Stories worth following</div>
              <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, marginTop: 8 }}>
                When something deserves following over time — a symptom, a recovery, a change — it
                becomes a topic: one place that connects every mention, photo and visit about it.
              </div>
              <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, marginTop: 8, paddingBottom: 4 }}>
                <b style={{ color: C.ink }}>Nothing to set up.</b> Recall notices what keeps coming up
                and asks — you decide what's followed.
              </div>
            </Card>
            <div style={{ border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: "13px 16px",
              marginTop: 10, opacity: 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, fontSize: 15.5, fontWeight: 700 }}>The knee after walks</div>
                {topicStateChip("active")}
              </div>
              <div style={{ fontSize: 13, color: C.ter, marginTop: 3 }}>
                Example — how a followed topic will look here
              </div>
            </div>
          </>
        ) : (
          <>
            {followedRows.length > 0 && (
              <>
                <SectionLabel>Being followed{followedRows.length > 1 ? ` · ${followedRows.length}` : ""}</SectionLabel>
                <Card>
                  {followedRows.map((r, i) => (
                    <div key={r.m.id}>{i > 0 && <FullDivider />}{topicRow(r)}</div>
                  ))}
                </Card>
              </>
            )}
            {waitingRows.length > 0 && (
              <>
                <SectionLabel>Waiting</SectionLabel>
                <Card>
                  {waitingRows.map((r, i) => (
                    <div key={r.m.id}>{i > 0 && <FullDivider />}{topicRow(r)}</div>
                  ))}
                </Card>
              </>
            )}
            {settledRows.length > 0 && (
              <>
                <SectionLabel>Settled</SectionLabel>
                <Card>
                  {settledRows.map((r, i) => (
                    <div key={r.m.id}>{i > 0 && <FullDivider />}{topicRow(r)}</div>
                  ))}
                </Card>
              </>
            )}
            <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0" }}>
              Recall proposes and attaches; only you follow, pause, resolve or reopen — always asked,
              never assumed. A quiet topic asks once, on its own page.
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

/* ------------------------ visits & docs ---------------------------- */

/* the visit a yes on the follow-up request drafts — October, date TBC */
const PATEL_OCT = { id: "patel-oct", title: "Dr. Patel · Vitamin D recheck", date: "October · date to confirm",
  briefLine: "Brief: starts building two weeks before",
  focus: "Recheck the vitamin D",
  focusBy: "Dr. Patel asked — at your July 24 visit, on the recording",
  patterns: [], questions: [], docs: [],
  note: "Approved by you — Recall will suggest concrete dates closer to October. Nothing is booked without your OK." };

const VisitsScreen = ({ period, ui, visitProc, eyeApproved, followupApproved, oseiMoved,
  customVisits = [], freshUpId }) => {
  const visits = VISITS[period];
  const past = PAST_VISITS[period] || [];
  /* a just-added visit arrives as a short skeleton that settles into
     its row — a beat of "Recall is setting it up," honest to a fast
     write (this is CRUD, not AI: 1.2 s, not a five-step pipeline).
     Custom rows join the SAME card as the canon list: upcoming is one
     list, and a second card implied a second category (and sat flush
     against the first — Seyon caught the seam). */
  const customRowEl = (hasPrev) => (v, i) => (
    <div key={v.id}>
      {(hasPrev || i > 0) && <Divider />}
      {v.id === freshUpId ? (
        <div style={{ padding: "13px 2px" }}>
          <div className="skel" style={{ height: 13, width: "52%", marginBottom: 8 }} />
          <div className="skel" style={{ height: 10, width: "74%" }} />
        </div>
      ) : (
        <div className="fadeMsg">
          <Row leading={<Icon d={icons.visits} size={21} />} title={v.title}
            sub={`${v.date} · ${v.briefLine}`} onClick={() => ui.openVisit(v)} />
        </div>
      )}
    </div>
  );
  return (
    <>
      <div style={{ marginBottom: 4 }}>
        <BigButton tone="tinted" icon={<Icon d={icons.plus} size={19} sw={2.2} />}
          onClick={() => ui.openSheet("addVisit")}>
          Add or record a visit
        </BigButton>
      </div>

      <SectionLabel>Upcoming</SectionLabel>
      {period === "visitday" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: C.blue, padding: 16, color: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, textTransform: "uppercase",
              letterSpacing: ".04em", marginBottom: 3 }}>
              Today · 10:15 AM
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Dr. Chen — Cardiology</div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <BigButton tone="white" small onClick={() => ui.openPage("briefReport")}>Read brief</BigButton>
              {visitProc != null ? (
                <BigButton tone="white" small
                  icon={<Icon d={icons.check} size={15} sw={2.6} />}
                  onClick={() => ui.openPage("pastVisit", FRESH_VISIT)}>
                  Recorded ✓
                </BigButton>
              ) : (
                <BigButton tone="red" small onClick={() => ui.openPage("record")}
                  icon={<span style={{ width: 9, height: 9, borderRadius: 99, background: "#fff" }} />}>
                  Record
                </BigButton>
              )}
            </div>
          </div>
        </Card>
      ) : visits.length ? (
        <Card>
          {visits.map((v, i) => {
            /* Sarah's suggested eye exam waits IN ITS OWN SLOT — a
               pending row in chronological order, not a banner and an
               accepted row saying two different things. Approving it in
               the request turns this row into the real visit. */
            const pendingEye = period === "month1" && v.id === "lam" && !eyeApproved;
            const isOsei = period === "month1" && v.id === "osei";
            const oseiDate = "August 28 · 10:30 AM";
            return (
              <div key={v.id}>
                {i > 0 && <Divider />}
                {pendingEye ? (
                  <PendingRow icon={icons.visits} title="Eye exam · Dr. Lam"
                    sub="September 3 · suggested by Sarah — nothing is booked without you"
                    onClick={() => ui.openRequest(needById("month1", "visit"))} />
                ) : (
                  <Row leading={<Icon d={icons.visits} size={21} />} title={v.title}
                    sub={period === "month1" && v.id === "lam"
                      ? `${v.date} · approved by you · ${v.briefLine}`
                      : isOsei && oseiMoved
                      ? `${oseiDate} · moved by you · ${v.briefLine}`
                      : `${v.date} · ${v.briefLine}`}
                    onClick={() => ui.openVisit(isOsei && oseiMoved ? { ...v, date: oseiDate } : v)} />
                )}
                {/* a request about an EXISTING visit rides on its row —
                    the visit stays the subject, the ask is a footnote */}
                {isOsei && !oseiMoved && (
                  <RowNotice text="Sarah suggests August 28 — she can't drive on the 21st · review"
                    onClick={() => ui.openRequest(needById("month1", "oseimove"))} />
                )}
              </div>
            );
          })}
          {/* Dr. Patel's October follow-up is a NEW visit, so it stands
              here — last in line, wearing the waiting state until a yes */}
          {period === "month1" && (
            <>
              <Divider />
              {followupApproved ? (
                <Row leading={<Icon d={icons.visits} size={21} />} title="Dr. Patel · Vitamin D recheck"
                  sub="October · approved by you — Recall suggests dates closer to time"
                  onClick={() => ui.openVisit(PATEL_OCT)} />
              ) : (
                <PendingRow icon={icons.visits} title="Follow-up · Dr. Patel"
                  sub="October · he asked at your July 24 visit"
                  onClick={() => ui.openRequest(needById("month1", "followup"))} />
              )}
            </>
          )}
          {customVisits.map(customRowEl(visits.length > 0 || period === "month1"))}
        </Card>
      ) : null}
      {period !== "visitday" && visits.length === 0 && customVisits.length > 0 && (
        <Card>{customVisits.map(customRowEl(false))}</Card>
      )}
      {period === "visitday" && customVisits.length > 0 && (
        <Card style={{ marginTop: 10 }}>{customVisits.map(customRowEl(false))}</Card>
      )}

      <SectionLabel>Past visits</SectionLabel>
      {typeof visitProc === "number" && (
        <VisitProcessingCard proc={visitProc}
          onOpen={() => ui.openPage("pastVisit", FRESH_VISIT)} />
      )}
      {past.length === 0 && visitProc == null ? (
        <EmptyHint>
          After each visit, the recording and a plain-language summary land here.
        </EmptyHint>
      ) : (past.length > 0 || visitProc === "done") && (
        <Card>
          {/* the finished card takes the row the processing card held —
              same spot, new state; the eye never has to hunt for it */}
          {visitProc === "done" && (
            <div className="fadeMsg">
              <Row leading={<Icon d={icons.play} size={19} />} leadingBg={C.greenSoft}
                leadColor={C.greenInk} title={FRESH_VISIT.title}
                sub="Today · 18 min · Ready ✓ — tap any word to hear it"
                onClick={() => ui.openPage("pastVisit", FRESH_VISIT)} />
            </div>
          )}
          {visitProc === "done" && past.length > 0 && <Divider />}
          {past.map((p, i) => (
            <div key={p.id}>
              {i > 0 && <Divider />}
              <Row leading={<Icon d={icons.play} size={19} />} title={p.title} sub={p.sub}
                onClick={() => ui.openPage("pastVisit", p)} />
            </div>
          ))}
        </Card>
      )}
    </>
  );
};

const DocsScreen = ({ period, ui, docStage }) => {
  const files = DOC_FILES[period];
  const hasContent = files.length > 0 || docStage;
  return (
    <>
      <div style={{ marginBottom: 4 }}>
        <BigButton tone="tinted" icon={<Icon d={icons.plus} size={19} sw={2.2} />}
          onClick={() => ui.openSheet("addDoc")}>
          Add a document
        </BigButton>
      </div>

      {(period === "week1" || period === "month1") && docStage !== "done" && (
        /* the asked-for card waits where the scanned card will appear —
           a pending row in the documents zone, not a banner. Once the
           scan lands, the wait is over and the section goes with it. */
        <>
          <SectionLabel>Waiting on you</SectionLabel>
          <Card>
            {period === "week1" ? (
              <PendingRow icon={icons.docs} title="Insurance card"
                sub="Sarah asked for it — scanning files it here and into Dr. Chen's brief"
                onClick={() => ui.openRequest(needById("week1", "ins"))} />
            ) : (
              <PendingRow icon={icons.docs} title="Dr. Osei's intake form"
                sub="Sarah asked for it — sign & scan, and it joins the August 21 brief"
                onClick={() => ui.openRequest(needById("month1", "intake"))} />
            )}
          </Card>
        </>
      )}

      {docStage === "processing" && <DocProcessingCard />}

      {!hasContent ? (
        <Card style={{ marginTop: 8 }}>
          <div style={{ textAlign: "center", padding: "26px 18px" }}>
            <div style={{ width: 62, height: 62, borderRadius: 20, background: C.blueSoft, color: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon d={icons.scan} size={28} />
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.01em" }}>Keep your papers in one place</div>
            <div style={{ fontSize: 15.5, color: C.sub, lineHeight: 1.5, margin: "8px 0 4px" }}>
              Scan with the camera or upload a file. Recall reads it, files it by type, explains it in plain
              language — and can translate it.
            </div>
          </div>
        </Card>
      ) : files.length === 0 && docStage !== "done" ? null : (
        <>
          <SectionLabel>{files.length + (docStage === "done" ? 1 : 0)} documents</SectionLabel>
          <Card>
            {docStage === "done" && (
              <>
                <Row leading={<Icon d={icons.flask} size={19} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
                  title={NEW_DOC.title} sub={NEW_DOC.sub}
                  onClick={() => ui.openPage("docDetail", NEW_DOC)} />
                {files.length > 0 && <Divider />}
              </>
            )}
            {files.map((f, i) => {
              const m = docMeta(f.id);
              return (
                <div key={f.id}>
                  {i > 0 && <Divider />}
                  <Row leading={<Icon d={icons[m.icon]} size={19} />} leadingBg={m.bg} leadColor={m.color}
                    title={f.title} sub={f.sub}
                    onClick={() => ui.openPage("docDetail", f)} />
                </div>
              );
            })}
            {files.length === 0 && docStage !== "done" && null}
          </Card>
        </>
      )}
    </>
  );
};

/* --------------------- medications screen -------------------------- */

const MedsScreen = ({ period, ui, doses, doseLog, anMeds, anLog, logEvents, openLog, medsCelebrate, customMeds, removeMed, showToast, metDoseUp, aspirinAdded }) => {
  const [dayIdx, setDayIdx] = useState(6);
  useEffect(() => setDayIdx(6), [period]);
  const week = WEEK_DAYS[period];
  const doneCount = doses.filter((d) => doseLog[d.id]?.status === "taken").length;
  const todayFrac = doses.length ? doneCount / doses.length : 0;
  const groups = groupDoses(doses);
  const wk = trailingWeek(period);
  const isToday = dayIdx === 6;

  const isEmpty = doses.length === 0 && customMeds.length === 0;
  return (
    <>
      {/* the top slot belongs to the tab's daily action: when meds exist,
          that's logging — Add moves to the cabinet's last row */}
      {isEmpty && (
        <div style={{ marginBottom: 4 }}>
          <BigButton tone="tinted" icon={<Icon d={icons.plus} size={19} sw={2.2} />}
            onClick={() => ui.openPage("addMed")}>
            Add a medication
          </BigButton>
        </div>
      )}

      {isEmpty ? (
        <Card style={{ marginTop: 8 }}>
          <div style={{ textAlign: "center", padding: "26px 18px" }}>
            <div style={{ width: 62, height: 62, borderRadius: 20, background: C.greenSoft, color: C.greenInk,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Icon d={icons.meds} size={28} />
            </div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.01em" }}>
              Medications, when you're ready
            </div>
            <div style={{ fontSize: 15.5, color: C.sub, lineHeight: 1.55, margin: "8px 0 4px" }}>
              You skipped this during setup — no problem. Easiest way: just mention them in any check-in
              ("I take metformin in the morning") and Recall will ask to save them here. Or add one above.
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* ONE spine: the week, with today as its selected day. Every
              day answers with a card below the strip — today's card is
              LIVE (the log), past days are records. The old layout gave
              today a section of its own and made the strip's Today
              button REMOVE the day card six other days produced. */}
          {(doses.length > 0 || anMeds.length > 0) && <>
          {doses.length > 0 && <>
          <SectionLabel>This week</SectionLabel>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {week.map((v, i) => {
                const frac = v === "today" ? todayFrac : v === null ? 0 : v;
                const sel = dayIdx === i;
                const empty = v === null;
                return (
                  <button key={i} className="tap" onClick={() => !empty && setDayIdx(i)}
                    aria-label={`View ${i === 6 ? "today" : "day"}`}
                    style={{
                      border: "none", background: sel && !isToday ? C.blueSoft : "transparent",
                      borderRadius: 12, padding: "7px 2px 5px", cursor: empty ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      opacity: empty ? 0.4 : 1, fontFamily: FONT, flex: 1, minWidth: 0,
                    }}>
                    <DoseRing frac={frac} size={30} sw={3.5} muted={empty} />
                    <span style={{ fontSize: 13, fontWeight: sel && !isToday ? 700 : 400,
                      color: sel && !isToday ? C.blue : C.sub }}>
                      {i === 6 ? "Today" : wk[i].letter}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: C.ter, padding: "8px 4px 0" }}>
              {isToday ? "Today is live below — tap a past day to see its record."
                : "A record of that day — tap Today to get back to logging."}
            </div>
          </Card>
          </>}

          {isToday || doses.length === 0 ? (
            <>
              <SectionLabel>{doses.length > 0 ? `Today · ${doneCount} of ${doses.length} taken` : "Today"}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
                {medsCelebrate && <Burst />}
                <DoseLogPanel doses={doses} groups={groups} doseLog={doseLog} anMeds={anMeds}
                  logEvents={logEvents} openLog={openLog} />
              </div>
            </>
          ) : (
            <div style={{ marginTop: 8 }}>
            <Card style={{ position: "relative" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.sub, padding: "0 2px 4px" }}>
                {`${wk[dayIdx].name}, ${wk[dayIdx].date} · ${PAST_DAY_DOSES.filter((d) => d.taken).length} of ${PAST_DAY_DOSES.length} taken`}
              </div>
              {PAST_DAY_DOSES.map((d, i) => (
                  <div key={i}>
                    {i > 0 && <Divider />}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 99, flexShrink: 0,
                        border: d.taken ? "none" : `2px solid ${C.red}`,
                        background: d.taken ? C.green : C.track, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {d.taken && <Icon d={icons.check} size={17} sw={3} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: d.taken ? C.ter : C.ink,
                          textDecoration: d.taken ? "line-through" : "none", textDecorationThickness: 1.5 }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: 14, color: d.taken ? C.ter : C.red }}>{d.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              <div style={{ fontSize: 13.5, color: C.ter, padding: "10px 2px 2px" }}>
                Past days are a record — only today can be crossed off. Missed doses show in red, never judged.
              </div>
            </Card>
            </div>
          )}
          </>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 6px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", color: C.sub }}>
              Your cabinet
            </span>
            <button className="tap" onClick={() => ui.openSheet("editCabinet")}
              style={{ border: "none", background: "none", color: C.blue, fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, padding: "12px 4px 12px 14px", margin: "-12px -4px" }}>
              Edit
            </button>
          </div>
          <Card>
            {customMeds.map((m, i) => {
              const col = medColor(m.look.color);
              return (
                <div key={m.id}>
                  {i > 0 && <Divider />}
                  <Row leading={<MedShape shape={m.look.shape} color={col[1]} size={27} />} leadingBg={col[2]}
                    title={`${m.name} ${m.dose}`} sub={`${m.when} · added by you just now`}
                    onClick={() => ui.openPage("medDetail", { name: `${m.name} ${m.dose}`, custom: m })} />
                </div>
              );
            })}
            {CABINET_BASE(period).map((name, i) => {
              const display = metDoseUp && name === "Metformin 500 mg" ? "Metformin 850 mg" : name;
              const look = MED_LOOKS[name];
              const col = medColor(look.color);
              return (
                <div key={name}>
                  {(i > 0 || customMeds.length > 0) && <Divider />}
                  <Row leading={<MedShape shape={look.shape} color={col[1]} size={27} />} leadingBg={col[2]}
                    title={display}
                    sub={display !== name ? `${MED_DETAILS[display].schedule} · updated by you today`
                      : MED_DETAILS[name].schedule}
                    onClick={() => ui.openPage("medDetail", { name: display })} />
                  {/* an applied change wears its notice ON the med it
                      changed — undoable from the request, never a banner */}
                  {period === "month1" && name.startsWith("Lisinopril") && (
                    <RowNotice text="Moved by Denise yesterday — keep it, or undo"
                      onClick={() => ui.openRequest(needById("month1", "denise"))} />
                  )}
                  {/* a WAITING change rides the same rail — the request
                      stands on the med whose record it would change */}
                  {period === "month1" && name.startsWith("Metformin") && !metDoseUp && (
                    <RowNotice text="Dose change waiting — Dr. Chen raised it to 850 mg · review"
                      onClick={() => ui.openRequest(needById("month1", "metdose"))} />
                  )}
                </div>
              );
            })}
            {/* a NEW med proposed from a visit stands where it would
                live — a pending row in the cabinet, real after her yes */}
            {period === "month1" && (
              <>
                <Divider />
                {aspirinAdded ? (
                  <Row leading={<MedShape shape="tablet" color={medColor("white")[1]} size={27} />}
                    leadingBg={medColor("white")[2]}
                    title="Aspirin 81 mg" sub="Every morning · added by you today, from Dr. Chen's visit"
                    onClick={() => ui.openPage("medDetail", { name: "Aspirin 81 mg" })} />
                ) : (
                  <PendingRow icon={icons.meds} title="Aspirin 81 mg"
                    sub="heard at Dr. Chen's July 31 visit — nothing is tracked until you agree"
                    onClick={() => ui.openRequest(needById("month1", "aspirin"))} />
                )}
              </>
            )}
            {(customMeds.length > 0 || CABINET_BASE(period).length > 0) && <Divider />}
            <Row leading={<Icon d={icons.plus} size={19} sw={2.4} />}
              title={<span style={{ color: C.blue }}>Add a medication</span>}
              sub="Search by name, or scan the bottle"
              onClick={() => ui.openPage("addMed")} />
          </Card>
        </>
      )}
    </>
  );
};

/* ---------------------------- pages -------------------------------- */

const Page = ({ title, onBack, children }) => (
  <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 25, background: C.bg,
    display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "center", padding: "14px 10px 8px", flexShrink: 0 }}>
      <button className="tap" onClick={onBack} aria-label="Back"
        style={{ border: "none", background: "none", color: C.blue, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 1, fontFamily: FONT,
          fontSize: 17, fontWeight: 600, padding: "11px 10px 11px 6px" }}>
        <Icon d={icons.back} size={22} sw={2.4} />Back
      </button>
      <div style={{ fontSize: 17.5, fontWeight: 700, flex: 1, textAlign: "center", paddingRight: 72 }}>{title}</div>
    </div>
    <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 16px 26px" }}>{children}</div>
  </div>
);

const Seg = ({ options, value, onChange }) => (
  <div style={{ display: "flex", background: C.track, borderRadius: 11, padding: 3 }}>
    {options.map((o) => (
      <button key={o} className="tap" onClick={() => onChange(o)}
        style={{ flex: 1, border: "none", borderRadius: 9, padding: "11px 8px", fontFamily: FONT,
          fontSize: 14.5, fontWeight: 600, cursor: "pointer",
          background: value === o ? C.card : "transparent",
          color: value === o ? C.ink : C.sub,
          boxShadow: value === o ? "0 1px 3px rgba(0,0,0,.12)" : "none" }}>
        {o}
      </button>
    ))}
  </div>
);

/* English ⇄ Français — origin language and mother tongue, one tap */
const LangToggle = ({ lang, setLang }) => (
  <button className="tap" onClick={() => setLang(lang === "en" ? "fr" : "en")}
    style={{ display: "flex", alignItems: "center", gap: 8, border: "none",
      background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "10px 15px",
      fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}>
    <Icon d={icons.globe} size={17} />{lang === "en" ? "Français" : "English"}
  </button>
);

const DocDetailPage = ({ doc, onBack, onSuggest }) => {
  const [seg, setSeg] = useState("Summary");
  const [lang, setLang] = useState("en");
  const [viewer, setViewer] = useState(false);
  const dd = docDetail(doc.id);
  return (
    <Page title="Document" onBack={onBack}>
      <div style={{ padding: "8px 4px 12px" }}>
        <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.015em" }}>{doc.title}</div>
        <div style={{ fontSize: 14.5, color: C.sub, marginTop: 3 }}>{doc.sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}><Seg options={["Summary", "Original"]} value={seg} onChange={setSeg} /></div>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {seg === "Summary" ? (
        <Card>
          <div style={{ fontSize: 16, lineHeight: 1.6 }}>
            {lang === "en" ? dd.summaryEn : dd.summaryFr}
          </div>
          <div style={{ fontSize: 13.5, color: C.ter, marginTop: 12 }}>
            {lang === "en"
              ? "Plain-language summary by Recall — the original never changes."
              : "Résumé en langage clair par Recall — l'original ne change jamais."}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 10 }}>
          <div className="tap" onClick={() => setViewer(true)} role="button" aria-label="Open full screen"
            style={{ position: "relative", cursor: "pointer", borderRadius: 10, overflow: "hidden",
              maxHeight: 330, boxShadow: "0 0 0 0.5px rgba(0,0,0,.1)" }}>
            <LabDoc />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90,
              background: "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.96))" }} />
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0,
              display: "flex", justifyContent: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(20,24,30,.85)", color: "#fff", borderRadius: 99,
                padding: "9px 15px", fontSize: 13.5, fontWeight: 600 }}>
                <Icon d={icons.expand} size={15} sw={2.2} />Open full screen
              </span>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: C.ter, padding: "10px 5px 2px", lineHeight: 1.45 }}>
            2 pages, scanned original — zoom lives in the full-screen view, where the page has room.
          </div>
        </Card>
      )}
      {viewer && <DocViewerOverlay title={doc.title} onClose={() => setViewer(false)} />}

      {dd.suggestion && (
        <>
          <SectionLabel>Recall noticed</SectionLabel>
          <Card tone={C.blueSoft}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <RecallOrb size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: C.blueDeep }}>{dd.suggestion.title}</div>
                <div style={{ fontSize: 14, color: C.blueSub }}>{dd.suggestion.sub}</div>
              </div>
              <BigButton small tone="white" onClick={onSuggest}>Add</BigButton>
            </div>
          </Card>
        </>
      )}
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
        {dd.usedIn ? `Used in: ${dd.usedIn}. ` : "Used in: nothing yet. "}
        Shared with: no one — documents stay private unless you share them.
      </div>
    </Page>
  );
};

/* ========== the recorded visit page — a record you can HEAR ========= */

/* word timing: each turn's words share its spoken window, weighted by
   length, at a natural speech pace (~16 chars/sec) — so a long silence
   after a turn never stretches its last word. Built once at module
   load; the page only reads it. */
const buildTimeline = (script) => {
  const items = [];
  script.forEach((s, i) => {
    if (s.gap) { items.push({ gap: 1, at: s.at, until: s.until, en: s.en, fr: s.fr }); return; }
    const next = script[i + 1];
    const hardEnd = next ? next.at : CHEN_DUR;
    const units = [];
    s.en.forEach((part) => {
      if (Array.isArray(part)) units.push({ txt: part[0], k: part[1], g: part[2] });
      else part.split(/\s+/).forEach((w) => { if (w) units.push({ txt: w }); });
    });
    const chars = units.reduce((a, u) => a + u.txt.length + 1, 0);
    const spoken = Math.min(hardEnd - 0.4 - s.at, Math.max(3, chars * 0.062));
    let acc = 0;
    units.forEach((u) => {
      u.start = s.at + (acc / chars) * spoken;
      acc += u.txt.length + 1;
      u.end = s.at + (acc / chars) * spoken;
    });
    items.push({ w: s.w, at: s.at, end: s.at + spoken, units, fr: s.fr });
  });
  return items;
};
const CHEN_TL = buildTimeline(CHEN_SCRIPT);
const TERM_COUNTS = (() => {
  const c = {};
  CHEN_TL.forEach((it) => !it.gap && it.units.forEach((u) => { if (u.k) c[u.k] = (c[u.k] || 0) + 1; }));
  return c;
})();

/* ±15s — the elderly-friendly numbers; scrubbing is fiddly, "say that
   again" is one tap. The arc carries its own number. */
const SkipIcon = ({ fwd }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ transform: fwd ? "scaleX(-1)" : "none" }}>
    <path d="M13 3.5a9.5 9.5 0 1 1-9.2 7.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M3.2 4.4l.5 6.4 6-2.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <text x="13" y="16.6" textAnchor="middle" fontSize="8.4" fontWeight="700" fill="currentColor"
      style={{ transform: fwd ? "scaleX(-1)" : "none", transformOrigin: "center" }} fontFamily={FONT}>15</text>
  </svg>
);

/* the dock — Speechify's grammar in Recall's clothes: one floating bar
   that owns the audio, pinned where the thumb lives. The transcript
   above it is the "text"; the dock is the voice. */
const PlayerDock = ({ ready, playing, t, rate, onToggle, onSeek, onRate }) => {
  const barRef = useRef(null);
  const dragTo = (clientX) => {
    const r = barRef.current.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * CHEN_DUR);
  };
  if (!ready) return (
    <div style={{ padding: "8px 16px 20px", flexShrink: 0 }}>
      <div style={{ background: C.card, borderRadius: 18, boxShadow: "0 6px 24px rgba(0,0,0,.10)",
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <div className="skel" style={{ width: 40, height: 40, borderRadius: 99 }} />
        <div style={{ flex: 1 }}>
          <div className="skel" style={{ height: 10, width: "62%", marginBottom: 7 }} />
          <div className="skel" style={{ height: 10, width: "38%" }} />
        </div>
        <div style={{ fontSize: 12.5, color: C.ter }}>Preparing the player…</div>
      </div>
    </div>
  );
  return (
    <div className="dockIn" style={{ padding: "8px 16px 20px", flexShrink: 0 }}>
      <div style={{ background: C.card, borderRadius: 18, boxShadow: "0 6px 24px rgba(0,0,0,.10)",
        padding: "12px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span role="timer" aria-label="Elapsed" style={{ fontSize: 12.5, fontWeight: 600, color: C.sub,
            width: 40, fontVariantNumeric: "tabular-nums" }}>{fmtClock(t)}</span>
          <div ref={barRef} style={{ flex: 1, height: 28, display: "flex", alignItems: "center",
            cursor: "pointer", touchAction: "none" }}
            onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} dragTo(e.clientX); }}
            onPointerMove={(e) => { if (e.buttons) dragTo(e.clientX); }}>
            <div style={{ flex: 1, height: 4.5, borderRadius: 99, background: C.track, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 99,
                background: C.blue, width: `${(t / CHEN_DUR) * 100}%`,
                transition: playing ? "width .25s linear" : "none" }} />
              <div style={{ position: "absolute", top: "50%", transform: "translate(-50%,-50%)",
                left: `${(t / CHEN_DUR) * 100}%`, width: 13, height: 13, borderRadius: 99,
                background: C.card, boxShadow: `0 0 0 1.5px ${C.blue}, 0 1px 4px rgba(0,0,0,.25)`,
                transition: playing ? "left .25s linear" : "none" }} />
            </div>
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ter, width: 40, textAlign: "right",
            fontVariantNumeric: "tabular-nums" }}>{fmtClock(CHEN_DUR)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
          <button className="tap" onClick={onRate} aria-label="Playback speed"
            style={{ width: 52, border: "none", background: C.bg, color: C.ink, borderRadius: 99,
              padding: "7px 0", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            {rate}×
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 26 }}>
            <button className="tap" onClick={() => onSeek(Math.max(0, t - 15))} aria-label="Back 15 seconds"
              style={{ border: "none", background: "none", color: C.ink, cursor: "pointer", padding: 6 }}>
              <SkipIcon />
            </button>
            <button className="tap" onClick={onToggle} aria-label={playing ? "Pause" : "Play"}
              style={{ width: 56, height: 56, borderRadius: 99, border: "none", background: C.blue,
                color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", boxShadow: "0 4px 14px rgba(0,122,255,.35)" }}>
              <Icon d={playing ? icons.pause : icons.play} size={24} sw={2.2} />
            </button>
            <button className="tap" onClick={() => onSeek(Math.min(CHEN_DUR, t + 15))} aria-label="Forward 15 seconds"
              style={{ border: "none", background: "none", color: C.ink, cursor: "pointer", padding: 6 }}>
              <SkipIcon fwd />
            </button>
          </div>
          <div style={{ width: 52 }} />
        </div>
      </div>
    </div>
  );
};

/* one tagged term, inline. Filtered-out kinds fall back to plain text
   with a dotted hem — the term is still there, just not shouting. */
const TermSpan = ({ u, active, dimmed, delay, onTap }) => {
  const kind = TERM_KINDS[u.k];
  if (dimmed) return (
    <span onClick={onTap} style={{ borderBottom: `1.5px dotted ${C.dash}`, cursor: "pointer" }}>{u.txt}</span>
  );
  return (
    <span className="termIn" onClick={onTap}
      style={{ background: kind.bg(), color: kind.ink(), borderRadius: 7, padding: "1.5px 6px",
        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", animationDelay: `${delay}ms`,
        boxShadow: active ? `0 0 0 1.8px ${kind.ink()}` : "none", transition: "box-shadow .15s" }}>
      {u.txt}
    </span>
  );
};

/* the glossary sheet — plain words first, this visit's own line second,
   and a door OUT to a source that isn't us. The button below the sheet's
   actions opens medlineplus.gov itself: an explanation you can verify
   beats an explanation you must believe. */
const GlossarySheet = ({ id, lang, onClose, onHear }) => {
  const g = GLOSSARY[id];
  if (!g) return null;
  const fr = lang === "fr";
  const kind = TERM_KINDS[g.k];
  return (
    <Sheet title={fr ? g.tFr : g.t} onClose={onClose}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: kind.bg(),
        color: kind.ink(), borderRadius: 99, padding: "5px 12px", fontSize: 13, fontWeight: 700,
        marginBottom: 12 }}>
        {fr ? kind.labelFr : kind.label}
      </span>
      <div style={{ fontSize: 16, lineHeight: 1.55, marginBottom: 12 }}>{fr ? g.whatFr : g.what}</div>
      <Card tone={kind.bg()} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: kind.ink(), textTransform: "uppercase",
          letterSpacing: ".05em", marginBottom: 5 }}>{fr ? "Dans cette visite" : "In this visit"}</div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: C.ink }}>{fr ? g.hereFr : g.here}</div>
      </Card>
      <BigButton tone="tinted" icon={<Icon d={icons.play} size={17} />}
        onClick={() => onHear(g.at)}>
        {(fr ? "Écouter ce moment · " : "Hear this moment · ") + fmtClock(g.at)}
      </BigButton>
      <div style={{ height: 8 }} />
      <a href={`https://medlineplus.gov/search.html?query=${encodeURIComponent(g.q)}`}
        target="_blank" rel="noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          minHeight: 52, borderRadius: 13, background: C.blue, color: "#fff", fontSize: 16.5,
          fontWeight: 600, textDecoration: "none", fontFamily: FONT }} className="tap">
        <Icon d={icons.globe} size={18} />{fr ? "Vérifier sur MedlinePlus ↗" : "Verify on MedlinePlus ↗"}
      </a>
      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
        {fr
          ? "Ouvre medlineplus.gov — la bibliothèque nationale de médecine des É.-U., hors de Recall. Les mots simples aident à demander ; votre équipe de soins confirme ce qui s'applique à vous."
          : "Opens medlineplus.gov — the U.S. National Library of Medicine, outside Recall. Plain words help you ask; your care team confirms what applies to you."}
      </div>
    </Sheet>
  );
};

/* the pipeline's five lines, shared verbatim by the Visits card and the
   early-opened page — one story, never forked */
const VisitSteps = ({ proc, onBlue }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
    {VISIT_STEPS.map((s, i) => {
      const done = proc === "done" || i < proc; const active = proc !== "done" && i === proc;
      return (
        <div key={i} className={done || active ? "stepIn" : ""}
          style={{ display: "flex", alignItems: "center", gap: 9, opacity: done ? 1 : active ? 0.9 : 0.32 }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, flexShrink: 0,
            background: done ? C.green : onBlue ? "#fff" : C.card, color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center",
            border: done ? "none" : `2px solid ${active ? C.blue : C.dash}` }}>
            {done && <Icon d={icons.check} size={11} sw={3.4} />}
            {active && <span className="blink" style={{ width: 7, height: 7, borderRadius: 99, background: C.blue, display: "block" }} />}
          </span>
          <span style={{ fontSize: 14.5, fontWeight: done || active ? 600 : 500,
            color: onBlue ? C.blueDeep : C.ink }}>{s.en}</span>
        </div>
      );
    })}
  </div>
);

/* Past visits, mid-pipeline: not a spinner — the work itself, ticking.
   Tappable, because watching Recall think is allowed (and is the
   explainability moment); leaving is equally fine. */
const VisitProcessingCard = ({ proc, onOpen }) => (
  <Card tone={C.blueSoft} style={{ marginBottom: 10 }} onClick={onOpen}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <RecallOrb size={40} mood="thinking" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.blueDeep }}>Writing up your visit…</div>
        <div style={{ fontSize: 13.5, color: C.blueSub }}>Watch it happen, or leave — I'll finish on my own</div>
      </div>
      <Icon d={icons.chevron} size={16} color={C.blueSub} />
    </div>
    <VisitSteps proc={proc} onBlue />
  </Card>
);

/* --------------------- the page itself ------------------------------ */
/* Speechify's reading surface, rebuilt for a doctor's visit: the dock
   owns the audio; every word knows its moment; every colored term
   opens plain words; every summary line carries its receipt. */
const RecordedVisitPage = ({ visit, proc, onBack, onShare, noticed = [], openRequest }) => {
  const [seg, setSeg] = useState("Summary");
  const [lang, setLang] = useState("en");
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [rate, setRate] = useState(1);
  const [follow, setFollow] = useState(true);
  const [filter, setFilter] = useState(null);
  const [gloss, setGloss] = useState(null);
  const [origOpen, setOrigOpen] = useState({});
  const scrollRef = useRef(null);
  const turnRefs = useRef({});
  const quietUntil = useRef(0);

  const done = proc === "done";
  const transcriptReady = done || proc >= 3;
  const tagsReady = done || proc >= 4;
  const summaryReady = done || proc >= 5;
  const fr = lang === "fr";

  /* the clock — 4 ticks a second is word-accurate and cheap */
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setT((v) => {
        const n = v + 0.25 * rate;
        if (n >= CHEN_DUR) { setPlaying(false); return CHEN_DUR; }
        return n;
      });
    }, 250);
    return () => clearInterval(iv);
  }, [playing, rate]);

  /* where the playhead is: the current turn, word, or quiet stretch */
  let anchorIdx = -1, turnIdx = -1, wordIdx = -1, gapIdx = -1;
  CHEN_TL.forEach((it, i) => {
    if (it.gap) { if (t >= it.at && t < it.until) gapIdx = i; }
    else if (t >= it.at) {
      turnIdx = i;
      wordIdx = t <= it.end + 0.2 ? it.units.findIndex((u) => t >= u.start && t < u.end) : -1;
    }
  });
  anchorIdx = gapIdx >= 0 ? gapIdx : turnIdx;

  /* karaoke follow — the transcript walks with the voice until the
     reader walks away; then a pill offers the way back (the call
     screen's Live-pill grammar, third appearance) */
  useEffect(() => {
    if (!follow || !playing || seg !== "Transcript" || !transcriptReady) return;
    const el = turnRefs.current[anchorIdx];
    if (el) {
      quietUntil.current = Date.now() + 950;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [anchorIdx, follow, playing, seg, transcriptReady]);

  const seek = (sec, andPlay = true) => {
    setT(Math.min(CHEN_DUR, Math.max(0, sec)));
    if (andPlay) setPlaying(true);
    setFollow(true);
    quietUntil.current = Date.now() + 950;
  };
  const hearReceipt = (at) => { setSeg("Transcript"); seek(at); };
  const cycleRate = () => setRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 1.5 : r === 1.5 ? 0.75 : 1));

  const segControl = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0 12px" }}>
      <div style={{ flex: 1 }}><Seg options={["Summary", "Transcript"]} value={seg} onChange={setSeg} /></div>
      <LangToggle lang={lang} setLang={setLang} />
    </div>
  );

  const chipsRow = (
    <div className="scroll" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 2px 12px",
      margin: "0 -2px" }}>
      <button className="tap" onClick={() => setFilter(null)}
        style={{ border: "none", borderRadius: 99, padding: "7px 13px", fontSize: 13.5, fontWeight: 600,
          cursor: "pointer", fontFamily: FONT, flexShrink: 0,
          background: !filter ? C.ink : C.card, color: !filter ? C.bg : C.ink,
          boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)" }}>
        {fr ? "Tout" : "All"}
      </button>
      {TERM_KIND_ORDER.map((k) => {
        const kind = TERM_KINDS[k]; const on = filter === k;
        return (
          <button key={k} className="tap" onClick={() => setFilter(on ? null : k)}
            style={{ border: "none", borderRadius: 99, padding: "7px 13px", fontSize: 13.5,
              fontWeight: 600, cursor: "pointer", fontFamily: FONT, flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              background: on ? kind.ink() : kind.bg(), color: on ? "#fff" : kind.ink() }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: on ? "#fff" : kind.ink() }} />
            {(fr ? kind.labelFr : kind.label) + "s · " + (TERM_COUNTS[k] || 0)}
          </button>
        );
      })}
    </div>
  );

  const transcriptBody = !transcriptReady ? (
    <Card>
      {[92, 70, 84, 58, 76].map((w, i) => (
        <div key={i} style={{ padding: "10px 2px" }}>
          <div className="skel" style={{ height: 9, width: 64, marginBottom: 8 }} />
          <div className="skel" style={{ height: 12, width: `${w}%`, marginBottom: 5 }} />
          {i % 2 === 0 && <div className="skel" style={{ height: 12, width: `${w - 30}%` }} />}
        </div>
      ))}
    </Card>
  ) : (
    <>
      {chipsRow}
      {fr && (
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 12px" }}>
          Traduit par Recall — l'audio joue l'anglais d'origine ; « EN » montre la phrase telle
          qu'elle a été dite.
        </div>
      )}
      <Card style={{ padding: "6px 14px" }}>
        {CHEN_TL.map((it, i) => {
          if (it.gap) {
            const liveGap = i === gapIdx;
            return (
              <div key={i} ref={(el) => (turnRefs.current[i] = el)} onClick={() => seek(it.at)}
                className={transcriptReady && !done ? "stepIn" : ""}
                style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                  padding: "9px 2px", cursor: "pointer", animationDelay: `${Math.min(i * 30, 900)}ms` }}>
                <span className={liveGap ? "quadPulse" : ""}
                  style={{ fontSize: 13, fontStyle: "italic", fontWeight: liveGap ? 600 : 400,
                    color: liveGap ? C.blue : C.ter,
                    background: liveGap ? C.blueSoft : "transparent",
                    borderRadius: 99, padding: "3px 12px" }}>
                  {(fr ? it.fr : it.en) + " · " + fmtClock(it.until - it.at)}
                </span>
              </div>
            );
          }
          const isActive = i === turnIdx && playing;
          const label = it.w === "dr" ? (fr ? "DR CHEN" : "DR. CHEN") : (fr ? "VOUS" : "YOU");
          let wordCursor = -1;
          return (
            <div key={i} ref={(el) => (turnRefs.current[i] = el)}
              className={transcriptReady && !done ? "stepIn" : ""}
              style={{ padding: "9px 8px", margin: "0 -8px", borderRadius: 12,
                background: isActive ? C.bg : "transparent", transition: "background .3s",
                animationDelay: `${Math.min(i * 30, 900)}ms`, position: "relative" }}>
              {isActive && <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3,
                borderRadius: 99, background: it.w === "dr" ? C.blue : C.green }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em",
                  color: it.w === "dr" ? (isActive ? C.blue : C.ter) : (isActive ? C.greenInk : C.ter) }}>
                  {label}
                </span>
                <button className="tap" onClick={() => seek(it.at)}
                  style={{ border: "none", background: "none", color: C.blue, fontSize: 12,
                    fontWeight: 600, cursor: "pointer", fontFamily: FONT, padding: "3px 5px",
                    margin: -3, display: "flex", alignItems: "center", gap: 3,
                    fontVariantNumeric: "tabular-nums" }}>
                  <Icon d={icons.play} size={9} sw={2.6} />{fmtClock(it.at)}
                </button>
                {fr && (
                  <button className="tap" onClick={() => setOrigOpen((p) => ({ ...p, [i]: !p[i] }))}
                    style={{ border: "none", background: C.track, color: C.sub, fontSize: 11,
                      fontWeight: 700, cursor: "pointer", fontFamily: FONT, padding: "3px 8px",
                      borderRadius: 99, marginLeft: "auto" }}>
                    EN {origOpen[i] ? "▴" : "▾"}
                  </button>
                )}
              </div>
              <div style={{ fontSize: 16, lineHeight: 1.62, color: C.ink }}>
                {fr
                  ? it.fr.map((part, pi) => Array.isArray(part)
                      ? <TermSpan key={pi} u={{ txt: part[0], k: part[1], g: part[2] }}
                          active={false} dimmed={!tagsReady || (filter && filter !== part[1])}
                          delay={(pi % 10) * 45} onTap={() => tagsReady && setGloss(part[2])} />
                      : <span key={pi}>{part}</span>)
                  : it.units.map((u, ui) => {
                      wordCursor += 1;
                      const activeWord = isActive && ui === wordIdx;
                      const space = ui > 0 ? " " : "";
                      if (u.k) return (
                        <span key={ui}>{space}
                          <TermSpan u={u} active={activeWord}
                            dimmed={!tagsReady || (filter && filter !== u.k)}
                            delay={(wordCursor % 10) * 45}
                            onTap={() => (tagsReady ? setGloss(u.g) : seek(u.start))} />
                        </span>
                      );
                      return (
                        <span key={ui}>{space}<span onClick={() => seek(u.start)}
                          style={{ cursor: "pointer", borderRadius: 5, padding: "0 3px", margin: "0 -3px",
                            background: activeWord ? C.blue : "transparent",
                            color: activeWord ? "#fff" : "inherit",
                            transition: "background .12s, color .12s" }}>{u.txt}</span></span>
                      );
                    })}
              </div>
              {fr && origOpen[i] && (
                <div className="fadeMsg" style={{ fontSize: 13.5, fontStyle: "italic", color: C.sub,
                  lineHeight: 1.5, marginTop: 5, paddingLeft: 10, borderLeft: `2px solid ${C.line}` }}>
                  {it.units.map((u) => u.txt).join(" ")}
                </div>
              )}
            </div>
          );
        })}
      </Card>
      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
        {fr ? "Touchez un mot pour l'entendre — les termes en couleur s'expliquent en mots simples."
          : "Tap any word to hear it — colored terms explain themselves in plain words."}
      </div>
    </>
  );

  const sum = CHEN_SUMMARY[fr ? "fr" : "en"];
  /* terms in the summary wear a QUIETER coat than in the transcript —
     colored ink and a dotted hem, no pill. The summary is the calm
     read; color still says the kind, the hem still says "tap me,"
     and the same glossary sheet answers. The transcript keeps the
     louder chips because there they double as the karaoke's landmarks. */
  const sumText = (t) => t.map((p, i) => {
    if (!Array.isArray(p)) return <span key={i}>{p}</span>;
    const kind = TERM_KINDS[p[1]];
    return (
      <span key={i} onClick={(e) => { e.stopPropagation(); setGloss(p[2]); }}
        style={{ color: kind.ink(), fontWeight: 600, cursor: "pointer",
          borderBottom: `1.5px dotted ${kind.ink()}` }}>
        {p[0]}
      </span>
    );
  });
  const summaryBody = !summaryReady ? (
    <Card>
      <div className="skel" style={{ height: 12, width: "94%", marginBottom: 8 }} />
      <div className="skel" style={{ height: 12, width: "86%", marginBottom: 8 }} />
      <div className="skel" style={{ height: 12, width: "62%" }} />
      <div style={{ fontSize: 13, color: C.ter, paddingTop: 12 }}>
        {VISIT_STEPS[Math.min(proc, 4)].en}…
      </div>
    </Card>
  ) : (
    <div className="fadeMsg">
      <Card style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 16.5, lineHeight: 1.6 }}>{sum.short}</div>
      </Card>
      {sum.groups.map((g) => {
        const kind = TERM_KINDS[g.k];
        return (
          <div key={g.h}>
            <SectionLabel>{g.h}</SectionLabel>
            <Card>
              {g.rows.map((r, i) => (
                <div key={i}>
                  {i > 0 && <FullDivider />}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: kind.ink(),
                      flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 15.5, lineHeight: 1.45 }}>{sumText(r.t)}</div>
                    <button className="tap" onClick={() => hearReceipt(r.at)}
                      aria-label={`Hear this at ${fmtClock(r.at)}`}
                      style={{ border: "none", background: C.bg, color: C.blue, borderRadius: 99,
                        padding: "6px 11px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                        fontFamily: FONT, display: "flex", alignItems: "center", gap: 4,
                        flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                      <Icon d={icons.play} size={10} sw={2.6} />{fmtClock(r.at)}
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        );
      })}
      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
        {fr
          ? "Recall a écrit ceci à partir de l'enregistrement — touchez ▶ pour entendre le moment lui-même. C'est un résumé, pas un avis médical."
          : "Recall wrote this from the recording — tap ▶ on any line to hear the moment itself. It's a summary, not medical advice."}
      </div>
    </div>
  );

  return (
    <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 25, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 10px 8px", flexShrink: 0 }}>
        <button className="tap" onClick={onBack} aria-label="Back"
          style={{ border: "none", background: "none", color: C.blue, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 1, fontFamily: FONT,
            fontSize: 17, fontWeight: 600, padding: "11px 10px 11px 6px" }}>
          <Icon d={icons.back} size={22} sw={2.4} />Back
        </button>
        <div style={{ fontSize: 17.5, fontWeight: 700, flex: 1, textAlign: "center" }}>
          {fr ? "Visite" : "Visit"}
        </div>
        <button className="tap" onClick={onShare} aria-label="Share this visit"
          style={{ border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99,
            width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", marginRight: 8 }}>
          <Icon d={icons.share} size={17} />
        </button>
      </div>

      <div ref={scrollRef} className="scroll"
        onScroll={() => {
          if (playing && follow && Date.now() > quietUntil.current) setFollow(false);
        }}
        style={{ flex: 1, overflowY: "auto", padding: "4px 16px 10px", position: "relative" }}>
        <div style={{ padding: "4px 4px 12px" }}>
          <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.015em" }}>{visit.title}</div>
          <div style={{ fontSize: 14.5, color: C.sub, marginTop: 3 }}>
            {visit.fresh ? (fr ? "Aujourd'hui · 10:15 · 18 min" : "Today · 10:15 AM · 18 min")
              : (fr ? "31 juillet · 10:15 · 18 min" : "July 31 · 10:15 AM · 18 min")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7,
            fontSize: 13, color: C.ter }}>
            <Icon d={icons.mic} size={13} sw={2} />
            {fr ? "Enregistrée avec l'accord du Dr Chen · reste sur votre téléphone"
              : "Recorded with Dr. Chen's OK · stays on your phone"}
          </div>
        </div>

        {!done && (
          <Card tone={C.blueSoft} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <RecallOrb size={40} mood="thinking" />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.blueDeep }}>
                {fr ? "Recall écrit votre visite…" : "Recall is writing up your visit…"}
              </div>
            </div>
            <VisitSteps proc={proc} onBlue />
          </Card>
        )}

        {segControl}
        {seg === "Summary" ? summaryBody : transcriptBody}

        {noticed.length > 0 && done && (
          <>
            <SectionLabel>Recall noticed</SectionLabel>
            <Card>
              {noticed.map((n, i) => (
                <div key={n.id}>
                  {i > 0 && <Divider />}
                  {n.done ? (
                    <Row leading={<Icon d={icons.check} size={19} />} leadingBg={C.greenSoft}
                      title={n.title} sub={fr ? "Réglé — décidé par vous ✓" : "Settled — decided by you ✓"}
                      onClick={() => openRequest(n.need)} />
                  ) : (
                    <PendingRow icon={n.icon || icons.bell} title={n.title} sub={n.sub}
                      onClick={() => openRequest(n.need)} />
                  )}
                </div>
              ))}
            </Card>
            <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0", textAlign: "center" }}>
              {fr ? "Rien ne change dans votre dossier à partir d'un enregistrement seul — chaque élément attend votre oui."
                : "Nothing changes in your record from a recording alone — each of these waits for your yes."}
            </div>
          </>
        )}
        <div style={{ height: 8 }} />
      </div>

      {!follow && playing && seg === "Transcript" && (
        <div style={{ position: "relative", height: 0, flexShrink: 0 }}>
          <button className="tap toastIn" onClick={() => {
            setFollow(true);
            const el = turnRefs.current[anchorIdx];
            if (el) { quietUntil.current = Date.now() + 950; el.scrollIntoView({ behavior: "smooth", block: "center" }); }
          }}
            style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              border: "none", background: C.ink, color: C.bg, borderRadius: 99, padding: "9px 16px",
              fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
              display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              boxShadow: "0 6px 20px rgba(0,0,0,.25)" }}>
            <span className="blink" style={{ width: 8, height: 8, borderRadius: 99, background: C.green }} />
            {(fr ? "En lecture · " : "Playing · ") + fmtClock(t)} — {fr ? "revenir au mot" : "back to the words"}
          </button>
        </div>
      )}

      <PlayerDock ready={transcriptReady} playing={playing} t={t} rate={rate}
        onToggle={() => setPlaying((p) => !p)} onSeek={(s) => seek(s, playing)} onRate={cycleRate} />

      {gloss && (
        <GlossarySheet id={gloss} lang={lang} onClose={() => setGloss(null)}
          onHear={(at) => { setGloss(null); hearReceipt(at); }} />
      )}
    </div>
  );
};

const PastVisitPage = ({ visit, onBack, onSuggest, onShare }) => {
  const [seg, setSeg] = useState("Summary");
  const [lang, setLang] = useState("en");
  return (
    <Page title="Past visit" onBack={onBack}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 4px 12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.015em" }}>{visit.title}</div>
          <div style={{ fontSize: 14.5, color: C.sub, marginTop: 3 }}>{visit.sub}</div>
        </div>
        {onShare && (
          <button className="tap" onClick={onShare} aria-label="Share this visit"
            style={{ border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99,
              padding: "10px 15px", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Icon d={icons.share} size={17} />Share
          </button>
        )}
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Row leading={<Icon d={icons.play} size={19} />} title="Play the recording" sub="22 min · stays on your phone" pad="2px" />
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}><Seg options={["Summary", "Transcript"]} value={seg} onChange={setSeg} /></div>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {seg === "Summary" ? (
        <Card>
          <div style={{ fontSize: 16, lineHeight: 1.6 }}>
            {lang === "en" ? PAST_VISIT_DETAIL.summaryEn : PAST_VISIT_DETAIL.summaryFr}
          </div>
        </Card>
      ) : (
        <Card>
          {PAST_VISIT_DETAIL.transcript.map(([who, line], i) => (
            <div key={i} style={{ padding: "8px 2px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: who === "Amma" ? C.blue : C.ter }}>{who}</div>
              <div style={{ fontSize: 15.5, lineHeight: 1.5 }}>{line}</div>
            </div>
          ))}
          {lang === "fr" && (
            <div style={{ fontSize: 13.5, color: C.ter, padding: "8px 2px 0" }}>
              La transcription reste dans la langue de la visite — le résumé, lui, se traduit.
            </div>
          )}
        </Card>
      )}

      <SectionLabel>Recall noticed</SectionLabel>
      <Card tone={C.blueSoft}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <RecallOrb size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.blueDeep }}>{PAST_VISIT_DETAIL.suggestion.title}</div>
            <div style={{ fontSize: 14, color: C.blueSub }}>{PAST_VISIT_DETAIL.suggestion.sub}</div>
          </div>
          <BigButton small tone="white" onClick={onSuggest}>Review</BigButton>
        </div>
      </Card>
    </Page>
  );
};

/* the full diary, month by month — the page "See all" opens */
const AllCheckinsPage = ({ period, followed, ui, onBack }) => {
  const groups = ALL_CHECKINS[period] || [];
  const tagFor = entryTagFor(period, followed, ui);
  return (
    <Page title="All check-ins" onBack={onBack}>
      {groups.map((g) => (
        <div key={g.m}>
          <SectionLabel>{g.m} · {g.rows.length}</SectionLabel>
          <Card>
            {g.rows.map((e, i) => (
              <div key={e.w + e.n}>
                {i > 0 && <FullDivider />}
                <EntryRow e={e} tagFor={tagFor}
                  onOpen={e.kind === "processing" ? undefined
                    : () => ui.openPage("checkinDetail", { status: e.kind, from: "allCheckins",
                        entry: e.today ? undefined : { ...e, month: g.m } })} />
              </div>
            ))}
          </Card>
        </div>
      ))}
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0", textAlign: "center" }}>
        Every day you kept, newest first — tap any to read the entry and the words behind it.
      </div>
    </Page>
  );
};

/* ------------- the check-line sheet — repair, her verdict ----------- */
/* After it writes the entry, Recall reads its own writing back against
   the talk. A line it can't match to anything she said gets MARKED,
   never silently rewritten — the record changes only by her hand. The
   sheet lays the two records side by side: the writing (which can
   slip) and her words (which never change), then offers the
   realignment. She is the judge both ways — the machine's doubt can
   be wrong too, so "keep it" is a full answer, not a failure. */
const CheckLineSheet = ({ slip, wrote, onFix, onKeep, onClose }) => {
  const eyebrow = { fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em",
    textTransform: "uppercase", color: C.ter, padding: "14px 4px 7px" };
  return (
    <Sheet title="Check this line" onClose={onClose}>
      <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.55, padding: "0 4px" }}>
        After writing your entry, Recall reads it back against the talk. This one line it
        couldn't match to anything you said — so it's marked, and you're the judge.
      </div>
      <div style={eyebrow}>What I wrote</div>
      <Card tone={C.orangeSoft}>
        <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.5 }}>{wrote}</div>
      </Card>
      <div style={eyebrow}>What you said — word for word</div>
      <Card tone={C.blueSoft}>
        <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.5 }}>“{slip.said}”</div>
        <div style={{ fontSize: 13, color: C.blueSub, lineHeight: 1.45, marginTop: 6 }}>
          From this morning's talk — the talk itself never changes.
        </div>
      </Card>
      <div style={eyebrow}>So the line would read</div>
      <Card>
        <div style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.5 }}>{slip.fixed}</div>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        <BigButton tone="tinted" onClick={onFix}>Use my words — fix the line</BigButton>
        <BigButton tone="ghost" onClick={onKeep}>The writing was right — keep it</BigButton>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 4px" }}>
        A fix is named on the entry, never silent. And fixed today, it travels fixed —
        tomorrow's brief for Dr. Chen reads your words, not the slip.
      </div>
    </Sheet>
  );
};

/* ---------------------- the entry page ----------------------------- */
/* The diary page for one day. The pecking order is the product's own
   fiction, taken seriously: the pipeline WRITES an entry from the
   talk, so the ENTRY is the content — her opening line verbatim, the
   day retold in prose. Below it, what the day filed (receipts — rows
   report, chips navigate), the one place counts live ("How Recall
   read today"), and the raw conversation as PROVENANCE: word for
   word, one fold away, never the lead. No meters — a bare six-segment
   bar was a score nobody was ever taught. */
const CheckinDetailPage = ({ status, reopened, period = "week2", captured = [], onBack,
  openCheckin, openAddCheckin, openReview, slipState, onSlip, pastEntry, tagFor }) => {
  const entry = CHECKIN_ENTRY[period] || CHECKIN_ENTRY.week2;
  const [convOpen, setConvOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const lines = status === "done"
    ? [...CHECKIN_TRANSCRIPTS.progress, ...CHECKIN_TRANSCRIPTS.done]
    : CHECKIN_TRANSCRIPTS.progress;

  const eyebrow = (t) => (
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em",
      textTransform: "uppercase", color: C.ter }}>{t}</div>
  );

  /* -------- a PAST day — its own page, never today's in costume ------
     A tapped archive row used to open today's entry wearing that row's
     date; the reader deserved the day they tapped. A past day is a
     settled thing, so its page answers exactly two questions: what the
     day said (her line, the one the list showed) and WHAT IT CHANGED —
     the topics it fed and the medication pages it kept honest, the
     same doors the row's chips named, now with room to say so. Nothing
     day-only leaks in: no lens sheet for a day whose talk isn't here,
     no "something happen since?", no repair — a finalized day doesn't
     re-open, it gets an addendum with its own time. */
  if (pastEntry) {
    const DAY_LONG = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
      Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
    const tags = pastEntry.tags || [];
    const pastDay = pastDayFor(pastEntry);
    return (
      <Page title={`${DAY_LONG[pastEntry.w] || pastEntry.w}, ${pastEntry.month || "July"} ${pastEntry.n}`}
        onBack={onBack}>
        {/* the entry is PROSE, not a caption — the row's line opens it,
            the written day follows. A few minutes of talk deserves more
            than one sentence of record. */}
        <Card>
          {eyebrow(pastEntry.when || "Finalized that day · in your words")}
          <div style={{ fontSize: 17, fontWeight: 650, lineHeight: 1.55, marginTop: 8 }}>
            “{pastEntry.said}.”
          </div>
          {(pastDay.paras || []).map((p, i) => (
            <div key={i} style={{ fontSize: 15.5, lineHeight: 1.6, marginTop: 10 }}>{p}</div>
          ))}
        </Card>

        {/* the day's coverage, in the same six plain words as "What today
            covered" — a line, not a sheet: the talk isn't here to re-score */}
        {pastDay.cov && (
          <Card style={{ marginTop: 10, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, color: C.blue,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.chat} size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>What that day covered</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1, lineHeight: 1.4 }}>{pastDay.cov}</div>
              </div>
            </div>
          </Card>
        )}

        {/* the same fold today's entry has — a kept day never loses its
            words; provenance that expires was never provenance */}
        <div style={{ marginTop: 10 }}>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <button className="tap" onClick={() => setConvOpen((v) => !v)} style={{ display: "flex",
              width: "100%", alignItems: "center", gap: 12, border: "none", background: "none",
              padding: "13px 16px", cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueSoft, color: C.blue,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.mic} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink }}>The conversation behind it</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>
                  Word for word, exactly as it was said{pastDay.talk.length > 9 ? " · a few minutes" : ""}
                </div>
              </div>
              <span style={{ display: "flex", color: C.ter, flexShrink: 0,
                transform: convOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .2s" }}>
                <Icon d={icons.chevron} size={15} sw={2.2} />
              </span>
            </button>
            {convOpen && (
              <div style={{ padding: "0 16px 14px" }}>
                {pastDay.talk.map(([who, line, why], i) => (
                  <div key={i} style={{ padding: "7px 0" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: who === "Amma" ? C.blue : C.ter }}>{who}</div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.5 }}>{line}</div>
                    {why && (
                      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45, marginTop: 3 }}>
                        Why this question · {why}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {tags.length > 0 ? (
          <>
            <SectionLabel>What this day changed</SectionLabel>
            <Card>
              {tags.map((tg, i) => {
                const t = tagFor ? tagFor(tg) : null;
                const isMed = tg[0] === "med";
                return (
                  <div key={tg[1]}>
                    {i > 0 && <Divider />}
                    <Row leading={<Icon d={isMed ? icons.meds : icons.topic} size={19} />}
                      leadingBg={isMed ? C.greenSoft : C.orangeSoft}
                      leadColor={isMed ? C.green : C.orange}
                      title={tg[1]}
                      sub={isMed
                        ? "This day is on the medication's own week — kept honestly, never a nag"
                        : "One of the days this topic holds — quoted there in your words"}
                      onClick={t ? t.go : undefined} />
                  </div>
                );
              })}
            </Card>
          </>
        ) : (
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
            This day stayed in the diary — it fed no topic and flagged nothing. A quiet day is
            a full entry too.
          </div>
        )}

        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px",
          textAlign: "center" }}>
          A finalized day never changes. Anything added later that evening carries its own time,
          beside the morning — never over it.
        </div>
      </Page>
    );
  }

  /* what this day deposited, by destination — a REPORT, not doors: the
     things are simply there in their own tabs. Live from the talk's
     captures when there are any; the seeded month-1 world has its own. */
  const homeMeta = {
    Meds: ["meds", "in your cabinet — changeable there any time"],
    Visits: ["visits", "added to Visits — its brief starts building"],
    "Visit history": ["visits", "filed in your visit history, in your words"],
    brief: ["question", "kept for the right visit's brief"],
    Today: ["bell", "a reminder waits on Today"],
    Documents: ["docs", "read and filed in Documents"],
    Topics: ["topic", "followed — lives in Journal › Topics"],
  };
  const rTint = { meds: [C.greenSoft, C.green], visits: [C.blueSoft, C.blue],
    question: [C.orangeSoft, C.orange], bell: [C.orangeSoft, C.orange],
    docs: [C.blueSoft, C.blue], topic: [C.orangeSoft, C.orange] };
  const live = captured
    .filter((c) => c.home !== "Topics" || c.settled === "done")
    .map((c) => ({ icon: (homeMeta[c.home] || ["check"])[0], t: c.topicName || c.t,
      line: (homeMeta[c.home] || [null, "kept from the talk"])[1] }));
  const receipts = status === "done"
    ? (live.length ? live : period === "month1"
        ? [{ icon: "question", t: "“Should the water pill move to mornings?”", line: "kept for Dr. Osei's brief" }]
        : [])
    : [];

  /* the conversation, folded — provenance on demand */
  const transcriptCard = (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <button className="tap" onClick={() => setConvOpen((v) => !v)} style={{ display: "flex",
        width: "100%", alignItems: "center", gap: 12, border: "none", background: "none",
        padding: "13px 16px", cursor: "pointer", fontFamily: FONT, textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueSoft, color: C.blue,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon d={icons.mic} size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ink }}>The conversation behind it</div>
          <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>Word for word, exactly as it was said</div>
        </div>
        <span style={{ display: "flex", color: C.ter, flexShrink: 0,
          transform: convOpen ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform .2s" }}>
          <Icon d={icons.chevron} size={15} sw={2.2} />
        </span>
      </button>
      {convOpen && (
        <div style={{ padding: "0 16px 14px" }}>
          {lines.map(([who, line, why], i) => (
            <div key={i} style={{ padding: "7px 0" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: who === "Amma" ? C.blue : C.ter }}>{who}</div>
              <div style={{ fontSize: 15.5, lineHeight: 1.5 }}>{line}</div>
              {why && (
                <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.45, marginTop: 3 }}>
                  Why this question · {why}
                </div>
              )}
            </div>
          ))}
          {status === "done" && reopened && (
            <>
              <div style={{ padding: "10px 0 4px" }}>{eyebrow("Added this evening · 6:40 PM")}</div>
              {CHECKIN_TRANSCRIPTS.addendum.map(([who, line], i) => (
                <div key={i} style={{ padding: "7px 0" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: who === "Amma" ? C.blue : C.ter }}>{who}</div>
                  <div style={{ fontSize: 15.5, lineHeight: 1.5 }}>{line}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <Page title={status === "done" ? "Today's entry" : "Today's check-in"} onBack={onBack}>
      {status !== "done" ? (
        <>
          {/* mid-day: what's kept so far, in words — the counts wait for
              the review's own sheet, and the open lenses are an
              invitation, never a checklist */}
          <Card>
            {eyebrow("So far this morning · began 8:40 AM")}
            <div style={{ fontSize: 15.5, lineHeight: 1.6, marginTop: 8 }}>
              Sleep, the pills and the stairs are in — seven hours, both with breakfast, no stop
              halfway. The knee was a little stiff first thing, fine after.
            </div>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginTop: 10 }}>
              Moving and how you're feeling are still open — whenever you like, nothing is required.
            </div>
          </Card>
          <div style={{ margin: "14px 0 12px", display: "flex", flexDirection: "column", gap: 10 }}>
            <BigButton tone="tinted" icon={<RecallOrb size={24} />} onClick={openCheckin}>Continue the check-in</BigButton>
            <BigButton tone="ghost" onClick={openReview}>Review & finalize</BigButton>
          </div>
          {transcriptCard}
        </>
      ) : (
        <>
          <Card>
            {eyebrow(`Written at ${entry.time} · in your words`)}
            {entry.paras.map((p, i) => {
              const flagged = entry.slip && entry.slip.i === i;
              /* a fixed line simply reads right; a kept line simply stands.
                 Only an UNDECIDED mark interrupts the prose — softly. */
              if (flagged && !slipState)
                return (
                  <div key={i} style={{ marginTop: 10 }}>
                    <div style={{ background: C.orangeSoft, borderRadius: 9, padding: "9px 11px",
                      fontSize: 15.5, lineHeight: 1.6 }}>{p}</div>
                    <button className="tap" onClick={() => setCheckOpen(true)} style={{ display: "flex",
                      alignItems: "center", gap: 7, border: "none", background: "none", cursor: "pointer",
                      fontFamily: FONT, color: C.orangeInk, fontSize: 13.5, fontWeight: 650,
                      minHeight: 44, padding: "4px 2px 0", textAlign: "left" }}>
                      <Icon d={icons.eye} size={15} sw={2} />
                      This line didn't match our talk — check it
                    </button>
                  </div>
                );
              return (
                <div key={i} style={{ fontSize: i === 0 ? 17 : 15.5, fontWeight: i === 0 ? 650 : 400,
                  lineHeight: 1.6, marginTop: i === 0 ? 8 : 10 }}>
                  {flagged && slipState === "fixed" ? entry.slip.fixed : p}
                </div>
              );
            })}
            {entry.slip && slipState && (
              <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, marginTop: 10 }}>
                {slipState === "fixed"
                  ? `One line fixed by you at ${NOW_TIME} — checked against the talk, kept in your words.`
                  : "You checked one line against the talk — it stands as written."}
              </div>
            )}
            {reopened && (
              <>
                <div style={{ height: 0.5, background: C.line, margin: "14px 0 10px" }} />
                {eyebrow("Added this evening · 6:40 PM")}
                <div style={{ fontSize: 15.5, lineHeight: 1.6, marginTop: 8 }}>
                  “My knee swelled up after dinner. That's not like this morning.” Kept as its own
                  note beside the morning's — and as a question for Dr. Chen.
                </div>
                <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, marginTop: 8 }}>
                  The morning entry never changed — the evening carries its own time.
                </div>
              </>
            )}
          </Card>

          {receipts.length > 0 && (
            <>
              <SectionLabel>Filed from this day</SectionLabel>
              <Card>
                {receipts.map((r, i) => {
                  const tint = rTint[r.icon] || [C.greenSoft, C.green];
                  return (
                    <div key={r.t} style={{ display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "10px 2px", borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: tint[0], color: tint[1],
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={icons[r.icon] || icons.check} size={17} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{r.t}</div>
                        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 2 }}>{r.line}</div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </>
          )}

          {/* the ONE place counts live — the same sheet the review uses.
              Named for what it holds, in the same six plain words the
              first check-in's intro used — "lenses" was our word, never
              hers, and an eye glyph read as surveillance. */}
          <div style={{ marginTop: 10 }}>
            <Card onClick={() => setReadOpen(true)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueSoft,
                  color: C.blue, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0 }}>
                  <Icon d={icons.chat} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>What today covered</div>
                  <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>
                    Meds · symptoms · sleep · movement · meals · mood — how much each holds
                  </div>
                </div>
                <Icon d={icons.chevron} size={15} color={C.ter} sw={2.2} />
              </div>
            </Card>
          </div>

          <div style={{ marginTop: 10 }}>{transcriptCard}</div>

          <SectionLabel>Something happen since?</SectionLabel>
          <Card>
            <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>
              Finalized doesn't mean locked. If the evening brings something new — a symptom, a call from
              the pharmacy — add it here. Today's entry stays exactly as it is; tonight's note gets its own time.
            </div>
            <BigButton tone="tinted" icon={<RecallOrb size={24} />} onClick={openAddCheckin}>Add to today's entry</BigButton>
          </Card>
        </>
      )}
      {readOpen && <HowReadSheet onClose={() => setReadOpen(false)} />}
      {checkOpen && entry.slip && (
        <CheckLineSheet slip={entry.slip} wrote={entry.paras[entry.slip.i]}
          onFix={() => { setCheckOpen(false); onSlip && onSlip("fixed"); }}
          onKeep={() => { setCheckOpen(false); onSlip && onSlip("kept"); }}
          onClose={() => setCheckOpen(false)} />
      )}
    </Page>
  );
};

/* ------------------------- the topic page -------------------------- */
/* One topic, fully open: every row is a receipt — entries, a confirmed
   change, photos, readings — and the page quotes; it never concludes.
   Lifecycle actions live behind ONE "Manage" door (never inline), and
   the stale question is answered here and only here, at most once.
   Shared body: the same content renders in-call as a glanceable sheet
   (read-only, the call keeps going) and here as the full page. */
const TopicBody = ({ t, staleAsk, onStale, openPage }) => (
  <>
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {topicStateChip(t.state)}
        <span style={{ fontSize: 13, color: C.ter }}>
          {t.state === "settled" ? `resolved ${t.resolved} — by you` : `following since ${t.since}`}
        </span>
      </div>
      <div style={{ fontSize: 15.5, lineHeight: 1.5, marginTop: 10 }}>
        {t.state === "waiting" ? (
          t.line
        ) : (
          <>Latest, in your words: <b>{t.latest}</b></>
        )}
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.45, marginTop: 6 }}>
        Recall quotes; it never concludes. Resolving is yours alone.
      </div>
      {/* the profile shows its hand at the topic level too — why THIS
          thing earned a daily eye, stated as context, never diagnosis */}
      {t.why && (
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, marginTop: 9,
          paddingTop: 9, borderTop: `0.5px solid ${C.line}` }}>
          <b>Why Recall watches this one</b> · {t.why}
        </div>
      )}
      {/* the when-to-worry line — safety-netting with her region's real
          numbers, so an urgent moment never starts with a guess */}
      {t.safety && (
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, marginTop: 9,
          paddingTop: 9, borderTop: `0.5px solid ${C.line}` }}>
          <b style={{ color: C.ink }}>If it ever feels urgent</b> · {t.safety}
        </div>
      )}
    </Card>

    {staleAsk && (
      <Card tone={C.orangeSoft} style={{ marginTop: 10 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700 }}>{t.name} — still worth following?</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <BigButton small onClick={() => onStale("keep")}>Still following</BigButton>
          <BigButton small tone="tinted" onClick={() => onStale("pause")}>Pause</BigButton>
          <BigButton small tone="tinted" onClick={() => onStale("resolve")}>Resolved</BigButton>
        </div>
        <div style={{ fontSize: 13, color: C.orangeInk, lineHeight: 1.45, marginTop: 9 }}>
          Asked once, here on the topic's own page — never a push, never auto-resolved.
        </div>
      </Card>
    )}

    {t.story && t.story.length > 0 && (
      <>
        <SectionLabel>The story so far</SectionLabel>
        <Card>
          {t.story.map((s, i) => (
            <div key={s.title} style={{ display: "flex", alignItems: "flex-start", gap: 12,
              padding: "10px 2px", borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: s.icon === "camera" ? C.purpleSoft : s.icon === "pattern" ? C.blueSoft
                  : s.icon === "visits" ? C.blueSoft : s.icon === "meds" ? C.greenSoft : C.orangeSoft,
                color: s.icon === "camera" ? C.purple : s.icon === "pattern" ? C.blue
                  : s.icon === "visits" ? C.blue : s.icon === "meds" ? C.green : C.orange,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={icons[s.icon] || icons.mic} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{s.title}</div>
                {s.photos ? (
                  <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                    {s.photos.map((d) => (
                      <div key={d} style={{ width: 52, height: 52, borderRadius: 9, background: C.track,
                        display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4 }}>
                        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".05em", color: C.ter }}>{d}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, color: C.sub, marginTop: 2 }}>{s.sub}</div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </>
    )}

    {t.goes && t.goes.length > 0 && (
      <>
        <SectionLabel>Where it goes</SectionLabel>
        <Card>
          {t.goes.map((g, i) => (
            <div key={g.title} className={g.page && openPage ? "tap" : undefined}
              onClick={g.page && openPage ? () => openPage(g.page) : undefined}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 2px",
                borderTop: i > 0 ? `0.5px solid ${C.line}` : "none",
                cursor: g.page && openPage ? "pointer" : "default" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: g.icon === "spark" ? C.purpleSoft : C.blueSoft,
                color: g.icon === "spark" ? C.purple : C.blue,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={icons[g.icon] || icons.visits} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{g.title}</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{g.sub}</div>
              </div>
              {g.page && openPage && (
                <span style={{ display: "flex", color: C.ter }}>
                  <Icon d={icons.chevron} size={14} sw={2.2} />
                </span>
              )}
            </div>
          ))}
        </Card>
      </>
    )}
  </>
);

const TopicPage = ({ topic, ov, onSetState, onBack, openPage, showToast }) => {
  const t = { ...topic, ...(ov || {}) };
  const staleAsk = topic.stale && !t.staleAnswered && t.state === "active";
  const [manage, setManage] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(t.name);
  const [armStop, setArmStop] = useState(false);
  const set = (patch, msg) => { onSetState(topic.id, patch); if (msg) showToast(msg, 3200); };
  const closeManage = () => { setManage(false); setRenaming(false); setArmStop(false); };
  const onStale = (v) => {
    if (v === "keep") set({ staleAnswered: true }, "Still following — Recall keeps watching for it ✓");
    if (v === "pause") set({ staleAnswered: true, state: "paused" },
      "Paused — kept, quiet. New mentions still attach ✓");
    if (v === "resolve") set({ staleAnswered: true, state: "settled", resolved: "today",
      line: `Resolved today — in your words` },
      "Resolved — the story stays. If it returns, you can reopen it ✓");
  };
  /* a manage row: label · consequence, stated BEFORE the tap lands */
  const mRow = (label, sub, onClick, red) => (
    <button className="tap" onClick={onClick} style={{ display: "block", width: "100%",
      textAlign: "left", border: "none", background: C.card, borderRadius: 12,
      padding: "13px 15px", cursor: "pointer", fontFamily: FONT, marginBottom: 8,
      boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: red ? C.red : C.ink }}>{label}</div>
      <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{sub}</div>
    </button>
  );
  return (
    <Page title={t.name} onBack={onBack}>
      <TopicBody t={t} staleAsk={staleAsk} onStale={onStale} openPage={openPage} />
      <div style={{ marginTop: 16 }}>
        <BigButton tone="tinted" icon={<Icon d={icons.list} size={17} />} onClick={() => setManage(true)}>
          Manage this topic
        </BigButton>
      </div>
      <div style={{ fontSize: 13, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "9px 6px 0" }}>
        Pause · resolve · rename · stop following — one sheet, never inline.
      </div>

      {manage && (
        <Sheet title="Manage this topic" onClose={closeManage}>
          {t.state === "settled" ? (
            mRow("Reopen this story", "A new chapter on top — history appends, never rewrites.",
              () => { set({ state: "active", staleAnswered: true }, "Reopened — the old timeline stays under the new chapter ✓"); closeManage(); })
          ) : (
            <>
              {mRow(t.state === "paused" ? "Resume following" : "Pause",
                "Kept, quiet — new mentions still attach; Recall just stops watching for them.",
                () => { set({ state: t.state === "paused" ? "active" : "paused" },
                  t.state === "paused" ? "Following again ✓" : "Paused — kept, quiet. New mentions still attach ✓"); closeManage(); })}
              {mRow("Mark it resolved", "The story stays, marked settled — reopen it if it returns.",
                () => { set({ state: "settled", resolved: "today", staleAnswered: true,
                  line: "Resolved today — by you" },
                  "Resolved — the story stays. If it returns, you can reopen it ✓"); closeManage(); })}
              {renaming ? (
                <div style={{ background: C.card, borderRadius: 12, padding: "13px 15px",
                  marginBottom: 8, boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.sub, marginBottom: 8 }}>
                    Your words for it — the old name stays in its history
                  </div>
                  <input autoFocus value={newName} aria-label="New topic name"
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.line}`,
                      borderRadius: 10, padding: "11px 12px", fontSize: 16, fontFamily: FONT,
                      background: C.bg, color: C.ink, outline: "none" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <BigButton small onClick={() => {
                      if (newName.trim()) set({ name: newName.trim() }, "Renamed — the old name stays in its history ✓");
                      closeManage();
                    }}>Save the name</BigButton>
                    <BigButton small tone="tinted" onClick={() => setRenaming(false)}>Cancel</BigButton>
                  </div>
                </div>
              ) : (
                mRow("Rename this topic", "Your words for it — the old name stays in its history.",
                  () => setRenaming(true))
              )}
              {/* destructive, isolated, and DOUBLE-gated: the first tap only
                  arms it, and the consequence is stated before the second */}
              <div style={{ height: 6 }} />
              {mRow(armStop ? "Tap again to stop following" : "Stop following",
                armStop
                  ? "This topic's page goes away. Every mention stays in your entries — nothing is deleted."
                  : "Its page goes away — every mention stays in your entries.",
                () => {
                  if (!armStop) { setArmStop(true); return; }
                  set({ state: "removed" }, "Stopped following — every mention stays in your entries ✓");
                  closeManage(); onBack();
                }, true)}
            </>
          )}
        </Sheet>
      )}
    </Page>
  );
};

const MedDetailPage = ({ med, customMeds, updateMed, showToast, onBack, notice }) => {
  const custom = med.custom ? (customMeds.find((m) => m.id === med.custom.id) || med.custom) : null;
  const [editOpen, setEditOpen] = useState(false);
  const d = custom
    ? { schedule: custom.when, origin: "Added by you, just now" }
    : MED_DETAILS[med.name] || MED_DETAILS["Metformin 500 mg"];
  const look = custom ? custom.look : MED_LOOKS[med.name] || { shape: "tablet", color: "white" };
  const col = medColor(look.color);
  const wk = trailingWeek();
  const shapeLabel = (MED_SHAPES.find(([id]) => id === look.shape) || [])[1] || "Tablet";
  return (
    <Page title="Medication" onBack={onBack}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 4px 14px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: col[2],
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MedShape shape={look.shape} color={col[1]} size={36} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.015em" }}>{med.name}</div>
          <div style={{ fontSize: 14.5, color: C.sub, marginTop: 2 }}>{d.schedule}</div>
        </div>
      </div>

      {notice && (
        <RowNotice text={notice.text} onClick={notice.onClick}
          style={{ margin: "-6px 0 8px 4px" }} />
      )}

      {d.refill && (
        <Card tone={C.redSoft} style={{ marginBottom: 12 }}>
          <Row leading={<Icon d={icons.bell} size={19} />} leadingBg="#fff" leadColor={C.red}
            title="Refill due soon" sub={d.refill} pad="2px"
            right={null} />
          <div style={{ padding: "2px 2px 4px 54px" }}>
            <BigButton small tone="tinted">Remind me</BigButton>
          </div>
        </Card>
      )}

      <SectionLabel>This week</SectionLabel>
      <Card>
        {custom || d.asNeeded || d.justAdded ? (
          <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5 }}>
            {custom?.asNeeded || d.asNeeded
              ? "As-needed — nothing scheduled. Doses you log or mention in a check-in are recorded here with their time."
              : "Tracking starts today — the first dose is already on Today's list, waiting to be crossed off."}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {d.adherence.map((f, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <DoseRing frac={f} size={32} sw={4} />
                <span style={{ fontSize: 13, color: C.sub }}>{i === 6 ? "Today" : wk[i].letter}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SectionLabel>Details — tap to change</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.meds} size={19} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
          title="Schedule" sub={d.schedule} onClick={() => setEditOpen(true)} />
        <Divider />
        <Row leading={<MedShape shape={look.shape} color={col[1]} size={24} />} leadingBg={col[2]}
          title="How it looks" sub={`${shapeLabel} · ${look.color}`} onClick={() => setEditOpen(true)} />
      </Card>

      <SectionLabel>About</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.person} size={19} />} title="Where it came from" sub={d.origin} right={null} />
        <Divider />
        <Row leading={<Icon d={icons.mic} size={19} />} title="Change it by voice"
          sub={`Just say it in a check-in: "move my ${(med.name.split(" ")[0] || "calcium").toLowerCase()} to dinnertime"`} right={null} />
      </Card>

      {editOpen && (
        <EditMedSheet med={med} custom={custom}
          onSave={(patch) => {
            if (custom) updateMed(custom.id, patch);
            setEditOpen(false);
            showToast(custom
              ? `${shortMedName(med.name)} updated ✓ — Today's list follows the new routine`
              : `${shortMedName(med.name)} updated ✓ — Recall uses the new routine from the next dose`, 3000);
          }}
          onClose={() => setEditOpen(false)} />
      )}
    </Page>
  );
};

/* ---- bottle scan — viewfinder → label lock → chips → confirm ------ */

const BottleArt = () => (
  <svg width="150" height="216" viewBox="0 0 150 216">
    <rect x="38" y="4" width="74" height="26" rx="6" fill="#F1F1F4" />
    <path d="M46 8v18M58 8v18M70 8v18M82 8v18M94 8v18M106 8v18" stroke="#D2D2D8" strokeWidth="2.5" />
    <rect x="28" y="30" width="94" height="180" rx="13" fill="#D9822B" opacity="0.94" />
    <rect x="36" y="38" width="9" height="164" rx="4.5" fill="rgba(255,255,255,.22)" />
    <rect x="36" y="72" width="78" height="102" rx="5" fill="#FFFFFF" />
    <text x="42" y="88" fontFamily={FONT} fontSize="9.5" fontWeight="800" fill="#26282C">ATORVASTATIN</text>
    <text x="42" y="99" fontFamily={FONT} fontSize="7.5" fontWeight="600" fill="#4A4C52">20 MG · 30 TABLETS</text>
    <rect x="42" y="106" width="66" height="3.2" rx="1.6" fill="#C9C9CF" />
    <rect x="42" y="113" width="58" height="3.2" rx="1.6" fill="#C9C9CF" />
    <rect x="42" y="120" width="63" height="3.2" rx="1.6" fill="#C9C9CF" />
    <rect x="42" y="132" width="44" height="3.2" rx="1.6" fill="#DDDDE2" />
    <rect x="42" y="139" width="52" height="3.2" rx="1.6" fill="#DDDDE2" />
    <g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => (
        <rect key={i} x={44 + i * 4.4} y="152" width={i % 3 === 0 ? 2.6 : 1.4} height="14" fill="#26282C" />
      ))}
    </g>
  </svg>
);

const MedScanOverlay = ({ onCancel, onConfirm }) => {
  const [stage, setStage] = useState(0); // 0 find · 1 reading · 2 parsed · 3 confirm
  const [run, setRun] = useState(0);
  useEffect(() => {
    setStage(0);
    const ts = [setTimeout(() => setStage(1), 1100), setTimeout(() => setStage(2), 2600),
      setTimeout(() => setStage(3), 4000)];
    return () => ts.forEach(clearTimeout);
  }, [run]);
  const status = ["Center the label in the frame", "Reading the label…", "Checking the details…"][stage];
  const chips = ["Atorvastatin", "20 mg", "Every evening"];
  const col = medColor(SCAN_MED.db.look.color);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0B0D10",
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 10px", flexShrink: 0 }}>
        <button className="tap" onClick={onCancel} aria-label="Cancel scan"
          style={{ width: 38, height: 38, borderRadius: 99, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,.12)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={17} sw={2.4} />
        </button>
        <div style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 16.5, fontWeight: 700, paddingRight: 38 }}>
          Scan the bottle
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", margin: "0 14px",
        borderRadius: 18, background: "radial-gradient(120% 90% at 50% 30%, #2A2E36 0%, #15171C 70%)" }}>
        <div className={stage < 3 ? "wobble" : ""} style={{ position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-52%)", transition: "filter .4s", filter: stage === 3 ? "brightness(.75)" : "none" }}>
          <BottleArt />
        </div>

        {/* bracket around the label area */}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 128, height: 128,
          transform: "translate(-50%,-46%)", pointerEvents: "none" }}>
          {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => (
            <span key={v + h} style={{ position: "absolute", [v]: 0, [h]: 0, width: 26, height: 26,
              border: `3px solid ${stage >= 1 ? "#4ADE80" : "rgba(255,255,255,.85)"}`,
              borderRadius: 6, transition: "border-color .3s",
              borderTop: v === "bottom" ? "none" : undefined, borderBottom: v === "top" ? "none" : undefined,
              borderLeft: h === "right" ? "none" : undefined, borderRight: h === "left" ? "none" : undefined }} />
          ))}
          {(stage === 1 || stage === 2) && (
            <span className="scanline" style={{ position: "absolute", left: 6, right: 6, height: 3,
              borderRadius: 99, background: "linear-gradient(90deg, transparent, #4ADE80, transparent)" }} />
          )}
        </div>

        {stage >= 2 && stage < 3 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex",
            justifyContent: "center", gap: 8, flexWrap: "wrap", padding: "0 16px" }}>
            {chips.map((c, i) => (
              <span key={c} className="chipPop" style={{ animationDelay: `${i * 0.22}s`,
                display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.94)",
                color: "#1C1C1E", borderRadius: 99, padding: "8px 13px", fontSize: 14.5, fontWeight: 700 }}>
                {c}<Icon d={icons.check} size={13} sw={3} color={C.green} />
              </span>
            ))}
          </div>
        )}

        {stage < 3 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, display: "flex", justifyContent: "center" }}>
            <span style={{ background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 99,
              padding: "9px 16px", fontSize: 14, fontWeight: 600 }}>{status}</span>
          </div>
        )}
      </div>

      {stage === 3 ? (
        <div className="sheetIn" style={{ flexShrink: 0, background: C.bg, borderRadius: "20px 20px 0 0",
          margin: "12px 0 0", padding: "18px 16px 22px", color: C.ink }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.01em", marginBottom: 12 }}>
            Here's what I read — does it look right?
          </div>
          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: col[2],
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MedShape shape={SCAN_MED.db.look.shape} color={col[1]} size={30} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Atorvastatin 20 mg</div>
                <div style={{ fontSize: 14, color: C.sub }}>{SCAN_MED.directions}</div>
              </div>
              <Icon d={icons.check} size={20} sw={2.8} color={C.green} />
            </div>
            <div style={{ fontSize: 13, color: C.ter, marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.line}` }}>
              From the label: {SCAN_MED.source}
            </div>
          </Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 12px" }}>
            <div style={{ width: 7, height: 7, borderRadius: 99, background: C.green, flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: C.sub }}>Checked your cabinet — no duplicates found.</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <BigButton onClick={onConfirm}>Use this</BigButton>
            <BigButton tone="tinted" onClick={() => setRun((r) => r + 1)}>Retake</BigButton>
          </div>
        </div>
      ) : (
        <div style={{ flexShrink: 0, padding: "14px 16px 22px", textAlign: "center" }}>
          <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)" }}>
            Names are never saved from a scan alone — you'll confirm first.
          </span>
        </div>
      )}
    </div>
  );
};

/* ---- add a medication — search/scan → dose & time → appearance ---- */

const Chip = ({ label, on, onClick }) => (
  <button className="tap" onClick={onClick} style={{ border: "none", borderRadius: 99, cursor: "pointer",
    padding: "11px 17px", fontSize: 15.5, fontWeight: 600, fontFamily: FONT,
    background: on ? C.blue : C.card, color: on ? "#fff" : C.ink,
    boxShadow: on ? "none" : "0 0 0 0.5px rgba(0,0,0,.08)" }}>
    {label}
  </button>
);

const Stepper = ({ value, onMinus, onPlus, width = 118, btn = 44, fs = 17.5 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 0, background: C.track, borderRadius: 11, flexShrink: 0 }}>
    <button className="tap" onClick={onMinus} aria-label="Decrease"
      style={{ width: btn, height: 44, border: "none", background: "none", cursor: "pointer",
        color: C.blue, fontSize: 22, fontWeight: 600, fontFamily: FONT, padding: 0 }}>−</button>
    <div style={{ width, textAlign: "center", fontSize: fs, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </div>
    <button className="tap" onClick={onPlus} aria-label="Increase"
      style={{ width: btn, height: 44, border: "none", background: "none", cursor: "pointer",
        color: C.blue, fontSize: 22, fontWeight: 600, fontFamily: FONT, padding: 0 }}>+</button>
  </div>
);

/* frequency options — deliberately four, not Apple Health's five:
   cyclical (21-on/7-off) is rare for this audience and has a voice
   fallback ("just tell Recall in a check-in"). As-needed is the one
   that matters — in the cabinet, never nagging on Today.            */
const FREQS = [
  ["daily", "Every day", "The same routine each day"],
  ["specific", "On specific days", "Only certain days of the week"],
  ["interval", "Every few days", "Every other day, every 3 days…"],
  ["asneeded", "Only as needed", "No reminders — take it when you need it"],
];

const FreqRow = ({ title, sub, on, onClick }) => (
  <button className="tap" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12,
    width: "100%", border: "none", borderRadius: 12, background: on ? C.blueSoft : C.card,
    padding: "13px 15px", marginBottom: 8, cursor: "pointer", fontFamily: FONT, textAlign: "left",
    boxShadow: on ? `0 0 0 1.5px ${C.blue}` : "0 0 0 0.5px rgba(0,0,0,.05)" }}>
    <span style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0,
      border: on ? "none" : `2px solid ${C.track}`, background: on ? C.blue : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {on && <span style={{ width: 8, height: 8, borderRadius: 99, background: "#fff", display: "block" }} />}
    </span>
    <span style={{ flex: 1 }}>
      <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: on ? C.blue : C.ink }}>{title}</span>
      <span style={{ display: "block", fontSize: 13.5, color: C.sub, marginTop: 1 }}>{sub}</span>
    </span>
  </button>
);

const TIME_PRESETS = [
  ["morning", "Morning", "8:00 AM"],
  ["midday", "Midday", "12:00 PM"],
  ["evening", "Evening", "8:00 PM"],
];
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* forName: adding INTO someone's room — same wizard, one reframed step.
   The save button names the act; reversibility is stated at the moment
   of writing; every caregiver write carries the "suggest instead" out. */
const AddMedPage = ({ onBack, onSaved, forName, onSuggestInstead }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [kb, setKb] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [med, setMed] = useState(null);
  const [fromScan, setFromScan] = useState(false);
  const [dose, setDose] = useState(null);
  const [customDose, setCustomDose] = useState(false);
  const [doseVal, setDoseVal] = useState(50);
  const [doseUnit, setDoseUnit] = useState("mg");
  const [freq, setFreq] = useState("daily");
  const [timesSel, setTimesSel] = useState(new Set());
  const [customTimeOn, setCustomTimeOn] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState("AM");
  const [days, setDays] = useState(new Set());
  const [intervalN, setIntervalN] = useState(2);
  const [withFood, setWithFood] = useState(false);
  const [shape, setShape] = useState("tablet");
  const [color, setColor] = useState("white");

  /* physical keyboard works too — the on-screen one is the phone's */
  useEffect(() => {
    if (step !== 1 || scanning) return;
    const h = (e) => {
      if (e.key === "Backspace") setQuery((q) => q.slice(0, -1));
      else if (e.key === "Enter" || e.key === "Escape") setKb(false);
      else if (/^[a-zA-Z ]$/.test(e.key)) setQuery((q) => (q + e.key).slice(0, 28));
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [step, scanning]);

  const q = query.trim().toLowerCase();
  const matches = q.length >= 2 ? MED_DB.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 5) : [];

  const whenToSel = {
    "Morning": ["morning"], "Midday": ["midday"], "Evening": ["evening"],
    "Morning & evening": ["morning", "evening"],
  };
  const pick = (m, opts = {}) => {
    setMed(m);
    setDose(opts.dose || null);
    setCustomDose(false);
    const w = opts.when || m.when;
    if (w === "As needed") {
      setFreq("asneeded"); setTimesSel(new Set());
    } else {
      setFreq("daily"); setTimesSel(new Set(whenToSel[w] || []));
    }
    setCustomTimeOn(false);
    setShape(m.look.shape);
    setColor(m.look.color);
    setFromScan(!!opts.scan);
    setKb(false);
    setScanning(false);
    setStep(2);
  };

  const doseSteps = { mg: 5, mcg: 25, IU: 250, mL: 1 };
  const finalDose = customDose ? `${doseVal} ${doseUnit}` : dose;
  const timeLabel = `${hour}:${String(minute).padStart(2, "0")} ${ampm}`;
  const timeBits = TIME_PRESETS.filter((t) => timesSel.has(t[0])).map((t) => t[1]);
  if (customTimeOn) timeBits.push(timeLabel);
  const timesLabel = timeBits.join(" & ");
  const daysLabel = DAY_NAMES.filter((_, i) => days.has(i)).join(" & ");
  const finalWhen =
    freq === "asneeded" ? "As needed"
    : freq === "daily" ? timesLabel
    : freq === "specific" ? (daysLabel && timesLabel ? `${daysLabel} · ${timesLabel}` : "")
    : timesLabel ? `Every ${intervalN} days · ${timesLabel}` : "";
  const scheduleOk = freq === "asneeded"
    || (timeBits.length > 0 && (freq !== "specific" || days.size > 0));
  const whenSaved = finalWhen + (withFood && freq !== "asneeded" ? ", with food" : "");
  const col = medColor(color);
  const toggleTime = (id) => setTimesSel((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleDay = (i) => setDays((prev) => {
    const n = new Set(prev);
    if (n.has(i)) n.delete(i); else n.add(i);
    return n;
  });

  const titles = { 1: "Add a medication", 2: "Dose", 3: "Schedule", 4: "How it looks" };
  return (
    <Page title={titles[step]} onBack={step === 1 ? onBack : () => setStep(step - 1)}>
      {step === 1 && (
        <>
          {/* search anchored TOP — the keyboard rises from the bottom,
              so results always live in the space between */}
          <div onClick={() => setKb(true)} role="textbox" aria-label="Medication name"
            style={{ display: "flex", alignItems: "center", gap: 10, background: C.card,
              borderRadius: 12, padding: "13px 13px 13px 15px", margin: "8px 0 4px", cursor: "text",
              boxShadow: kb ? `0 0 0 2px ${C.blue}` : "0 0 0 0.5px rgba(0,0,0,.06)" }}>
            <Icon d={icons.search} size={19} color={C.ter} />
            <span style={{ fontSize: 16.5, color: query ? C.ink : C.ter, fontWeight: query ? 600 : 400,
              display: "flex", alignItems: "center", minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
              {query || "Name of the medication"}
              {kb && <span className="blink" style={{ display: "inline-block", width: 2, height: 20,
                background: C.blue, marginLeft: 2, borderRadius: 1 }} />}
            </span>
            <div style={{ flex: 1 }} />
            <button className="tap" aria-label="Say the name" onClick={(e) => e.stopPropagation()}
              style={{ border: "none", background: "none", color: C.blue, cursor: "pointer", padding: 4, display: "flex" }}>
              <Icon d={icons.mic} size={19} />
            </button>
            <button className="tap" aria-label="Scan the bottle"
              onClick={(e) => { e.stopPropagation(); setKb(false); setScanning(true); }}
              style={{ border: "none", background: C.blueSoft, color: C.blue, cursor: "pointer",
                padding: 8, borderRadius: 9, display: "flex" }}>
              <Icon d={icons.camera} size={19} />
            </button>
          </div>

          {matches.length > 0 ? (
            <>
              <div style={{ fontSize: 13.5, color: C.ter, padding: "6px 6px 8px" }}>
                {matches.length} match{matches.length > 1 ? "es" : ""} — keep typing to narrow it down
              </div>
              <Card style={{ padding: "4px 14px" }}>
                {matches.map((m, i) => {
                  const mi = m.name.toLowerCase().indexOf(q);
                  const mcol = medColor(m.look.color);
                  return (
                    <div key={m.name}>
                      {i > 0 && <Divider />}
                      <Row leading={<MedShape shape={m.look.shape} color={mcol[1]} size={26} />} leadingBg={mcol[2]}
                        title={
                          <>
                            {m.name.slice(0, mi)}
                            <span style={{ color: C.blue }}>{m.name.slice(mi, mi + q.length)}</span>
                            {m.name.slice(mi + q.length)}
                          </>
                        }
                        sub={`${m.form} · common: ${m.doses.join(", ")}`}
                        onClick={() => pick(m)} />
                    </div>
                  );
                })}
              </Card>
            </>
          ) : q.length >= 2 ? (
            <Card style={{ marginTop: 8 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 4 }}>No match for "{query}"</div>
              <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5 }}>
                Check the spelling — or scan the bottle below and let Recall read the label instead.
              </div>
            </Card>
          ) : (
            <div style={{ fontSize: 13.5, color: C.ter, padding: "6px 6px 2px" }}>
              Start typing — suggestions appear after a couple of letters.
            </div>
          )}

          <div style={{ height: 10 }} />
          <Card onClick={() => { setKb(false); setScanning(true); }}
            style={{ boxShadow: `0 0 0 1.5px ${C.blue}` }}>
            <Row leading={<Icon d={icons.camera} size={20} />} title="Scan the bottle instead"
              sub="Point the camera at the label — Recall reads the name, strength and directions." />
          </Card>

          {kb && (
            <FakeKeyboard
              onKey={(ch) => setQuery((v) => (v + ch).slice(0, 28))}
              onBackspace={() => setQuery((v) => v.slice(0, -1))}
              onDone={() => setKb(false)} />
          )}
          {scanning && (
            <MedScanOverlay onCancel={() => setScanning(false)}
              onConfirm={() => pick(SCAN_MED.db, { dose: SCAN_MED.dose, when: SCAN_MED.when, scan: true })} />
          )}
        </>
      )}

      {step === 2 && med && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px 4px" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: col[2],
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MedShape shape={shape} color={col[1]} size={30} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em" }}>{med.name}</div>
              {fromScan && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 3,
                  background: C.greenSoft, color: C.greenInk, borderRadius: 99, padding: "4px 10px",
                  fontSize: 12.5, fontWeight: 700 }}>
                  <Icon d={icons.camera} size={13} />Read from the bottle — check it over
                </span>
              )}
            </div>
          </div>

          <SectionLabel>How strong is each one?</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {med.doses.map((o) => (
              <Chip key={o} label={o} on={!customDose && dose === o}
                onClick={() => { setDose(o); setCustomDose(false); }} />
            ))}
            <Chip label="Custom…" on={customDose}
              onClick={() => { setCustomDose(true); setDose(null); }} />
          </div>
          {customDose && (
            <Card style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Exact dose</span>
                <Stepper value={`${doseVal} ${doseUnit}`}
                  onMinus={() => setDoseVal((v) => Math.max(doseSteps[doseUnit], v - doseSteps[doseUnit]))}
                  onPlus={() => setDoseVal((v) => v + doseSteps[doseUnit])} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["mg", "mcg", "IU", "mL"].map((u) => (
                  <Chip key={u} label={u} on={doseUnit === u} onClick={() => setDoseUnit(u)} />
                ))}
              </div>
              <div style={{ fontSize: 13.5, color: C.ter, marginTop: 10 }}>
                Steps of {doseSteps[doseUnit]} {doseUnit} — no typing needed.
              </div>
            </Card>
          )}
          <div style={{ fontSize: 13.5, color: C.ter, padding: "12px 6px 0", lineHeight: 1.45 }}>
            The strength is printed on the label — usually right after the name.
          </div>

          <div style={{ marginTop: 16, opacity: finalDose ? 1 : 0.45 }}>
            <BigButton onClick={() => finalDose && setStep(3)}>Next — the schedule</BigButton>
          </div>
        </>
      )}

      {step === 3 && med && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px 2px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: col[2],
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MedShape shape={shape} color={col[1]} size={24} />
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 700 }}>{med.name} {finalDose}</div>
          </div>

          <SectionLabel>How often?</SectionLabel>
          {FREQS.map(([id, title, sub]) => (
            <FreqRow key={id} title={title} sub={sub} on={freq === id} onClick={() => setFreq(id)} />
          ))}

          {freq === "specific" && (
            <>
              <SectionLabel>On which days?</SectionLabel>
              <Card style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {DAY_LETTERS.map((d, i) => (
                    <button key={i} className="tap" onClick={() => toggleDay(i)} aria-label={DAY_NAMES[i]}
                      style={{ width: 42, height: 42, borderRadius: 99, border: "none", cursor: "pointer",
                        fontFamily: FONT, fontSize: 14.5, fontWeight: 700,
                        background: days.has(i) ? C.blue : "#F2F2F7",
                        color: days.has(i) ? "#fff" : C.ink }}>
                      {d}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", marginTop: 10 }}>
                  {days.size === 0 ? "Tap the days it belongs to." : daysLabel}
                </div>
              </Card>
            </>
          )}

          {freq === "interval" && (
            <>
              <SectionLabel>How many days apart?</SectionLabel>
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 600 }}>Every</span>
                  <Stepper width={34} btn={40} value={intervalN}
                    onMinus={() => setIntervalN((v) => Math.max(2, v - 1))}
                    onPlus={() => setIntervalN((v) => Math.min(14, v + 1))} />
                  <span style={{ fontSize: 16.5, fontWeight: 600 }}>days</span>
                </div>
                <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", marginTop: 10 }}>
                  {intervalN === 2 ? '"Every 2 days" means every other day.' : `One dose, then ${intervalN - 1} days off.`}
                </div>
              </Card>
            </>
          )}

          {freq === "asneeded" ? (
            <Card tone={C.blueSoft} style={{ marginTop: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <RecallOrb size={36} />
                <div style={{ fontSize: 14.5, color: C.blueDeep, lineHeight: 1.5 }}>
                  It stays in your cabinet, but won't appear on Today's list and Recall won't remind you.
                  When you do take one, just mention it in a check-in — "I took a Tylenol after lunch" —
                  and it's recorded with the time.
                </div>
              </div>
            </Card>
          ) : (
            <>
              <SectionLabel>At what time?</SectionLabel>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TIME_PRESETS.map(([id, label, time]) => (
                  <Chip key={id} label={`${label} · ${time}`} on={timesSel.has(id)}
                    onClick={() => toggleTime(id)} />
                ))}
                <Chip label="Exact time…" on={customTimeOn}
                  onClick={() => setCustomTimeOn(!customTimeOn)} />
              </div>
              <div style={{ fontSize: 13.5, color: C.ter, padding: "8px 6px 0" }}>
                Pick more than one for a twice-a-day routine.
              </div>
              {customTimeOn && (
                <Card style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, flexWrap: "wrap" }}>
                    <Stepper width={30} btn={36} value={hour}
                      onMinus={() => setHour((h) => (h === 1 ? 12 : h - 1))}
                      onPlus={() => setHour((h) => (h === 12 ? 1 : h + 1))} />
                    <span style={{ fontSize: 19, fontWeight: 700 }}>:</span>
                    <Stepper width={34} btn={36} value={String(minute).padStart(2, "0")}
                      onMinus={() => setMinute((m) => (m === 0 ? 45 : m - 15))}
                      onPlus={() => setMinute((m) => (m === 45 ? 0 : m + 15))} />
                    <div style={{ width: 100, flexShrink: 0 }}>
                      <Seg options={["AM", "PM"]} value={ampm} onChange={setAmpm} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", marginTop: 10 }}>
                    Recall reminds you at {timeLabel}.
                  </div>
                </Card>
              )}

              <div style={{ marginTop: 12 }}>
                <Card onClick={() => setWithFood(!withFood)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      border: withFood ? "none" : `2px solid ${C.ctrl}`,
                      background: withFood ? C.green : "#fff", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {withFood && <Icon d={icons.check} size={14} sw={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>Take with food</div>
                      <div style={{ fontSize: 13.5, color: C.sub }}>Recall will mention it in the reminder</div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          <div style={{ marginTop: 16, opacity: scheduleOk ? 1 : 0.45 }}>
            <BigButton onClick={() => scheduleOk && setStep(4)}>Next — how it looks</BigButton>
          </div>
          {!scheduleOk && (
            <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "10px 6px" }}>
              {freq === "specific" && days.size === 0 ? "Pick at least one day and one time." : "Pick at least one time."}
            </div>
          )}
        </>
      )}

      {step === 4 && med && (
        <>
          <Card style={{ marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0 6px" }}>
              <div style={{ width: 96, height: 96, borderRadius: 26, background: col[2],
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,.05)" }}>
                <MedShape shape={shape} color={col[1]} size={64} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{med.name} {finalDose}</div>
                <div style={{ fontSize: 14, color: C.sub, marginTop: 2 }}>{whenSaved}</div>
              </div>
            </div>
          </Card>

          <SectionLabel>Shape</SectionLabel>
          <Card style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {MED_SHAPES.map(([id, label]) => (
                <button key={id} className="tap" onClick={() => setShape(id)} aria-label={label}
                  style={{ border: "none", cursor: "pointer", fontFamily: FONT, padding: "7px 2px",
                    borderRadius: 12, width: 54, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4,
                    background: shape === id ? C.blueSoft : "transparent" }}>
                  <MedShape shape={id} color={shape === id ? col[1] : "#C7C7CE"} size={30} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: shape === id ? C.blue : C.sub }}>{label}</span>
                </button>
              ))}
            </div>
          </Card>

          <SectionLabel>Color</SectionLabel>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6px" }}>
              {MED_COLORS.map(([id, hex]) => (
                <button key={id} className="tap" onClick={() => setColor(id)} aria-label={id}
                  style={{ width: 40, height: 40, borderRadius: 99, cursor: "pointer",
                    background: hex,
                    border: color === id ? `3px solid ${C.ink}` : id === "white" ? `2px solid ${C.line}` : "2px solid transparent",
                    boxShadow: color === id ? "none" : "0 1px 3px rgba(0,0,0,.12)" }} />
              ))}
            </div>
            <div style={{ fontSize: 14, color: C.sub, textAlign: "center", marginTop: 12, lineHeight: 1.45 }}>
              Match the real pill — this is how it appears in your cabinet, on Today, and in reminders.
            </div>
          </Card>

          <div style={{ marginTop: 16 }}>
            <BigButton onClick={() => onSaved({
              id: `custom-${med.name}-${finalDose}`.replace(/\s/g, ""),
              name: med.name, dose: finalDose, when: whenSaved, look: { shape, color },
              asNeeded: freq === "asneeded",
              slots: freq === "asneeded" ? [] : [
                ...TIME_PRESETS.filter((t) => timesSel.has(t[0]))
                  .map(([k, label, time]) => ({ key: k, label, time, order: SLOTS[k].order })),
                ...(customTimeOn ? [{
                  key: `t-${timeLabel}`, label: timeLabel, time: "",
                  order: (ampm === "PM" && hour !== 12 ? hour + 12 : ampm === "AM" && hour === 12 ? 0 : hour) + minute / 60,
                }] : []),
              ],
            })}>
              {forName ? `Add for ${forName}` : "Save to my cabinet"}
            </BigButton>
          </div>
          {forName && (
            <>
              <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "8px 6px 0" }}>
                Applies right away — {forName} sees it and can undo.
              </div>
              <button className="tap" onClick={onSuggestInstead} style={{ display: "block", margin: "6px auto 0",
                border: "none", background: "none", color: C.blue, fontSize: 14.5, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, padding: "8px 10px" }}>
                Not sure? Send it as a suggestion instead
              </button>
            </>
          )}
          <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "10px 6px" }}>
            {med.name} · {finalDose} · {whenSaved} — you can change any of this later.
          </div>
        </>
      )}
    </Page>
  );
};

/* ---- add an upcoming appointment — who → when → what for ---------- */
/* A page, not a sheet (elderly doctrine: big Back, no accidental      */
/* dismissal). Three visible steps; the new-doctor branch and its      */
/* specialty question are folded INSIDE step one, so a known doctor    */
/* never sees them — picking Dr. Chen answers "who" and "what kind"    */
/* in one tap. Nothing here is required except who and roughly when:   */
/* "no date yet" is a first-class answer (real appointments spend      */
/* weeks as "October, date to confirm"), and the focus question is     */
/* skippable — the brief builds from check-ins either way.             */

const upvStepNo = { who: 1, newdoc: 1, spec: 1, when: 2, why: 3 };
const upvCap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const AddVisitPage = ({ onBack, onSaved }) => {
  const [step, setStep] = useState("who");
  const [doc, setDoc] = useState(null);
  const [typed, setTyped] = useState("");
  const [specQ, setSpecQ] = useState("");
  const [dayIdx, setDayIdx] = useState(6);
  const [timeIdx, setTimeIdx] = useState(5);
  const [noDate, setNoDate] = useState(false);
  const [concern, setConcern] = useState(null);
  const [typing, setTyping] = useState(false);   /* why-step keyboard open */
  const [saying, setSaying] = useState(false);   /* why-step dictation */

  const back = () => {
    if (step === "who") return onBack();
    if (step === "newdoc") return setStep("who");
    if (step === "spec") { setSpecQ(""); return setStep("newdoc"); }
    if (step === "when") return setStep(doc && !doc.known ? (doc.fromDirectory ? "newdoc" : "spec") : "who");
    if (step === "why") { setTyping(false); setSaying(false); return setStep("when"); }
  };

  const specLabel = (spec) => (spec ? spec.split(" · ").pop() : null);
  const save = (withConcern) => {
    const label = specLabel(doc.spec);
    const soon = !noDate && dayIdx < 14;
    onSaved({
      title: label ? `${doc.name} · ${label}` : doc.name,
      date: noDate ? "Date to confirm — being scheduled" : `${UPV_DAYS[dayIdx]} · ${UPV_TIMES[timeIdx]}`,
      briefLine: noDate ? "Brief: starts when the date is set" : soon ? "Brief just started" : "Brief: starts building two weeks before",
      focus: withConcern ? concern : null,
      patterns: [], questions: [], docs: [],
      note: soon
        ? "Added by you just now. The visit is close, so the brief is already collecting — your check-ins from here fill it, and Recall assembles the readable version the day before."
        : "Added by you just now. Check-ins from two weeks out fill the brief; Recall assembles the readable version the day before.",
    });
  };

  const sugg = typed.trim().length >= 2
    ? DOCTOR_DIRECTORY.filter((d) => d.name.toLowerCase().includes(typed.trim().toLowerCase()))
    : [];

  return (
    <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 40, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 10px 4px", flexShrink: 0 }}>
        <button className="tap" onClick={back} aria-label="Back"
          style={{ border: "none", background: "none", color: C.blue, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 1, fontFamily: FONT,
            fontSize: 17, fontWeight: 600, padding: "11px 10px 11px 6px" }}>
          <Icon d={icons.back} size={22} sw={2.4} />Back
        </button>
        <div style={{ fontSize: 17.5, fontWeight: 700, flex: 1, textAlign: "center" }}>New visit</div>
        <div style={{ width: 72, textAlign: "right", paddingRight: 12, fontSize: 13.5,
          color: C.ter, fontWeight: 600 }}>{upvStepNo[step]} of 3</div>
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: "auto",
        padding: `8px 16px ${step === "newdoc" || step === "spec" || (step === "why" && typing) ? 250 : 26}px` }}>
        {step === "who" && (
          <div className="stepIn">
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", padding: "6px 4px 2px" }}>
              Who is the visit with?
            </div>
            <div style={{ fontSize: 14.5, color: C.sub, padding: "0 4px 14px" }}>
              Recall already knows your doctors — one tap says who and what kind.
            </div>
            <Card>
              {DOCTOR_BOOK.map((d, i) => (
                <div key={d.id}>
                  {i > 0 && <Divider />}
                  <Row
                    leading={<span style={{ width: 36, height: 36, borderRadius: 99, background: d.tone,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700 }}>{d.name.replace("Dr. ", "")[0]}</span>}
                    leadingBg="transparent"
                    title={d.name} sub={`${d.spec} · ${d.from}`}
                    onClick={() => { setDoc({ ...d, known: true }); setStep("when"); }} />
                </div>
              ))}
            </Card>
            <div style={{ height: 10 }} />
            <Card>
              <Row leading={<Icon d={icons.plus} size={20} sw={2.2} />} title="Someone new"
                sub="A doctor or clinic Recall hasn't met yet"
                onClick={() => { setTyped(""); setStep("newdoc"); }} />
            </Card>
          </div>
        )}

        {step === "newdoc" && (
          <div className="stepIn">
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", padding: "6px 4px 2px" }}>
              Who are they?
            </div>
            <div style={{ fontSize: 14.5, color: C.sub, padding: "0 4px 14px" }}>
              Type the doctor's name — matches bring their specialty with them.
            </div>
            <Card style={{ padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon d={icons.search} size={17} color={C.ter} />
                <div style={{ fontSize: 17.5, minHeight: 24 }}>
                  {typed ? <b>Dr. {upvCap(typed)}</b> : <span style={{ color: C.ter }}>Doctor's name</span>}
                  <span className="blink" style={{ display: "inline-block", width: 2, height: 18,
                    background: C.blue, marginLeft: 2, verticalAlign: "-3px" }} />
                </div>
              </div>
            </Card>
            {sugg.length > 0 && (
              <Card style={{ marginBottom: 10 }}>
                {sugg.map((d, i) => (
                  <div key={d.name} className="stepIn">
                    {i > 0 && <Divider />}
                    <Row leading={<Icon d={icons.person} size={19} />} title={d.name}
                      sub={`${d.spec} · ${d.place}`}
                      onClick={() => { setDoc({ ...d, known: false, fromDirectory: true }); setStep("when"); }} />
                  </div>
                ))}
              </Card>
            )}
            {typed.trim().length >= 2 && (
              <Card>
                <Row leading={<Icon d={icons.pencil} size={18} />}
                  title={`Use “Dr. ${upvCap(typed.trim())}”`} sub="Not in the directory — you'll say what kind of doctor next"
                  onClick={() => { setDoc({ name: `Dr. ${upvCap(typed.trim())}`, spec: null, known: false }); setStep("spec"); }} />
              </Card>
            )}
          </div>
        )}

        {step === "spec" && (() => {
          const q = specQ.trim().toLowerCase();
          const specs = q ? SPEC_LIST.filter((r) => `${r.l} ${r.s}`.toLowerCase().includes(q)) : SPEC_LIST;
          return (
            <div className="stepIn">
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", padding: "6px 4px 2px" }}>
                What kind of doctor is {doc.name}?
              </div>
              <div style={{ fontSize: 14.5, color: C.sub, padding: "0 4px 14px" }}>
                Body part is enough — the medical word rides along.
              </div>
              <Card style={{ padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Icon d={icons.search} size={17} color={C.ter} />
                  <div style={{ fontSize: 16.5, minHeight: 24, flex: 1 }}>
                    {specQ ? specQ : <span style={{ color: C.ter }}>Search — “skin”, “derm”, “heart”…</span>}
                    <span className="blink" style={{ display: "inline-block", width: 2, height: 18,
                      background: C.blue, marginLeft: 2, verticalAlign: "-3px" }} />
                  </div>
                  <button className="tap" onClick={() => setStep("when")}
                    style={{ border: "none", background: "none", color: C.blue, fontSize: 14,
                      fontWeight: 600, cursor: "pointer", fontFamily: FONT, padding: "4px 2px",
                      flexShrink: 0 }}>
                    Skip
                  </button>
                </div>
              </Card>
              {specs.length > 0 ? (
                <Card>
                  {specs.map((r, i) => (
                    <div key={r.l}>
                      {i > 0 && <Divider />}
                      <Row leading={<Icon d={icons[r.i]} size={20} />} title={r.l} sub={r.s}
                        onClick={() => { setDoc((p) => ({ ...p, spec: r.spec })); setSpecQ(""); setStep("when"); }} />
                    </div>
                  ))}
                </Card>
              ) : (
                <EmptyHint>Nothing matches “{specQ}” — Skip is fine; a check-in can settle it later.</EmptyHint>
              )}
            </div>
          );
        })()}

        {step === "when" && (
          <div className="stepIn">
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", padding: "6px 4px 2px" }}>
              When is it?
            </div>
            <div style={{ fontSize: 14.5, color: C.sub, padding: "0 4px 14px" }}>
              {doc.name}{doc.spec ? ` · ${doc.spec}` : ""}
            </div>
            <Card>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1.6 }}><ObWheel options={UPV_DAYS} index={dayIdx} onChange={setDayIdx} /></div>
                <div style={{ flex: 1 }}><ObWheel options={UPV_TIMES} index={timeIdx} onChange={setTimeIdx} /></div>
              </div>
            </Card>
            <div style={{ height: 14 }} />
            <BigButton onClick={() => { setNoDate(false); setStep("why"); }}>Continue</BigButton>
            <button className="tap" onClick={() => { setNoDate(true); setStep("why"); }}
              style={{ display: "block", margin: "12px auto 0", border: "none", background: "none",
                color: C.blue, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                padding: "10px 14px" }}>
              No date yet — it's being scheduled
            </button>
          </div>
        )}

        {step === "why" && (
          <div className="stepIn">
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.02em", padding: "6px 4px 2px" }}>
              What's this visit about?
            </div>
            <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, padding: "0 4px 14px" }}>
              Doctors call it the reason for visit — it opens the brief. Your check-ins build
              the rest, starting two weeks before.
            </div>

            {/* the reason, once it exists — picked, said, or typed, it
                lands in the same slot, clearable, editable by retyping */}
            {(concern !== null || typing) && (
              <Card tone={C.purpleSoft} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.purpleInk,
                  textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>
                  Reason for visit
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 16, lineHeight: 1.5, color: C.ink }}>
                    {concern || <span style={{ color: C.ter }}>Type it…</span>}
                    {typing && <span className="blink" style={{ display: "inline-block", width: 2,
                      height: 17, background: C.blue, marginLeft: 2, verticalAlign: "-3px" }} />}
                  </div>
                  <button className="tap" aria-label="Clear the reason"
                    onClick={() => { setConcern(null); setTyping(false); }}
                    style={{ width: 32, height: 32, borderRadius: 99, border: "none",
                      background: C.card, color: C.sub, cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon d={icons.close} size={13} sw={2.4} />
                  </button>
                </div>
              </Card>
            )}

            {saying ? (
              <Card tone={C.greenSoft} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ display: "flex", gap: 3, alignItems: "center", height: 22 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="wavebar" style={{ height: 8 + (i % 2) * 9,
                        animationDelay: `${i * 0.12}s`, background: C.green }} />
                    ))}
                  </span>
                  <div style={{ fontSize: 15, color: C.greenInk, fontWeight: 600 }}>
                    Listening — say it like you'd tell the receptionist…
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* say it leads — talking is this product's native input;
                    typing rides beside it, never above it */}
                {!typing && (
                  <div style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
                    <button className="tap"
                      onClick={() => {
                        setTyping(false);
                        setSaying(true);
                        setTimeout(() => { setSaying(false); setConcern(VISIT_SAY_LINE); buzz(); }, 1800);
                      }}
                      style={{ flex: 1.35, minHeight: 52, borderRadius: 13, border: "none",
                        background: C.greenSoft, color: C.greenInk, fontSize: 15.5, fontWeight: 600,
                        cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8 }}>
                      <Icon d={icons.mic} size={17} />Say it
                    </button>
                    <button className="tap"
                      onClick={() => { setConcern(concern || ""); setTyping(true); }}
                      style={{ flex: 1, minHeight: 52, borderRadius: 13, border: "none",
                        background: C.card, color: C.ink, fontSize: 15, fontWeight: 600,
                        cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 8,
                        boxShadow: "0 0 0 0.5px rgba(0,0,0,.08)" }}>
                      ⌨ Type it
                    </button>
                  </div>
                )}
                {/* the threads the record is already carrying — rows with
                    receipts, so picking one feels like Recall remembering */}
                <SectionLabel>From your check-ins</SectionLabel>
                <Card>
                  {REASON_THREADS.map((r, i) => (
                    <div key={r.t}>
                      {i > 0 && <Divider />}
                      <Row leading={<Icon d={icons.pattern} size={19} />} leadingBg={C.orangeSoft}
                        leadColor={C.orangeInk} title={r.t} sub={r.s}
                        right={concern === r.t
                          ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} />
                          : null}
                        onClick={() => { setTyping(false); setConcern(concern === r.t ? null : r.t); }} />
                    </div>
                  ))}
                </Card>
                <SectionLabel>Common reasons</SectionLabel>
                <Card style={{ marginBottom: 16 }}>
                  {REASON_COMMON.map((r, i) => (
                    <div key={r.t}>
                      {i > 0 && <Divider />}
                      <Row leading={<Icon d={icons[r.icon]} size={19} />} title={r.t}
                        right={concern === r.t
                          ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} />
                          : null}
                        onClick={() => { setTyping(false); setConcern(concern === r.t ? null : r.t); }} />
                    </div>
                  ))}
                </Card>
              </>
            )}

            <BigButton onClick={() => save(!!concern)}>Add the visit</BigButton>
            {!concern && !typing && (
              <button className="tap" onClick={() => save(false)}
                style={{ display: "block", margin: "12px auto 0", border: "none", background: "none",
                  color: C.blue, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                  padding: "10px 14px" }}>
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>

      {step === "newdoc" && (
        <FakeKeyboard
          onKey={(k) => setTyped((t) => (t + k).slice(0, 24))}
          onBackspace={() => setTyped((t) => t.slice(0, -1))}
          onDone={() => {
            if (sugg.length === 1) { setDoc({ ...sugg[0], known: false, fromDirectory: true }); setStep("when"); }
            else if (typed.trim().length >= 2) { setDoc({ name: `Dr. ${upvCap(typed.trim())}`, spec: null, known: false }); setStep("spec"); }
          }} />
      )}
      {step === "spec" && (
        <FakeKeyboard
          onKey={(k) => setSpecQ((t) => (t + k).slice(0, 24))}
          onBackspace={() => setSpecQ((t) => t.slice(0, -1))}
          onDone={() => {
            const q = specQ.trim().toLowerCase();
            const hits = q ? SPEC_LIST.filter((r) => `${r.l} ${r.s}`.toLowerCase().includes(q)) : [];
            if (hits.length === 1) { setDoc((p) => ({ ...p, spec: hits[0].spec })); setSpecQ(""); setStep("when"); }
          }} />
      )}
      {step === "why" && typing && (
        <FakeKeyboard
          onKey={(k) => setConcern((t) => ((t || "") + k).slice(0, 90))}
          onBackspace={() => setConcern((t) => (t || "").slice(0, -1))}
          onDone={() => { setTyping(false); if (!concern) setConcern(null); else setConcern(upvCap(concern)); }} />
      )}
    </div>
  );
};

/* ---- document scanner — edge lock → auto-capture → page stack ----- */

const PaperArt = ({ page = 1 }) => (
  <div style={{ width: 196, aspectRatio: "17 / 22", background: "#FAF9F6", borderRadius: 3,
    boxShadow: "0 10px 30px rgba(0,0,0,.5)", padding: "16px 15px",
    display: "flex", flexDirection: "column", gap: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ width: 82, height: 7, borderRadius: 2, background: "#3D4448" }} />
      <div style={{ width: 16, height: 16, borderRadius: 3, background: "#3E6FA8" }} />
    </div>
    <div style={{ width: "58%", height: 4, borderRadius: 2, background: "#C9C7C0" }} />
    <div style={{ height: 5 }} />
    {(page === 1 ? [88, 72, 80, 64, 76, 58] : [70, 84, 60, 78, 52, 66]).map((w, i) => (
      <div key={i} style={{ width: `${w}%`, height: 4, borderRadius: 2, background: "#D8D6CF" }} />
    ))}
    <div style={{ height: 6 }} />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{ display: "flex", gap: 8 }}>
        <div style={{ width: "34%", height: 4, borderRadius: 2, background: "#C9C7C0" }} />
        <div style={{ width: "18%", height: 4, borderRadius: 2, background: i === 2 && page === 1 ? "#E2A23B" : "#D8D6CF" }} />
        <div style={{ width: "22%", height: 4, borderRadius: 2, background: "#E4E2DC" }} />
      </div>
    ))}
    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between" }}>
      <div style={{ width: "30%", height: 4, borderRadius: 2, background: "#E4E2DC" }} />
      <div style={{ width: "12%", height: 4, borderRadius: 2, background: "#E4E2DC" }} />
    </div>
  </div>
);

const DocScanOverlay = ({ onCancel, onDone }) => {
  const [locked, setLocked] = useState(false);
  const [captures, setCaptures] = useState(0);
  const [flash, setFlash] = useState(0);
  const capture = () => {
    setFlash((f) => f + 1);
    setCaptures((c) => c + 1);
  };
  useEffect(() => {
    const t1 = setTimeout(() => setLocked(true), 1300);
    const t2 = setTimeout(capture, 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const hint = !locked ? "Looking for a page…"
    : captures === 0 ? "Hold steady — capturing automatically"
    : "Got it. Flip the page and hold steady, or finish.";
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "#0B0D10",
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 10px", flexShrink: 0 }}>
        <button className="tap" onClick={onCancel} aria-label="Cancel scan"
          style={{ width: 38, height: 38, borderRadius: 99, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,.12)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={17} sw={2.4} />
        </button>
        <div style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 16.5, fontWeight: 700 }}>
          Scan documents
        </div>
        <span style={{ width: 38, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#F5C842" }}>Auto</span>
      </div>

      <div style={{ flex: 1, position: "relative", overflow: "hidden", margin: "0 14px", borderRadius: 18,
        background: "linear-gradient(160deg, #46392E 0%, #2D251E 60%, #201A15 100%)" }}>
        <div className={captures === 0 ? "wobble" : ""} style={{ position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-52%)" }}>
          <div style={{ position: "relative", transform: "rotate(-2.5deg)" }}>
            <PaperArt page={captures === 0 ? 1 : 2} />
            {locked && (
              <div className="quadPulse" style={{ position: "absolute", inset: -7, borderRadius: 6,
                border: "2.5px solid #4DA3FF", background: "rgba(0,122,255,.13)", pointerEvents: "none" }}>
                {[["-6px", "-6px"], ["-6px", "auto"], ["auto", "-6px"], ["auto", "auto"]].map(([t, l], i) => (
                  <span key={i} style={{ position: "absolute", top: t, left: l,
                    bottom: t === "auto" ? "-6px" : "auto", right: l === "auto" ? "-6px" : "auto",
                    width: 12, height: 12, borderRadius: 99, background: "#4DA3FF" }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {flash > 0 && <div key={flash} className="flashFade" style={{ position: "absolute", inset: 0, background: "#fff" }} />}

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, display: "flex", justifyContent: "center" }}>
          <span style={{ background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 99,
            padding: "9px 16px", fontSize: 14, fontWeight: 600 }}>{hint}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "16px 26px 24px" }}>
        <div style={{ width: 64, display: "flex", justifyContent: "flex-start" }}>
          {captures > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{ width: 42, height: 54, borderRadius: 5, background: "#FAF9F6",
                boxShadow: "0 2px 8px rgba(0,0,0,.5), 3px -3px 0 -1px #DDDBD4", display: "flex",
                flexDirection: "column", gap: 3, padding: "7px 6px" }}>
                {[80, 60, 74, 52].map((w, i) => (
                  <div key={i} style={{ width: `${w}%`, height: 2.5, borderRadius: 2, background: "#C9C7C0" }} />
                ))}
              </div>
              <span style={{ position: "absolute", top: -7, right: -7, minWidth: 20, height: 20,
                borderRadius: 99, background: C.blue, color: "#fff", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {captures}
              </span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <button className="tap" onClick={() => locked && capture()} aria-label="Capture page"
            style={{ width: 66, height: 66, borderRadius: 99, cursor: "pointer",
              border: "4px solid #fff", background: "rgba(255,255,255,.25)", padding: 4 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#fff" }} />
          </button>
        </div>
        <div style={{ width: 64, display: "flex", justifyContent: "flex-end" }}>
          <button className="tap" onClick={() => captures > 0 && onDone(captures)}
            style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 17, fontWeight: 700, color: captures > 0 ? "#4DA3FF" : "rgba(255,255,255,.35)" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---- the scanned original — a real page, not a placeholder -------- */

const LAB_ROWS = [
  ["Glucose, fasting", "94 mg/dL", "70–99", ""],
  ["Hemoglobin A1c", "5.6 %", "4.0–5.6", ""],
  ["Cholesterol, total", "182 mg/dL", "< 200", ""],
  ["HDL cholesterol", "58 mg/dL", "> 40", ""],
  ["LDL (calculated)", "102 mg/dL", "< 130", ""],
  ["Triglycerides", "110 mg/dL", "< 150", ""],
  ["Vitamin D, 25-OH", "18 ng/mL", "30–100", "LOW"],
  ["TSH", "2.1 mIU/L", "0.4–4.9", ""],
];

const LabDoc = ({ highlight }) => (
  <div style={{ background: "#FFFFFF", width: "100%", aspectRatio: "17 / 22", padding: "7.5% 7.5% 6%",
    color: "#26282C", display: "flex", flexDirection: "column",
    fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em" }}>RIVERSIDE MEDICAL LABORATORY</div>
        <div style={{ fontSize: 8, color: "#6B6E76", marginTop: 2 }}>420 Riverbank Ave · (555) 013-4432 · CLIA 22-D0666
        </div>
      </div>
      <div style={{ width: 22, height: 22, borderRadius: 4, background: "#3E6FA8", flexShrink: 0 }} />
    </div>
    <div style={{ height: 2, background: "#26282C", margin: "8px 0" }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, lineHeight: 1.6 }}>
      <div>
        <div><b>Patient:</b> Amma Naidoo</div>
        <div><b>DOB:</b> 03/12/1952 · F</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div><b>Collected:</b> Mar 14, 2026 · 8:12 AM</div>
        <div><b>Ordered by:</b> R. Patel, MD</div>
      </div>
    </div>
    <div style={{ marginTop: 10, fontFamily: FONT }}>
      <div style={{ display: "flex", fontSize: 8, fontWeight: 700, color: "#54575F",
        borderBottom: "1px solid #B9BBC2", paddingBottom: 3 }}>
        <span style={{ flex: 2.2 }}>TEST</span>
        <span style={{ flex: 1.3 }}>RESULT</span>
        <span style={{ flex: 1.2 }}>REFERENCE</span>
        <span style={{ flex: 0.7, textAlign: "right" }}>FLAG</span>
      </div>
      {LAB_ROWS.map(([test, result, ref, flag]) => (
        <div key={test} style={{ display: "flex", fontSize: 8.5, padding: "3.5px 2px",
          alignItems: "center", borderBottom: "0.5px solid #ECECEF",
          background: flag ? "#FFF3DC" : "transparent", borderRadius: flag ? 3 : 0,
          outline: flag && highlight ? `2px solid ${C.orange}` : "none", outlineOffset: -1 }}>
          <span style={{ flex: 2.2, fontWeight: flag ? 700 : 400 }}>{test}</span>
          <span style={{ flex: 1.3, fontWeight: flag ? 700 : 400 }}>{result}</span>
          <span style={{ flex: 1.2, color: "#6B6E76" }}>{ref}</span>
          <span style={{ flex: 0.7, textAlign: "right", fontWeight: 800, color: "#B25000" }}>{flag}</span>
        </div>
      ))}
    </div>
    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between",
      fontSize: 7.5, color: "#6B6E76", fontStyle: "italic" }}>
      <span>Electronically reviewed · R. Patel, MD</span>
      <span>Page 1 of 2</span>
    </div>
  </div>
);

/* full-screen viewer — the pattern is a lightbox, not a bigger square */
const DocViewerOverlay = ({ title, onClose }) => {
  const [zoom, setZoom] = useState(false);
  const taps = useRef(0);
  const onTap = () => {
    taps.current += 1;
    setTimeout(() => {
      if (taps.current >= 2) setZoom((z) => !z);
      taps.current = 0;
    }, 240);
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 45, background: "#101216",
      display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 10px", flexShrink: 0 }}>
        <button className="tap" onClick={onClose} aria-label="Close viewer"
          style={{ width: 38, height: 38, borderRadius: 99, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,.12)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={17} sw={2.4} />
        </button>
        <div style={{ flex: 1, textAlign: "center", paddingRight: 38 }}>
          <div style={{ color: "#fff", fontSize: 15.5, fontWeight: 700 }}>{title}</div>
          <div style={{ color: "rgba(255,255,255,.55)", fontSize: 12.5 }}>Page 1 of 2</div>
        </div>
      </div>
      <div className="scroll" onClick={onTap}
        style={{ flex: 1, overflow: "auto", padding: "8px 14px 14px", cursor: "zoom-in" }}>
        <div style={{ width: zoom ? "168%" : "100%", transition: "width .3s ease", margin: "0 auto",
          borderRadius: 4, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}>
          <LabDoc highlight />
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 20px", gap: 10 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.4 }}>
          Double-tap or pinch to zoom · the orange ring is Recall's flag
        </span>
        <button className="tap" onClick={() => setZoom((z) => !z)}
          style={{ border: "none", borderRadius: 99, padding: "10px 16px", cursor: "pointer",
            background: "rgba(255,255,255,.14)", color: "#fff", fontSize: 14.5, fontWeight: 600,
            fontFamily: FONT, flexShrink: 0 }}>
          {zoom ? "Fit page" : "Zoom in"}
        </button>
      </div>
    </div>
  );
};

/* Deferral is for the machine; people get an answer. A request Recall
   raised can wait forever — it can re-ask. A request a PERSON sent
   closes: somebody is on the other end of it, so the second button
   says a closing thing and the verdict travels back either way. */
const RequestDetailPage = ({ req, onBack, onDone }) => (
  <Page title="Request" onBack={onBack}>
    <div style={{ padding: "8px 4px 4px" }}>
      <SourceChip type={req.type} />
      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.015em", marginTop: 10, lineHeight: 1.3 }}>
        {req.title}
      </div>
      <div style={{ fontSize: 15, color: C.sub, marginTop: 4 }}>{req.sub}</div>
    </div>

    <SectionLabel>Why</SectionLabel>
    <Card>
      <div style={{ fontSize: 16, lineHeight: 1.55, fontStyle: req.evidence.startsWith("“") ? "italic" : "normal" }}>
        {req.evidence}
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, marginTop: 8 }}>— {req.evidenceSrc}</div>
    </Card>

    <SectionLabel>What happens if you say yes</SectionLabel>
    <Card>
      <div style={{ fontSize: 15.5, lineHeight: 1.55 }}>{req.effect}</div>
    </Card>

    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* the verdict travels — a yes turns the pending row into the
          real thing, right where it stood */}
      {req.actions[0] === "approve" ? (
        <>
          <BigButton onClick={() => onDone("yes")}>{req.yesLabel || "Approve"}</BigButton>
          <BigButton tone="tinted" onClick={() => onDone(req.sugId ? "no" : "later")}>
            {req.noLabel || "Not now"}
          </BigButton>
        </>
      ) : req.actions[0] === "undo" ? (
        <>
          <BigButton tone="tinted" onClick={() => onDone("keep")}>Keep the change</BigButton>
          <BigButton tone="ghost" onClick={() => onDone("undo")}>Undo it</BigButton>
        </>
      ) : (
        <BigButton onClick={() => onDone("yes")}>{req.actions[0]}</BigButton>
      )}
    </div>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
      {req.sugId
        ? "Nothing changes until you decide. Either answer reaches Sarah — she never gets silence."
        : "Nothing changes until you decide — requests wait as long as you need."}
    </div>
  </Page>
);

const NeedsPage = ({ needs = [], onBack, openRequest }) => {
  const waiting = needs.filter((n) => !n.applied);
  const applied = needs.filter((n) => n.applied);
  const card = (n) => (
    <Card key={n.id} style={{ marginBottom: 10 }} onClick={() => openRequest(n)}>
      <div style={{ marginBottom: 8 }}><SourceChip type={n.type} /></div>
      <Row leading={<Icon d={icons[n.icon]} size={20} />} leadingBg={C.orangeSoft} leadColor={C.orange}
        title={n.title} sub={n.sub} pad="2px" />
    </Card>
  );
  return (
    <Page title="Needs you" onBack={onBack}>
      <div style={{ paddingTop: 8 }}>
        {waiting.map(card)}
        {applied.length > 0 && (
          <>
            <SectionLabel>Already applied — you can undo</SectionLabel>
            {applied.map(card)}
          </>
        )}
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 6px" }}>
          Each of these also waits where it would land — on the visit, the medication, or the document it's
          about. This list is just the roll-up; decide one anywhere and it leaves everywhere.
        </div>
      </div>
    </Page>
  );
};

const InsightProgressPage = ({ period, boost, onBack }) => {
  const st = INSIGHT_STATE[period];
  const filled = Math.min(st.filled + (boost ? 1 : 0), 7);
  const earned = st.earned || filled >= 5;
  return (
    <Page title="Weekly insight" onBack={onBack}>
      <div style={{ textAlign: "center", padding: "16px 0 6px" }}>
        <InsightRing filled={filled} size={106} />
        <div style={{ fontSize: 23, fontWeight: 700, marginTop: 12, letterSpacing: "-.01em",
          color: earned ? C.purpleInk : C.ink }}>
          {earned ? "This week's insight is earned" : `${filled} of 5 check-ins this week`}
        </div>
        <div style={{ fontSize: 15.5, color: C.sub, lineHeight: 1.5, marginTop: 6, padding: "0 12px" }}>
          {earned
            ? "It opens Saturday morning. Every extra check-in until then makes it richer."
            : "Check in on 5 different days and your insight unlocks Saturday morning. The faint segments are bonus days."}
        </div>
      </div>

      <SectionLabel>What Recall is doing</SectionLabel>
      <Card>
        <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>
          All week, Recall listens for connections across your check-ins — then checks whether they hold up
          over enough days to mean something.
        </div>
      </Card>

      <SectionLabel>Watching so far</SectionLabel>
      <Card>
        <WatchRow title="The stairs and your knee" sub="Easier on days you stretched first — two mentions so far" />
        <Divider />
        <WatchRow title="Sleep and your walks" sub="You slept longer after Tuesday's walk" />
        <Divider />
        <WatchRow title="Mood and time outside" sub="Brighter check-ins on outdoor days — early hunch" />
      </Card>

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 0" }}>
        One good day or one bad day isn't a pattern. Five days is the minimum for Recall to trust what it sees.
      </div>
    </Page>
  );
};

const WatchRow = ({ title, sub }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 2px" }}>
    <div style={{ color: C.purple, marginTop: 2, flexShrink: 0 }}><Icon d={icons.eye} size={19} /></div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.45, marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

const InsightReportPage = ({ onBack }) => {
  const sleep = [5.5, 7.5, 6, 8, 7.5, 6, 8];
  const walked = [false, true, false, true, true, false, true];
  const dl = ["S", "M", "T", "W", "T", "F", "S"];
  const W = 300, H = 126, bw = 26, gap = (W - 7 * bw) / 8;
  return (
    <Page title="Week 1 insight" onBack={onBack}>
      <div style={{ padding: "12px 4px 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.purple, marginBottom: 8 }}>
          <RecallOrb size={34} mood="celebrate" />
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Earned July 26 · 6 check-ins
          </span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-.015em" }}>
          Your sleep was steadier on days you walked in the morning.
        </div>
      </div>

      <SectionLabel>Your week</SectionLabel>
      <Card>
        <svg viewBox={`0 0 ${W} ${H + 26}`} style={{ width: "100%", display: "block" }}>
          {sleep.map((h, i) => {
            const bh = (h / 9) * H;
            const x = gap + i * (bw + gap);
            return (
              <g key={i}>
                <rect x={x} y={H - bh} width={bw} height={bh} rx="7" fill={walked[i] ? C.purple : C.track} />
                <text x={x + bw / 2} y={H - bh - 6} textAnchor="middle" fontSize="11.5" fontWeight="700"
                  fill={walked[i] ? C.purple : C.sub} fontFamily={FONT}>{h}h</text>
                <text x={x + bw / 2} y={H + 18} textAnchor="middle" fontSize="12.5" fill={C.sub} fontFamily={FONT}>{dl[i]}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <LegendDot color={C.purple} label="Hours slept · walked that morning" />
          <LegendDot color={C.track} label="Hours slept · no walk" />
        </div>
      </Card>

      <SectionLabel>How Recall found this</SectionLabel>
      <Card>
        <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>
          You checked in 6 of 7 days and mentioned walks on 4 of them. On walk days you averaged
          <b> 7.8 hours</b> of sleep; on rest days, <b>5.8</b>. That gap showed up every single time.
        </div>
      </Card>

      <SectionLabel>In your words</SectionLabel>
      <Card>
        <QuoteRow day="Wednesday" text="Slept right through — that morning loop around the park wore me out nicely." />
        <FullDivider />
        <QuoteRow day="Friday" text="Skipped the walk, and I was up at 3 again." />
      </Card>

      <SectionLabel>Worth trying</SectionLabel>
      <Card tone={C.purpleSoft}>
        <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>
          Keep the morning walk on at least 3 days this week — Recall will watch whether the pattern holds.
        </div>
      </Card>

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0" }}>
        Insights are patterns in your own words — not medical advice. This one is in Dr. Chen's brief, if you share it.
      </div>
    </Page>
  );
};

const LegendDot = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
    <div style={{ width: 12, height: 12, borderRadius: 4, background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
  </div>
);

const QuoteRow = ({ day, text }) => (
  <div style={{ padding: "10px 2px" }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.ter, marginBottom: 3 }}>{day}</div>
    <div style={{ fontSize: 15.5, lineHeight: 1.5, fontStyle: "italic" }}>"{text}"</div>
  </div>
);

const InsightsListPage = ({ period, onBack, openReport }) => {
  const list = period === "week2" || period === "visitday" ? INSIGHTS.slice(3) : INSIGHTS;
  return (
    <Page title="Your insights" onBack={onBack}>
      <div style={{ paddingTop: 8 }}>
        {list.map(([w, t]) => (
          <Card key={w} tone={C.purpleSoft} style={{ marginBottom: 10 }} onClick={openReport}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ color: C.purple, marginTop: 2 }}><Icon d={icons.spark} size={19} sw={1.7} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.purpleInk }}>{w}</div>
                <div style={{ fontSize: 16, lineHeight: 1.45 }}>{t}</div>
              </div>
              <Icon d={icons.chevron} size={15} color={C.purpleInk} sw={2.2} />
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
};

/* ---------------- pattern provenance ------------------------------- */
/* A pattern is an INTERPRETATION, and interpretations show their work:
   status is about evidence (early hunch vs. holding up), the reasoning
   is plain words, and every claim traces to dated quotes in the user's
   own voice — the same doctrine as the confirm policy. A pattern is
   never a diagnosis and never enters a brief as a fact. */
const PATTERN_INFO = {
  "Knee pain follows walks over 30 minutes": {
    status: "solid", seen: "6 times over 3 weeks",
    reasoning: "Six longer walks, five sore evenings after — and no soreness after your shorter loops. The link has held for three weeks.",
    evidence: [
      ["Mon, Jul 27", "“The long loop today — the knee complained by dinner.”"],
      ["Thu, Jul 30", "“Forty minutes with Sarah. Ice on the knee tonight.”"],
      ["Tue, Aug 4", "“Short walk only, and the knee stayed quiet.”"],
    ],
    next: "Solid enough for the brief — marked as something you've noticed, not a diagnosis.",
  },
  "Sleep steadier on morning-walk days": {
    status: "solid", seen: "5 times over 2 weeks",
    reasoning: "On mornings you walked, your evening check-ins described falling asleep faster — five out of six times. On no-walk days, sleep was mixed.",
    evidence: [
      ["Wed, Jul 29", "“Walked early, and I was asleep before the ten o'clock news.”"],
      ["Sun, Aug 2", "“No walk today. Tossed around till midnight.”"],
      ["Wed, Aug 5", "“Morning loop again — slept like a stone.”"],
    ],
    next: "Solid enough for the brief — marked as something you've noticed, not a diagnosis.",
  },
  "Energy dips after nights under 6 hours": {
    status: "early", seen: "3 times in 2 weeks",
    reasoning: "On three days you told me you slept under six hours. On two of them, your afternoon check-in described low energy. That's a start — not yet something I'd lean on.",
    evidence: [
      ["Tue, Aug 4", "“Barely five hours — up at three again.”"],
      ["Tue, Aug 4", "“By four o'clock I was done for the day.”"],
      ["Sun, Aug 9", "“Short night. Dragged myself through the afternoon.”"],
    ],
    next: "A few more check-ins that mention sleep — either way — will confirm this or retire it.",
  },
  "Energy dips after short sleep": {
    status: "solid", seen: "7 times over a month",
    reasoning: "Across a month, nearly every check-in after a short night described a flat afternoon — and the pattern never showed after a full night.",
    evidence: [
      ["Tue, Aug 4", "“Barely five hours — up at three again.”"],
      ["Sun, Aug 9", "“Short night. Dragged myself through the afternoon.”"],
      ["Thu, Aug 13", "“Slept the full eight — best afternoon in weeks.”"],
    ],
    next: "In Dr. Osei's brief — marked as something you've noticed, not a diagnosis.",
  },
};
const patternInfo = (p) =>
  PATTERN_INFO[p] || {
    status: "early", seen: "still collecting",
    reasoning: "This one is young — Recall is still collecting the days that will confirm or retire it.",
    evidence: [],
    next: "It firms up as related check-ins accumulate — nothing is asked of you.",
  };

const PatternDetailPage = ({ pattern, onBack }) => {
  const info = patternInfo(pattern);
  const early = info.status === "early";
  return (
    <Page title="Pattern" onBack={onBack}>
      <div style={{ padding: "10px 4px 2px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-.015em" }}>
          {pattern}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
          background: early ? C.orangeSoft : C.greenSoft, color: early ? C.orangeInk : C.greenInk,
          borderRadius: 99, padding: "6px 12px", fontSize: 13.5, fontWeight: 700 }}>
          <Icon d={icons.pattern} size={14} sw={2.2} />
          {early ? `Early hunch · seen ${info.seen}` : `Holding up · seen ${info.seen}`}
        </div>
      </div>

      <SectionLabel>How Recall got this</SectionLabel>
      <Card>
        <div style={{ fontSize: 15.5, lineHeight: 1.55 }}>{info.reasoning}</div>
      </Card>

      {info.evidence.length > 0 && (
        <>
          <SectionLabel>In your own words</SectionLabel>
          <Card>
            {info.evidence.map(([day, quote], i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "9px 2px",
                borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, flexShrink: 0,
                  width: 78, paddingTop: 2 }}>{day}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, fontStyle: "italic" }}>{quote}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      <SectionLabel>What happens next</SectionLabel>
      <Card>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: C.sub }}>{info.next}</div>
      </Card>

      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.55, padding: "14px 6px 0" }}>
        A pattern is never a diagnosis. In a brief it appears as something you've noticed, in
        your words — your doctor decides what it means. The full entries live in your Journal.
      </div>
    </Page>
  );
};

const VisitDetailPage = ({ visit, onBack, openPage }) => (
  <Page title="Visit" onBack={onBack}>
    <div style={{ padding: "10px 4px 4px" }}>
      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.015em" }}>{visit.title}</div>
      <div style={{ fontSize: 15, color: C.sub, marginTop: 3 }}>{visit.date}</div>
    </div>

    {visit.ready && (
      <div style={{ margin: "12px 0 2px" }}>
        <BigButton onClick={() => openPage("briefReport")}>Read the full brief</BigButton>
      </div>
    )}

    {/* the reason for visit — SOAP's chief complaint, in the words the
        clinic front desk already uses. A STRUCTURAL slot on visits
        added through the wizard: filled, it opens the brief; empty,
        it's a dashed socket like every other section that will fill —
        the brief's shape shows even before its content does. */}
    {visit.focus !== undefined && (
      <>
        <SectionLabel>Reason for visit</SectionLabel>
        {visit.focus ? (
          <Card>
            <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.purpleSoft}
              leadColor={C.purpleInk} title={visit.focus}
              sub={visit.focusBy || "Added by you — the brief opens with this. Mention more in any check-in."}
              right={null} />
          </Card>
        ) : (
          <EmptyHint>
            Nothing named yet — say it in any check-in (“the visit is about the shoulder”)
            and it lands here. The brief builds either way.
          </EmptyHint>
        )}
      </>
    )}

    <SectionLabel>Patterns in the brief</SectionLabel>
    {/* every empty section on this page is a dashed socket — one grammar
        for "this will fill", whether it's questions, patterns or papers */}
    {visit.patterns.length === 0 ? (
      <EmptyHint>None yet — patterns appear here as your check-ins accumulate.</EmptyHint>
    ) : (
    <Card>
      {visit.patterns.map((p, i) => {
        const early = patternInfo(p).status === "early";
        return (
          <div key={p}>
            {i > 0 && <Divider />}
            <Row leading={<Icon d={icons.pattern} size={19} />} title={p}
              sub={early ? "Early — still checking · tap for the why" : "Holding up · tap for the why"}
              onClick={() => openPage("patternDetail", { pattern: p, visit })} />
          </div>
        );
      })}
    </Card>
    )}

    <SectionLabel>Questions for the doctor</SectionLabel>
    {/* with rows the how-to is a caption; with none it's the empty-state
        grammar itself — a dashed socket, never a solid card of prose */}
    {visit.questions.length > 0 ? (
      <Card>
        {visit.questions.map((q, i) => (
          <div key={q}>
            {i > 0 && <Divider />}
            <Row leading={<Icon d={icons.question} size={19} />} title={q} right={null} />
          </div>
        ))}
        <Divider />
        <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, padding: "10px 2px 2px" }}>
          Say a question in any check-in — "ask about…" — and it lands here.
        </div>
      </Card>
    ) : (
      <EmptyHint>
        Say a question in any check-in — "ask about…" — and it lands here.
      </EmptyHint>
    )}

    <SectionLabel>Documents attached</SectionLabel>
    {visit.docs.length === 0 ? (
      <EmptyHint>Nothing attached yet — scan or add any time, from Documents.</EmptyHint>
    ) : (
    <Card>
      {visit.docs.map((d, i) => (
        <div key={d}>
          {i > 0 && <Divider />}
          <Row leading={<Icon d={icons.docs} size={19} />} title={d} right={null}
            leadingBg={d.startsWith("Missing") ? C.orangeSoft : C.blueSoft}
            leadColor={d.startsWith("Missing") ? C.orange : C.blue} />
        </div>
      ))}
    </Card>
    )}

    {visit.note && (
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 0" }}>
        {visit.note}
      </div>
    )}
  </Page>
);

/* BRIEF_CHOICES retired with the review chooser: "which brief?" is no
   longer a review question. The router routes confirmed memory after
   finalize, and the decision lives inside the brief itself. */

/* a quiet depth meter — how much context a lens holds, not a grade.
   Lives inside the "What today covered" sheet, one tap down from
   Today's picture; never on the review page itself. */
const DepthMeter = ({ name, filled }) => {
  const slots = FRAMEWORKS[name].slots;
  const tone = depthOf(name, filled).tone;
  const col = tone === "good" ? C.green : tone === "some" ? C.orange : C.line;
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
      {slots.map((s, i) => (
        <div key={s} title={s} style={{ flex: 1, height: 5, borderRadius: 99,
          background: i < filled.length ? col : C.track }} />
      ))}
    </div>
  );
};

/* ---------------- fixing a heard fact — the correction grammar -------
   The conversation is the source of truth: a keyboard must never
   quietly override what the talk validated. So the fix's modality
   follows the fact's nature:
   · validated vocabulary (a dose, a timing, a day) — you PICK from the
     library's own values, never type them
   · identity that's hard to say (a medication name) — search it or
     scan the bottle; the match comes from the library, not spelling
   · a person — pick from your own care team; only "Someone new" opens
     a name field, because a new name is new data, not an override
   · anything kept in her words — no keyboard at all: say it again and
     Recall replaces it (the row's own button re-opens the talk)      */
const PickChip = ({ on, children, onClick }) => (
  <button className="tap" onClick={onClick} style={{ border: "none", cursor: "pointer", fontFamily: FONT,
    background: on ? C.blue : C.blueSoft, color: on ? "#fff" : C.blue, borderRadius: 99,
    padding: "10px 16px", fontSize: 15, fontWeight: 600 }}>
    {children}
  </button>
);

const FixLabel = ({ children, top }) => (
  <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
    color: C.sub, margin: `${top ? 14 : 2}px 2px 8px` }}>{children}</div>
);

/* the drawer's grammar: one collapsed row per field — label, current
   value, chevron — and tapping expands THAT field's editor in place,
   one at a time (the iOS event-editor pattern). The sheet stays short,
   the calendar appears only when When asks for it, and every pick
   collapses the row again so the new value reads back immediately. */
const FixRow = ({ label, value, dim, open, onToggle, children }) => (
  <div>
    <button className="tap" onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10,
      width: "100%", border: "none", background: "none", padding: "13px 2px", cursor: "pointer",
      fontFamily: FONT, textAlign: "left" }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase",
        color: C.sub, width: 86, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: dim ? C.ter : C.ink,
        lineHeight: 1.3 }}>{value}</span>
      <span style={{ display: "flex", color: C.ter, transform: open ? "rotate(90deg)" : "none",
        transition: "transform .2s ease", flexShrink: 0 }}>
        <Icon d={icons.chevron} size={14} sw={2.2} />
      </span>
    </button>
    {open && <div className="sheetIn" style={{ padding: "0 2px 14px" }}>{children}</div>}
  </div>
);

/* a WEEK STRIP, not a month grid — the booking-app pattern. Seven big
   day cells and week arrows keep the drawer a drawer: one row of days
   instead of thirty-one, still picked by tap, never typed. */
const WeekStrip = ({ selected, onPick }) => {
  const [week, setWeek] = useState(selected ? Math.floor((selected - 2) / 7) : 0);
  const start = 2 + Math.max(0, Math.min(4, week)) * 7;
  const days = Array.from({ length: 7 }, (_, i) => start + i).filter((d) => d <= 31);
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const arrow = (dir, on) => (
    <button className="tap" disabled={!on} onClick={() => on && setWeek((w) => w + dir)}
      aria-label={dir > 0 ? "Next week" : "Previous week"}
      style={{ width: 32, height: 32, borderRadius: 99, border: "none", cursor: on ? "pointer" : "default",
        background: on ? C.blueSoft : C.track, color: on ? C.blue : C.ter, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: dir < 0 ? "rotate(180deg)" : "none", opacity: on ? 1 : 0.5 }}>
      <Icon d={icons.chevron} size={14} sw={2.4} />
    </button>
  );
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {arrow(-1, week > 0)}
        <div style={{ flex: 1, textAlign: "center", fontSize: 13.5, fontWeight: 700 }}>
          August {start}–{Math.min(start + 6, 31)}
        </div>
        {arrow(1, start + 7 <= 31)}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {days.map((d, i) => (
          <button key={d} className="tap" onClick={() => onPick(d)} style={{ flex: 1, border: "none",
            cursor: "pointer", fontFamily: FONT, borderRadius: 11, padding: "8px 0 9px",
            background: selected === d ? C.blue : C.bg,
            color: selected === d ? "#fff" : C.ink,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".03em",
              color: selected === d ? "rgba(255,255,255,.8)" : C.ter }}>{dows[i]}</span>
            <span style={{ fontSize: 16.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const FixSheet = ({ cap, prev, onClose, onSave, onSay }) => {
  const f = cap.fix;
  /* med */
  const [name, setName] = useState(f.type === "med" ? (prev ? prev[0] : f.name) : "");
  const [dose, setDose] = useState(f.type === "med" ? (prev ? prev[1] : f.dose) : "");
  const [timing, setTiming] = useState(f.type === "med" ? (prev ? prev[2] : f.timing) : "");
  const [searching, setSearching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [query, setQuery] = useState("");
  /* visit — who (none named is the honest default) + when (heard · a
     picked day · honestly unsure) */
  const [whenMode, setWhenMode] = useState("heard");
  const [whenDate, setWhenDate] = useState(null);
  /* person (shared with the visit's who — a doctor NAMED in the talk
     arrives attached (f.who); an unnamed visit honestly has nobody) */
  const [who, setWho] = useState(
    f.type === "person" ? (prev ? prev[0] : f.value)
    : f.type === "visit" ? (prev ? prev[1] || "" : f.who || "") : "");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  /* one field edits at a time — the drawer stays a drawer */
  const [openRow, setOpenRow] = useState(null);
  const toggleRow = (k) => setOpenRow((o) => (o === k ? null : k));
  /* the visit's KIND is validated vocabulary (it files the visit right);
     the description stays her words — two layers, two modalities */
  const [vkind, setVkind] = useState(f.vkind || "Check-up");

  const dbMed = MED_DB.find((m) => m.name === name);
  const q = query.trim().toLowerCase();
  const matches = q.length >= 2 ? MED_DB.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 4) : [];
  /* the meds tab's own dose grammar, reused: presets AND a stepper with
     units — same steps, same vocabulary, no keyboard */
  const [customDose, setCustomDose] = useState(false);
  const [doseVal, setDoseVal] = useState(() => { const n = parseFloat(f.dose); return isNaN(n) ? 50 : n; });
  const [doseUnit, setDoseUnit] = useState(() => (String(f.dose || "").match(/mcg|mg|IU|mL/) || ["mg"])[0]);
  const doseSteps = { mg: 5, mcg: 25, IU: 250, mL: 1 };
  const doseNow = customDose ? `${doseVal} ${doseUnit}` : dose;
  const inputStyle = { width: "100%", boxSizing: "border-box", border: `1px solid ${C.line}`,
    background: C.bg, color: C.ink, borderRadius: 10, padding: "12px 13px",
    fontSize: 16.5, fontFamily: FONT, outline: "none" };
  const whenLabel = whenMode === "heard" ? f.heard
    : whenMode === "unsure" ? "date to confirm"
    : `Aug ${whenDate}`;
  const whoLabel = newOpen && newName.trim() ? newName.trim() : who;
  const save = () => onSave(
    f.type === "med" ? [name, doseNow, timing]
    : f.type === "visit" ? [f.what, whoLabel, whenLabel]
    : [whoLabel]);

  return (
    <Sheet title="Fix a detail" onClose={onClose}>
      {f.type === "med" && (
        <Card>
          <FixRow label="Medication" value={`${name}${dbMed ? ` · ${dbMed.form}` : ""}`}
            open={openRow === "name"} onToggle={() => toggleRow("name")}>
            {!searching ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <PickChip onClick={() => setSearching(true)}>Wrong one? Search it</PickChip>
                <PickChip onClick={() => setScanning(true)}>Scan the bottle</PickChip>
              </div>
            ) : (
              <div>
                <input autoFocus value={query} aria-label="Search medications" placeholder="Type two letters to search"
                  onChange={(e) => setQuery(e.target.value)} style={inputStyle} />
                {matches.map((m) => (
                  <div key={m.name}>
                    <Row leading={<Icon d={icons.meds} size={18} />} title={m.name}
                      sub={`${m.form} · ${m.doses.join(" · ")}`} right={null}
                      onClick={() => {
                        setName(m.name); setDose(m.doses[0]);
                        setTiming(/evening/i.test(m.when) ? "Evenings" : "Mornings");
                        setSearching(false); setQuery(""); setOpenRow(null);
                      }} />
                  </div>
                ))}
                <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, padding: "6px 2px 2px" }}>
                  Matches come from the medication library — picking one keeps the record checkable.
                  Spelling it out loud is hard; searching or scanning isn't.
                </div>
              </div>
            )}
          </FixRow>
          <FullDivider />
          <FixRow label="Dose" value={doseNow} open={openRow === "dose"} onToggle={() => toggleRow("dose")}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(dbMed ? dbMed.doses : [dose]).map((d) => (
                <PickChip key={d} on={!customDose && dose === d}
                  onClick={() => { setDose(d); setCustomDose(false); setOpenRow(null); }}>{d}</PickChip>
              ))}
              <PickChip on={customDose} onClick={() => setCustomDose(true)}>Another dose</PickChip>
            </div>
            {customDose && (
              <div className="sheetIn" style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button className="tap" onClick={() => setDoseVal((v) => Math.max(doseSteps[doseUnit], v - doseSteps[doseUnit]))}
                    aria-label="Lower dose" style={{ width: 44, height: 44, borderRadius: 99, border: "none",
                      background: C.blueSoft, color: C.blue, fontSize: 22, fontWeight: 700,
                      cursor: "pointer", fontFamily: FONT }}>−</button>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 21, fontWeight: 750,
                    fontVariantNumeric: "tabular-nums" }}>
                    {doseVal} {doseUnit}
                  </div>
                  <button className="tap" onClick={() => setDoseVal((v) => v + doseSteps[doseUnit])}
                    aria-label="Raise dose" style={{ width: 44, height: 44, borderRadius: 99, border: "none",
                      background: C.blueSoft, color: C.blue, fontSize: 22, fontWeight: 700,
                      cursor: "pointer", fontFamily: FONT }}>+</button>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
                  {["mg", "mcg", "IU", "mL"].map((u) => (
                    <PickChip key={u} on={doseUnit === u} onClick={() => setDoseUnit(u)}>{u}</PickChip>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, marginTop: 10 }}>
              The library's own doses first; the stepper and units are the cabinet's — steps of{" "}
              {doseSteps[doseUnit]} {doseUnit}, never a keyboard.
            </div>
          </FixRow>
          <FullDivider />
          <FixRow label="Timing" value={timing} open={openRow === "timing"} onToggle={() => toggleRow("timing")}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Mornings", "Middays", "Evenings"].map((tm) => (
                <PickChip key={tm} on={timing === tm} onClick={() => { setTiming(tm); setOpenRow(null); }}>{tm}</PickChip>
              ))}
            </div>
          </FixRow>
        </Card>
      )}

      {f.type === "visit" && (
        <Card>
          <FixRow label="What" value={`${f.what} · ${vkind}`} open={openRow === "what"}
            onToggle={() => toggleRow("what")}>
            {/* two layers: the KIND is a validated tag (it files the visit
                right — pickable), the description is her words (never a
                field — re-said by talking) */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Check-up", "Follow-up", "Test", "Lab work", "Something new"].map((k) => (
                <PickChip key={k} on={vkind === k} onClick={() => { setVkind(k); setOpenRow(null); }}>{k}</PickChip>
              ))}
            </div>
            <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, marginTop: 10 }}>
              The tag files it right in Visits. “{f.what}” stays in your words — if <i>that's</i> wrong,{" "}
              <button className="tap" onClick={onSay} style={{ border: "none", background: "none", padding: 0,
                color: C.blue, fontSize: 13.5, fontWeight: 650, cursor: "pointer", fontFamily: FONT }}>
                say it again
              </button>{" "}and Recall replaces it.
            </div>
          </FixRow>
          <FullDivider />
          {/* a doctor named out loud arrives attached (resolved in-call);
              an unnamed one honestly shows nobody until she picks or
              Recall asks when the visit settles */}
          <FixRow label="With" dim={!who && !newOpen}
            value={newOpen && newName.trim() ? newName.trim() : who || "No one named yet"}
            open={openRow === "who"} onToggle={() => toggleRow("who")}>
            <Row leading={<Icon d={icons.person} size={18} />} leadingBg={C.track} leadColor={C.sub}
              title="No one named yet" sub="Recall asks for the place when the visit settles" pad="8px 2px"
              right={!who && !newOpen ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} /> : <span />}
              onClick={() => { setWho(""); setNewOpen(false); setOpenRow(null); }} />
            {f.people.map(([n, sub]) => (
              <div key={n}>
                <Divider />
                <Row leading={<Icon d={icons.person} size={19} />} title={n} sub={sub} pad="8px 2px"
                  right={who === n && !newOpen
                    ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} /> : <span />}
                  onClick={() => { setWho(n); setNewOpen(false); setOpenRow(null); }} />
              </div>
            ))}
            <Divider />
            <Row leading={<Icon d={icons.plus} size={18} />} leadingBg={C.track} leadColor={C.sub}
              title="Someone new" sub="A new name is new data — type it, and Recall asks for details later"
              pad="8px 2px"
              right={newOpen ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} /> : <span />}
              onClick={() => setNewOpen(true)} />
            {newOpen && (
              <input autoFocus value={newName} aria-label="New doctor's name" placeholder="Their name"
                onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
            )}
          </FixRow>
          <FullDivider />
          {/* the calendar appears only when When asks for it — tapping a
              day, the heard chip, or "not sure" closes the row with the
              value reading back in place */}
          <FixRow label="When" value={whenLabel === "date to confirm" ? "Not sure yet" : whenLabel}
            open={openRow === "when"} onToggle={() => toggleRow("when")}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <PickChip on={whenMode === "heard"}
                onClick={() => { setWhenMode("heard"); setWhenDate(null); setOpenRow(null); }}>
                {f.heard} — as heard
              </PickChip>
              <PickChip on={whenMode === "unsure"}
                onClick={() => { setWhenMode("unsure"); setWhenDate(null); setOpenRow(null); }}>
                Not sure yet
              </PickChip>
            </div>
            <WeekStrip selected={whenDate} onPick={(d) => { setWhenDate(d); setWhenMode("date"); setOpenRow(null); }} />
            <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, marginTop: 8 }}>
              Honest is fine — "Not sure yet" keeps the visit as date-to-confirm, and Recall asks again
              when it's closer.
            </div>
          </FixRow>
        </Card>
      )}

      {f.type === "person" && (
        <Card>
          <FixLabel>Who did you see?</FixLabel>
          {f.options.map(([n, sub], i) => (
            <div key={n}>
              {i > 0 && <Divider />}
              <Row leading={<Icon d={icons.person} size={19} />} title={n} sub={sub}
                right={who === n && !newOpen
                  ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} /> : <span />}
                onClick={() => { setWho(n); setNewOpen(false); }} />
            </div>
          ))}
          <Divider />
          <Row leading={<Icon d={icons.plus} size={18} />} leadingBg={C.track} leadColor={C.sub}
            title="Someone new" sub="A new name is new data — type it, and Recall asks for details later"
            right={newOpen ? <Icon d={icons.check} size={18} sw={2.8} color={C.green} /> : <span />}
            onClick={() => setNewOpen(true)} />
          {newOpen && (
            <input autoFocus value={newName} aria-label="New doctor's name" placeholder="Their name"
              onChange={(e) => setNewName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
          )}
        </Card>
      )}

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 12px" }}>
        Nothing here overrides the conversation — days and doses come from pickers, names from search,
        the bottle, or your own care team. Prefer to just say it?{" "}
        <button className="tap" onClick={onSay} style={{ border: "none", background: "none", padding: 0,
          color: C.blue, fontSize: 13.5, fontWeight: 650, cursor: "pointer", fontFamily: FONT }}>
          Keep talking asks you.
        </button>
      </div>
      <BigButton onClick={save}>Save the fix</BigButton>

      {scanning && (
        <MedScanOverlay onCancel={() => setScanning(false)}
          onConfirm={() => { setName("Atorvastatin"); setDose("20 mg"); setTiming("Evenings");
            setSearching(false); setScanning(false); }} />
      )}
    </Sheet>
  );
};

/* Review — facts only. Its one question is "is my record right?" — no
   routing questions, not one. The router runs on confirmed memory after
   finalize, and "which brief?" is decided inside the brief itself.
   Decisions collapse to checked one-liners as they're handled (the page
   physically shortens), the day's read is one sentence with its
   structure one tap down, and Finalize stays pinned in reach, never
   disabled — skipping is safe by design. */
/* "What today covered" — the ONE place counts live (the lens rule).
   The same sheet serves the review and the finished entry page: depth
   in plain words, quiet lenses named without blame, never a score.
   The name says what the list is; the footer repeats the first
   check-in's own intro sentence, so the six are a reunion here, not
   a taxonomy sprung mid-app. */
const HowReadSheet = ({ onClose }) => {
  const heard = REVIEW_DAY.filter((r) => r.filled.length > 0);
  const quietLenses = REVIEW_DAY.filter((r) => r.filled.length === 0);
  const toneCol = { good: C.greenInk, some: C.orangeInk, open: C.ter };
  return (
    <Sheet title="What today covered" onClose={onClose}>
      <Card>
        {[...heard].sort((a, b) => b.filled.length - a.filled.length).map((r, i) => {
          const d = depthOf(r.c, r.filled);
          return (
            <div key={r.c} style={{ padding: "12px 2px" }}>
              {i > 0 && <div style={{ height: 0.5, background: C.line, margin: "0 0 12px" }} />}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 16.5, fontWeight: 700 }}>{LENS_NAME[r.c] || r.c}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: toneCol[d.tone], flexShrink: 0 }}>
                  {d.label}
                </span>
              </div>
              <DepthMeter name={r.c} filled={r.filled} />
              <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.45, marginTop: 8 }}>{r.line}</div>
            </div>
          );
        })}
        {quietLenses.length > 0 && (
          <div style={{ padding: "12px 2px" }}>
            <div style={{ height: 0.5, background: C.line, margin: "0 0 12px" }} />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                {quietLenses.map((r) => LENS_NAME[r.c] || r.c).join(" · ")}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ter, flexShrink: 0 }}>Quiet today</span>
            </div>
          </div>
        )}
      </Card>
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 4px" }}>
        Recall listens for what a doctor would ask about — in your words, never a quiz.
        {" "}{heard.length} of 6 came up today; what didn't stays blank, and honest beats complete.
        Depth here is context, never a score.
      </div>
    </Sheet>
  );
};

const ReviewPage = ({ period = "week2", captured = [], reopen, preview, onFinalize, onKeepOpen, onResume, onResay, onScanNow, onSettle }) => {
  const decisions = captured.filter((c) => c.kind === "confirm" || c.kind === "done");
  const kept = captured.filter((c) => c.kind !== "confirm" && c.kind !== "done");
  /* per-item state until finalize: undefined = open · "done" · "skipped" */
  /* the review never restarts — it ACCRETES. OKs and fixes are written
     back onto the captured facts (onSettle), so a trip into the talk —
     say it again, keep talking — returns to exactly where she left off,
     and anything new she said simply adds rows. Flexibility stays safe
     because progress is durable, not because the talk is fenced. */
  const [status, setStatus] = useState(() =>
    Object.fromEntries(decisions.filter((c) => c.kind === "done" || c.settled)
      .map((c) => [c.t, c.settled || "done"])));
  const [openId, setOpenId] = useState(() => {
    const first = decisions.find((c) => c.kind !== "done" && !c.settled);
    return first ? first.t : null;
  });
  const [readOpen, setReadOpen] = useState(false);
  const settled = decisions.filter((c) => status[c.t]);
  const pending = decisions.filter((c) => !status[c.t]);
  /* the page is STAGED, not paged — and it holds exactly TWO kinds of
     content: things that need her (the checking) and things that don't
     (the record as it will be written — the picture WITH its kept
     facts). While decisions are open, only the checking shows, plus one
     locked status row promising the picture; when the last OK lands the
     read opens on its own. A quiet day arrives fully open. */
  const settledAll = pending.length === 0;
  /* when the checking completes, the checked rows fold into one line so
     the screen TURNS INTO the read-and-sign document — the new-page
     feeling without navigation. Tap re-opens them; change stays close. */
  const [checkedOpen, setCheckedOpen] = useState(false);
  const foldChecked = settledAll && !reopen && settled.length > 1 && !checkedOpen;
  const pictureRef = useRef(null);
  const bloomed = useRef(false);
  useEffect(() => {
    if (!settledAll || reopen || decisions.length === 0 || bloomed.current) return;
    bloomed.current = true;
    /* bring the read into view — the bloom must be seen to be read */
    const t = setTimeout(() => {
      const el = pictureRef.current;
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 380);
    return () => clearTimeout(t);
  }, [settledAll]);
  /* the picture is the OUTPUT of the checking — mid-checking it would
     be a summary about to change, so it never opens early. Kept facts
     peek fine (they need nothing); the picture waits for the record. */
  const pictureShown = settledAll;
  /* the embedded stepper's auto-advance also SCROLLS: the next open
     card comes to her, instead of hoping she scrolls to it */
  const reduced = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cardRefs = useRef({});
  useEffect(() => {
    const el = openId && cardRefs.current[openId];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }, [openId]);
  const doneCount = decisions.filter((c) => status[c.t] === "done").length;
  const touched = REVIEW_DAY.filter((r) => r.filled.length > 0).length;
  /* the orb reflects the day — proud when it's full, warm either way */
  const reviewMood = reopen ? "calm" : touched >= 6 ? "delighted" : touched >= 4 ? "happy" : "calm";

  /* settling a card collapses it to a one-liner and opens the next —
     auto-advance without a wizard; "change" reopens any of them */
  const settle = (t, v, vals) => {
    const nextStatus = { ...status, [t]: v };
    setStatus(nextStatus);
    const next = decisions.find((c) => !nextStatus[c.t]);
    setOpenId(next ? next.t : null);
    if (onSettle) onSettle(t, v, vals);
  };
  const reopenRow = (t) => {
    setStatus((p) => { const q = { ...p }; delete q[t]; return q; });
    setOpenId(t);
    if (onSettle) onSettle(t, null);
  };

  /* "Fix a detail" — the middle path between yes and not-now, for
     facts with structure (a dose, a day, a person). The sheet's
     controls are pickers, search, the scanner, and the care team —
     never a keyboard over heard health data. Saving a fix confirms
     the fact: fixed means right. */
  const [fixing, setFixing] = useState(null);
  const [fixes, setFixes] = useState(() =>
    Object.fromEntries(captured.filter((c) => c.fixedVals).map((c) => [c.t, c.fixedVals])));
  const saveFix = (vals) => {
    const t = fixing.t;
    setFixes((p) => ({ ...p, [t]: vals }));
    setFixing(null);
    settle(t, "done", vals);
  };
  const fixedVals = (c) => (fixes[c.t] || []).map((v) => v.trim()).filter(Boolean);
  const fixedLine = (c) => `${fixedVals(c).join(" · ")} — ${c.fixDone || "fixed"}`;

  /* the soft gate: Finalize never goes dead — a disabled button can't
     explain itself — but with open cards it stops being silent. One
     plain choice: go back to them, or finalize without them (they stay
     out of the record and wait in Updates). */
  const [gate, setGate] = useState(false);
  /* "alt" is an ANSWER — an entry-only proposal is decided, so it never
     rides the skipped list to Updates; only unanswered and not-now do */
  const doFinalize = () => onFinalize(
    decisions.filter((c) => status[c.t] !== "done" && status[c.t] !== "alt").map((c) => c.t),
    Object.fromEntries(decisions.filter((c) => status[c.t] === "done" && fixes[c.t])
      .map((c) => [c.t, fixedVals(c).join(" · ")])),
  );

  const nWord = ["Two", "Three", "Four", "Five", "Six"][pending.length - 2] || String(pending.length);
  const bridge = reopen
    ? "This adds to a day you already finalized — the morning entry stays untouched; tonight gets its own note and time."
    : pending.length > 1
    ? (<>Here's what I gathered, Amma. <b>{nWord} need your OK — take them in any order.</b></>)
    : pending.length === 1
    ? (<>Here's what I gathered, Amma. <b>One thing needs your OK.</b></>)
    : decisions.length > 0
    ? (<>All settled in the talk — <b>nothing more needs checking.</b> Here's my read of the day; you decide when it's done.</>)
    : kept.length > 0
    ? "All kept, Amma. Here's my read of the day — you decide when it's done."
    : "All kept, Amma. Nothing needs checking today — here's what the day holds.";

  const tintFor = (c) => (c.kind === "done"
    ? { bg: C.greenSoft, fg: C.green }
    : { bg: C.orangeSoft, fg: C.orange });

  /* the kept facts, as receipt rows — used in the read phase (with the
     picture) and in the reopen flow's own small section */
  const keptCard = (
    <Card>
      {kept.map((c, i) => (
        <div key={c.t}>
          {i > 0 && <Divider />}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.blueSoft, color: C.blue,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={icons[c.icon] || icons.check} size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* the kind, named — the same vocabulary the visit brief uses
                  (your questions · documents), so the row explains itself */}
              {c.group && (
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em",
                  textTransform: "uppercase", color: C.ter }}>{c.group}</div>
              )}
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.35 }}>{c.t}</div>
              <div style={{ fontSize: 13.5, marginTop: 2, fontWeight: 600,
                color: c.fateTone === "green" ? C.greenInk : C.sub }}>
                {c.fate || c.dest}
              </div>
            </div>
            {/* words are never retyped — the fix for a kept fact is saying
                it again, so the row carries its own way back into the talk */}
            {c.resay && onResay && (
              <button className="tap" onClick={() => onResay(c.resay)} style={{ border: "none",
                background: "none", color: C.blue, fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, flexShrink: 0, padding: "6px 2px",
                minHeight: 44, textAlign: "right", lineHeight: 1.3 }}>
                Say it<br />again
              </button>
            )}
            {/* mid-call, scanning would yank her out of the talk — the talk
                is over now, so it's her choice: here, or Today's card */}
            {c.scanNow && onScanNow && (
              <button className="tap" onClick={() => onScanNow(c)} style={{ border: "none",
                background: "none", color: C.blue, fontSize: 13.5, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, flexShrink: 0, padding: "6px 2px",
                minHeight: 44, textAlign: "right", lineHeight: 1.3 }}>
                Scan<br />now
              </button>
            )}
          </div>
        </div>
      ))}
    </Card>
  );

  return (
    /* no back chevron here on purpose — review is the end of the talk, not a
       page you browse. A "back" that quietly ended the check-in read as broken;
       every exit is an explicit, labeled choice: finalize (pinned below),
       keep talking (the real "back"), or keep the day open for later. */
    <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 25, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      {/* the quiet exit lives in the header, the iOS sheet grammar —
          leaving IS keeping the day open, so it isn't a third CTA */}
      <div style={{ padding: "16px 16px 4px", flexShrink: 0, display: "flex",
        alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em", flex: 1 }}>
          {reopen ? "Review the addition" : "Review check-in"}
        </div>
        <button className="tap" onClick={onKeepOpen} style={{ border: "none", background: "none",
          color: C.blue, fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
          flexShrink: 0, padding: "4px 2px" }}>
          {reopen ? "Not now" : "Finish later"}
        </button>
      </div>
      <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 16px 26px" }}>
      {preview && (
        /* bench state, styled like the backstage chips — unmistakably
           internal, while every mechanism below stays fully live */
        <div style={{ border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: "9px 12px",
          margin: "8px 0 2px", fontSize: 12.5, lineHeight: 1.5, color: C.ter }}>
          <b style={{ letterSpacing: ".05em" }}>INTERNAL PREVIEW</b> — every card variant at once, no
          conversation behind it. Everything works: change · fix · say it again · scan now · the gate ·
          finalize.
        </div>
      )}
      <Card tone={C.blueSoft} style={{ marginTop: 8, marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <RecallOrb size={40} mood={reviewMood} />
          <div style={{ fontSize: 15.5, lineHeight: 1.5, color: C.blueDeep }}>{bridge}</div>
        </div>
      </Card>

      {reopen && (
        <>
          <SectionLabel>What's being added</SectionLabel>
          <Card>
            <Row leading={<Icon d={icons.pattern} size={19} />} leadingBg={C.orangeSoft} leadColor={C.orange}
              title="Symptoms — evening addition"
              sub="Knee swelling after dinner · 6:40 PM · sits next to this morning's note" right={null} />
          </Card>
        </>
      )}

      {decisions.length > 0 && (
        <>
          <SectionLabel>
            Needs your OK{decisions.length > 1 ? ` · ${doneCount} of ${decisions.length} done` : ""}
          </SectionLabel>

          {/* handled cards collapse to checked one-liners — the page gets
              shorter as she works, and "change" reopens anything */}
          {foldChecked && (
            <Card onClick={() => setCheckedOpen(true)} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.greenSoft,
                  color: C.green, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0 }}>
                  <Icon d={icons.check} size={17} sw={2.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>Checked — {settled.length} things</div>
                  <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.4, marginTop: 1 }}>
                    tap to look again or change any
                  </div>
                </div>
                <span style={{ transform: "rotate(90deg)", display: "flex", color: C.ter, flexShrink: 0 }}>
                  <Icon d={icons.chevron} size={14} sw={2.2} />
                </span>
              </div>
            </Card>
          )}
          {settled.length > 0 && !foldChecked && (
            <Card style={{ marginBottom: 10 }}>
              {settled.map((c, i) => (
                <div key={c.t} style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 2px", borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
                  {/* three checked states: done (green check) · alt — the
                      decided-no (quiet check: answered, nothing followed) ·
                      skipped (pause: parked for Updates) */}
                  <span style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0,
                    background: status[c.t] === "done" ? C.greenSoft : C.track,
                    color: status[c.t] === "done" ? C.green : status[c.t] === "alt" ? C.sub : C.ter,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon d={status[c.t] === "skipped" ? icons.pause : icons.check} size={13} sw={3} />
                  </span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
                    {status[c.t] === "skipped" ? c.skipLine
                      : status[c.t] === "alt" ? c.altLine
                      : fixes[c.t] ? fixedLine(c) : c.doneLine}
                    {status[c.t] === "done" && fixes[c.t] && (
                      <span style={{ fontSize: 12.5, fontWeight: 650, color: C.sub }}> · fixed by you</span>
                    )}
                  </span>
                  <button className="tap" onClick={() => reopenRow(c.t)} style={{ border: "none",
                    background: "none", color: C.blue, fontSize: 13.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: FONT, flexShrink: 0, padding: "6px 2px" }}>
                    change
                  </button>
                </div>
              ))}
            </Card>
          )}

          {/* one card open at a time; the rest wait as quiet rows */}
          {pending.map((c) => {
            const tint = tintFor(c);
            return c.t === openId ? (
              <div key={c.t} ref={(el) => { cardRefs.current[c.t] = el; }}>
              <Card style={{ marginBottom: 10, boxShadow: `0 0 0 1.5px ${C.orange}` }}>
                <Row leading={<Icon d={icons[c.icon] || icons.check} size={19} />}
                  leadingBg={tint.bg} leadColor={tint.fg} title={c.t} sub={c.sub} right={null} pad="2px" />
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <BigButton small onClick={() => settle(c.t, "done")}>{c.yes}</BigButton>
                  {c.fix && (
                    <BigButton small tone="tinted" onClick={() => setFixing(c)}>Fix a detail</BigButton>
                  )}
                  {/* a proposal's second button is a DECISION, not a skip —
                      "just this entry" settles the card; nothing waits
                      anywhere. Only a plain `no` parks the fact for Updates. */}
                  {c.alt ? (
                    <BigButton small tone="tinted" onClick={() => settle(c.t, "alt")}>{c.alt}</BigButton>
                  ) : (
                    <BigButton small tone="tinted" onClick={() => settle(c.t, "skipped")}>{c.no}</BigButton>
                  )}
                </div>
                {c.firstNote && (
                  <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, paddingTop: 9 }}>
                    {c.firstNote}
                  </div>
                )}
              </Card>
              </div>
            ) : (
              /* waiting cards show the ITEM, not its category — with one
                 item per row, "Appointment heard" says less than the
                 appointment itself; the eyebrow keeps the kind readable */
              <Card key={c.t} onClick={() => setOpenId(c.t)} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: C.orangeSoft,
                    color: C.orange, display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0 }}>
                    <Icon d={icons[c.icon] || icons.check} size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {c.group && (
                      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em",
                        textTransform: "uppercase", color: C.ter }}>{c.group}</div>
                    )}
                    <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.3 }}>{c.t}</div>
                  </div>
                  <span style={{ transform: "rotate(90deg)", display: "flex", color: C.ter, flexShrink: 0 }}>
                    <Icon d={icons.chevron} size={15} sw={2.2} />
                  </span>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* the kept facts are not a third category — they're part of the
          record as it will be written, so they live WITH the picture in
          the read phase (reopen keeps its own small section). Each row
          still carries its own adjust action. */}
      {kept.length > 0 && reopen && (
        <div className="stepIn">
          <SectionLabel>Kept with tonight's note{kept.length > 1 ? ` · ${kept.length}` : ""}</SectionLabel>
          {keptCard}
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 6px 0" }}>
            No “which brief?” here — that's decided after your record is right, and mostly by itself.
            These are kept in your words, so there's nothing to retype: misheard something? Keep talking
            and say it again — Recall replaces it.
          </div>
        </div>
      )}

      {!reopen && !pictureShown && (
        /* a LOCKED status row, not a button — the picture summarizes the
           settled record, so mid-checking there is honestly nothing to
           open. The lock lives here (a locked thing SHOULD look inert);
           the unlock is the bloom itself. */
        <Card style={{ marginTop: 10, opacity: 0.75 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.track, color: C.ter,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={icons.lock} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: C.sub }}>Today's picture</div>
              <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.4, marginTop: 1 }}>
                unlocks when the checking is done
              </div>
            </div>
          </div>
        </Card>
      )}
      {!reopen && pictureShown && (
        <div className="stepIn" ref={pictureRef}>
          {/* the picture closes the page ON PURPOSE: it summarizes the
              RECORD, and the record isn't settled until the cards above
              are. It composes live — the day's read, plus what THIS talk
              added (confirmed things only) — and says plainly when it's
              still waiting on an OK, so working through the cards
              visibly settles the sentence instead of contradicting it. */}
          <SectionLabel>Today's picture</SectionLabel>
          <Card>
            <div style={{ fontSize: 15.5, lineHeight: 1.55 }}>
              {decisions.length > 0 ? REVIEW_PICTURE.short : REVIEW_PICTURE.quiet}
            </div>
            {(() => {
              const bits = [
                ...decisions.filter((c) => status[c.t] === "done" && c.picture)
                  .map((c) => c.picture),
                ...kept.filter((c) => c.picture).map((c) => c.picture),
              ];
              const joined = bits.length <= 1 ? bits[0]
                : `${bits.slice(0, -1).join(", ")}, and ${bits[bits.length - 1]}`;
              return bits.length > 0 ? (
                <div style={{ fontSize: 15.5, lineHeight: 1.55, marginTop: 9 }}>
                  <b>From this talk:</b> {joined}.
                </div>
              ) : null;
            })()}
            <button className="tap" onClick={() => setReadOpen(true)} style={{ display: "flex",
              alignItems: "center", gap: 7, border: "none", background: "none", color: C.blue,
              fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              padding: "12px 0 2px", width: "100%" }}>
              <Icon d={icons.chat} size={17} />What today covered
              <span style={{ marginLeft: "auto", display: "flex", color: C.ter }}>
                <Icon d={icons.chevron} size={14} sw={2.2} />
              </span>
            </button>
          </Card>
          {kept.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              {keptCard}
              <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 6px 0" }}>
                These ride with the entry — no “which brief?” here; that's decided after your record
                is right, and mostly by itself. Misheard something? Say it again and Recall replaces it.
              </div>
            </>
          )}
        </div>
      )}

      {/* one secondary in the flow, and only when there's a read to react
          to — mid-checking the page has exactly one job */}
      {(reopen || settledAll) && (
        <div style={{ marginTop: 18 }}>
          <BigButton tone="tinted" icon={<Icon d={icons.mic} size={18} />} onClick={onResume || onKeepOpen}>
            {reopen ? "Keep talking instead" : "Keep talking — add or fix by voice"}
          </BigButton>
        </div>
      )}
      {(reopen || pending.length === 0) && (
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
          {reopen
            ? "The morning entry stays exactly as finalized — this addition carries its own time stamp."
            : "Finalizing signs off today's entry — what didn't come up stays blank, and honest beats complete. If the evening brings something new, you can still add a note."}
        </div>
      )}
      </div>

      {/* ONE pinned button, always — no dead states, no second control
          dressed as a description. While cards are open it is tinted
          with the countdown (clearly tappable — the lock lives on the
          picture row, where inert is honest): the tap opens the gate,
          which explains and offers the way through. When the last OK
          lands it becomes the signature. */}
      <div style={{ flexShrink: 0, padding: "10px 16px 18px", background: C.bg,
        boxShadow: `0 -0.5px 0 ${C.line}` }}>
        {reopen ? (
          <BigButton onClick={doFinalize}>Add to today's entry</BigButton>
        ) : pending.length > 0 ? (
          <BigButton tone="tinted" onClick={() => setGate(true)}>
            Finalize — {pending.length} to go
          </BigButton>
        ) : (
          <div className="stepIn">
            <BigButton onClick={doFinalize}>Finalize check-in</BigButton>
          </div>
        )}
      </div>

      {fixing && (
        <FixSheet cap={fixing} prev={fixes[fixing.t]} onClose={() => setFixing(null)} onSave={saveFix}
          onSay={() => { setFixing(null); (onResume || onKeepOpen)(); }} />
      )}

      {gate && (
        <Sheet title={pending.length > 1 ? `${nWord} things still need your OK` : "One thing still needs your OK"}
          onClose={() => setGate(false)}>
          <Card>
            {pending.map((c, i) => (
              <div key={c.t}>
                {i > 0 && <Divider />}
                <Row leading={<Icon d={icons[c.icon] || icons.check} size={19} />}
                  leadingBg={C.orangeSoft} leadColor={C.orange} title={c.t} sub={c.sub} right={null} />
              </div>
            ))}
          </Card>
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 12px" }}>
            Nothing is added without your OK — anything left open stays out of your record and waits in
            Updates. The day also stays open, so finishing tonight is fine too.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <BigButton onClick={() => { setGate(false); setOpenId(pending[0].t); }}>
              {pending.length > 1 ? "Go back to them" : "Go back to it"}
            </BigButton>
            <BigButton tone="tinted" onClick={doFinalize}>
              {pending.length > 1 ? "Finalize without them" : "Finalize without it"}
            </BigButton>
          </div>
        </Sheet>
      )}

      {readOpen && <HowReadSheet onClose={() => setReadOpen(false)} />}
    </div>
  );
};

const BriefReportPage = ({ onBack, openShare }) => (
  <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 25, background: C.bg,
    display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 12px 8px" }}>
      <button className="tap" onClick={onBack} style={{ border: "none", background: "none", color: C.blue,
        fontSize: 17, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
        display: "flex", alignItems: "center", gap: 1, padding: "8px 6px" }}>
        <Icon d={icons.back} size={22} sw={2.4} />Back
      </button>
      <button className="tap" onClick={openShare} style={{ display: "flex", alignItems: "center", gap: 7,
        border: "none", background: C.blue, color: "#fff", borderRadius: 99, padding: "10px 17px",
        fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
        <Icon d={icons.share} size={16} />Share
      </button>
    </div>

    <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
      <div style={{ background: C.card, borderRadius: 14, padding: "24px 20px",
        boxShadow: "0 8px 24px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.ter }}>
          Visit brief · prepared with Recall
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 2px", letterSpacing: "-.015em" }}>
          Dr. Chen — Cardiology
        </div>
        <div style={{ fontSize: 15, color: C.sub }}>10:15 AM · Amma T.</div>
        {/* the chart line every clinical document leads with — this is
            where the profile visibly rides: born, sex, allergy, language.
            The penicillin promise ("rides every brief") is KEPT here,
            not just claimed on the profile page. */}
        <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4 }}>
          Born 1948 · Female · Allergic to penicillin · Speaks English & French
        </div>
        {[
          /* SOAP's chief complaint leads every clinical document — the
             brief opens with the reason the way the chart would */
          ["Reason for visit", "Blood-pressure follow-up — Dr. Patel's referral. Also worth naming: brief morning dizziness on standing, new these two weeks."],
          ["Since the last visit", "12 daily check-ins over 2 weeks. Overall steady, with mild knee pain on longer walks and one missed evening dose (noted July 27)."],
          ["Patterns worth mentioning", "• Knee soreness follows walks over 30 minutes, eases by evening\n• Sleep steadier on morning-walk days\n• Energy dips after nights under 6 hours"],
          ["Current medications", "Metformin 500 mg (morning & evening) · Lisinopril 10 mg (morning) · Vitamin D 1000 IU"],
          ["Amma's questions", "1. Should the water pill move to mornings?\n2. Is a knee brace worth trying for longer walks?"],
          ["Attached", "Blood test results (July 25) · Insurance card"],
        ].map(([h, b]) => (
          <div key={h} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
              color: C.blue, borderBottom: `0.5px solid ${C.line}`, paddingBottom: 6, marginBottom: 8 }}>
              {h}
            </div>
            <div style={{ fontSize: 15.5, lineHeight: 1.6, whiteSpace: "pre-line" }}>{b}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ padding: "8px 14px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card,
        borderRadius: 99, padding: "7px 7px 7px 17px", boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)" }}>
        <span style={{ flex: 1, fontSize: 15, color: C.ter }}>Say or type what to change…</span>
        <button className="tap" style={{ width: 42, height: 42, borderRadius: 99, border: "none",
          background: C.blue, color: "#fff", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.mic} size={19} />
        </button>
      </div>
    </div>
  </div>
);

/* ============ recording a visit — consent first, then quiet ========= */
/*                                                                      */
/*  Three design calls, argued:                                         */
/*  · Consent lives BEFORE the red button, as the arming screen — not   */
/*    a banner during. Asking must precede capture (legally in two-     */
/*    party regions, socially everywhere); a mid-recording reminder     */
/*    arrives after the fact and reads as nagging. One screen, one      */
/*    ask, one tap.                                                     */
/*  · NO orb while recording. The face means "Recall is the other      */
/*    party" (calls, chat). This conversation belongs to Amma and her  */
/*    doctor; Recall is the notebook, not a participant — it earns its */
/*    face back at processing time, where thinking IS its job. The     */
/*    screen stays quiet on purpose: the instruction is "set the       */
/*    phone down," and nothing on it should ask to be watched.         */
/*  · The waveform is a TICKER, not a dancing bar chart: sound is      */
/*    born at the red now-line and drifts left into history, so the    */
/*    line quietly says "time is passing, and it's being kept."        */
/* -------------------------------------------------------------------- */

/* ---- the live translate table — two seatings, two grammars --------- */
/*                                                                      */
/*  The correction that made this right (Seyon): a flipped half that    */
/*  someone is READING is a half they will reach for. Face to face had  */
/*  the doctor's glass but kept both mics at Amma's edge — a screen     */
/*  addressed to someone with no way in. The shipping apps already      */
/*  split this cleanly, and the split is by SEATING, not preference:    */
/*                                                                      */
/*  · Face to face (across a desk) — Apple Translate's Face to Face:    */
/*    the screen splits, the far half rotates 180°, and EACH SEAT GETS  */
/*    ITS OWN MIC at its own near edge. Both halves are the same        */
/*    component; the rotation is what makes the mirror exact, so each   */
/*    person sees their words above their button, every time. Amma      */
/*    keeps a quiet second control ("or tap for Dr. Chen") because the  */
/*    hands-off doctor is real — dual control, not either/or: the       */
/*    doctor who won't touch a stranger's phone never has to, and the   */
/*    one who reaches finds a button where they expect one.             */
/*  · Side by side (same side, one screen) — Apple's Conversation view  */
/*    and Google Translate's conversation mode: no flip, no halves.     */
/*    One upright feed of BUBBLES, and both mics at the shared bottom   */
/*    edge, each on the side its bubbles land (doctor left, you right)  */
/*    so everything about a person lives in one column.                 */
/*                                                                      */
/*  Bubbles are also the answer to "both languages at once is a lot":   */
/*    left/right alignment carries WHO, which frees weight to carry     */
/*    WHICH LANGUAGE — Amma's language is the ink line in every bubble, */
/*    the doctor's the quiet one under it. Two cues, two jobs, neither  */
/*    doing both.                                                       */

/* one language mic — used in the shared bottom row (side by side) */
const XlateMic = ({ color, soft, langId, name, armed, dim, onTap, onPickLang, ariaLabel }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    flex: 1, opacity: dim ? 0.4 : 1, transition: "opacity .2s" }}>
    <button className="tap" onClick={onTap} aria-label={ariaLabel}
      style={{ width: 64, height: 64, borderRadius: 99, border: "none", cursor: "pointer",
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        background: armed ? color : soft, color: armed ? "#fff" : color, transition: "background .2s" }}>
      {armed && <span className="orbRing" style={{ position: "absolute", inset: -3,
        borderRadius: 99, border: `2px solid ${color}` }} />}
      {armed ? (
        <span style={{ display: "flex", gap: 3, alignItems: "center", height: 20 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="wavebar" style={{ height: 7 + (i % 2) * 9,
              animationDelay: `${i * 0.12}s`, background: "#fff" }} />
          ))}
        </span>
      ) : <Icon d={icons.mic} size={25} sw={2} />}
    </button>
    <span style={{ fontSize: 14, fontWeight: 700, color: armed ? color : C.ink }}>{name}</span>
    <button className="tap" onClick={onPickLang}
      style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT,
        fontSize: 12.5, fontWeight: 600, color: C.sub, padding: "1px 8px 3px" }}>
      {(XLATE_LANGS.find((l) => l.id === langId) || XLATE_LANGS[0]).name} ▾
    </button>
  </div>
);

/* one SEAT — text above, your own mic below. Face to face renders two of
   these and rotates the far one; because the internals are identical,
   the mirror is exact and neither person has to learn the other's
   layout. */
const XlateSeat = ({ who, rotated, lang, setLang, msgs, armed, onMic, onArmOther, hint }) => {
  const L = XLATE_LABELS[lang] || XLATE_LABELS.en;
  const [picker, setPicker] = useState(false);
  const mine = who === "dr" ? C.blue : C.green;
  const mineSoft = who === "dr" ? C.blueSoft : C.greenSoft;
  const isArmed = armed === who;
  const otherArmed = !!armed && !isArmed;
  const shown = msgs.slice(-2);
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
      transform: rotated ? "rotate(180deg)" : "none", padding: "12px 18px 10px",
      position: "relative" }}>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
        justifyContent: "flex-end", gap: 8, overflow: "hidden" }}>
        {isArmed ? (
          <div className="fadeMsg" style={{ display: "flex", flexDirection: "column",
            alignItems: "center", gap: 10, paddingBottom: 6 }}>
            <span style={{ display: "flex", gap: 4, alignItems: "center", height: 24 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="wavebar" style={{ height: 9 + (i % 3) * 8,
                  animationDelay: `${i * 0.11}s`, background: mine, width: 3.5 }} />
              ))}
            </span>
            <div style={{ fontSize: 20, fontWeight: 700, color: mine, textAlign: "center" }}>
              {L.listenBig}
            </div>
          </div>
        ) : otherArmed ? (
          <div className="fadeMsg" style={{ fontSize: 15, color: C.ter, textAlign: "center",
            paddingBottom: 6 }}>
            {who === "dr" ? L.ammaSpeaking : L.drSpeaking}
          </div>
        ) : shown.length === 0 ? (
          <div style={{ background: mineSoft, borderRadius: 15, padding: "13px 15px",
            fontSize: 15, lineHeight: 1.5, color: C.ink }}>
            {XLATE_INTRO[who][lang] || XLATE_INTRO[who].en}
          </div>
        ) : shown.map((m, i) => {
          const last = i === shown.length - 1;
          return (
            <div key={m.id} className="fadeMsg" style={{ opacity: last ? 1 : 0.42 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", marginBottom: 2,
                color: m.who === "dr" ? C.blue : C.greenInk }}>
                {m.who === who ? L.me : m.who === "dr" ? L.dr : L.amma}
              </div>
              <div style={{ fontSize: last ? 19 : 15, lineHeight: 1.4, fontWeight: 600, color: C.ink }}>
                {m.line[lang] || m.line.en}
              </div>
              {last && m.who !== who && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3,
                  fontSize: 12, color: C.ter }}>
                  <Icon d={icons.speaker} size={13} sw={2} />{L.spoken}
                </div>
              )}
            </div>
          );
        })}
        {hint && (
          <div className="fadeMsg" style={{ fontSize: 12.5, color: C.ter, textAlign: "center",
            background: C.card, borderRadius: 99, padding: "6px 12px" }}>
            {L.done}
          </div>
        )}
      </div>

      {/* your own mic, at your own near edge — the rotation puts the
          doctor's at the screen's top, which is the edge nearest them */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column",
        alignItems: "center", gap: 3, paddingTop: 8 }}>
        <button className="tap" onClick={onMic}
          aria-label={who === "dr" ? "Doctor microphone" : "Your microphone"}
          style={{ width: 60, height: 60, borderRadius: 99, border: "none", cursor: "pointer",
            position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
            background: isArmed ? mine : mineSoft, color: isArmed ? "#fff" : mine,
            opacity: otherArmed ? 0.4 : 1, transition: "background .2s, opacity .2s" }}>
          {isArmed && <span className="orbRing" style={{ position: "absolute", inset: -3,
            borderRadius: 99, border: `2px solid ${mine}` }} />}
          {isArmed ? (
            <span style={{ display: "flex", gap: 3, alignItems: "center", height: 19 }}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="wavebar" style={{ height: 7 + (i % 2) * 9,
                  animationDelay: `${i * 0.12}s`, background: "#fff" }} />
              ))}
            </span>
          ) : <Icon d={icons.mic} size={24} sw={2} />}
        </button>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: isArmed ? mine : C.ink }}>
          {who === "dr" ? L.dr : L.me}
        </span>
        <button className="tap" onClick={() => setPicker(!picker)}
          style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT,
            fontSize: 12.5, fontWeight: 600, color: C.sub, padding: "1px 8px 2px" }}>
          {(XLATE_LANGS.find((l) => l.id === lang) || XLATE_LANGS[0]).name} ▾
        </button>
        {/* the hands-off doctor, covered without taking their button
            away — quiet, secondary, never competing with her own mic */}
        {onArmOther && (
          <button className="tap" onClick={onArmOther}
            style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT,
              fontSize: 12.5, fontWeight: 600, color: C.blue, padding: "5px 10px" }}>
            {L.tapForThem}
          </button>
        )}
      </div>

      {picker && (
        <>
          <div onClick={() => setPicker(false)} style={{ position: "absolute", inset: 0, zIndex: 6 }} />
          <div className="menuIn" style={{ position: "absolute", bottom: 92, left: "50%",
            transform: "translateX(-50%)", zIndex: 7, background: C.card, borderRadius: 13,
            boxShadow: "0 10px 30px rgba(0,0,0,.22)", padding: 5, width: 154 }}>
            {XLATE_LANGS.map((l) => (
              <button key={l.id} className="tap" onClick={() => { setLang(l.id); setPicker(false); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", border: "none", background: "transparent", borderRadius: 9,
                  padding: "10px 12px", fontSize: 15, fontWeight: 600, color: C.ink,
                  cursor: "pointer", fontFamily: FONT }}>
                {l.name}
                {lang === l.id && <Icon d={icons.check} size={14} sw={2.6} color={C.blue} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* side by side — one upright feed, bubbles aligned to their speaker.
   Alignment carries WHO, so weight is free to carry WHICH LANGUAGE:
   Amma's is the ink line in every bubble, the doctor's the quiet one
   beneath. Nothing alternates, nothing has to be re-read. */
const XlateShared = ({ msgs, drLang, youLang, Lyou, armed }) => (
  <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex",
    flexDirection: "column", justifyContent: "flex-end", gap: 10, padding: "14px 16px 6px" }}>
    {msgs.length === 0 ? (
      <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px",
        fontSize: 15, lineHeight: 1.55 }}>
        <div style={{ marginBottom: 8 }}>{XLATE_INTRO.you[youLang] || XLATE_INTRO.you.en}</div>
        <div style={{ color: C.sub, fontSize: 14 }}>{XLATE_INTRO.dr[drLang] || XLATE_INTRO.dr.en}</div>
      </div>
    ) : msgs.map((m) => {
      const dr = m.who === "dr";
      return (
        <div key={m.id} className="fadeMsg"
          style={{ display: "flex", justifyContent: dr ? "flex-start" : "flex-end" }}>
          <div style={{ maxWidth: "86%", background: dr ? C.blueSoft : C.greenSoft,
            borderRadius: 17, padding: "10px 14px",
            borderBottomLeftRadius: dr ? 5 : 17, borderBottomRightRadius: dr ? 17 : 5 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", marginBottom: 3,
              color: dr ? C.blue : C.greenInk }}>
              {dr ? Lyou.dr : Lyou.me}
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 650, lineHeight: 1.4, color: C.ink }}>
              {m.line[youLang] || m.line.en}
            </div>
            {drLang !== youLang && (
              <div style={{ fontSize: 13.5, lineHeight: 1.4, color: C.sub, marginTop: 3 }}>
                {m.line[drLang] || m.line.en}
              </div>
            )}
          </div>
        </div>
      );
    })}
    {armed && (
      <div className="fadeMsg" style={{ display: "flex", alignItems: "center", gap: 8,
        justifyContent: "center", paddingTop: 2 }}>
        <span style={{ display: "flex", gap: 3, alignItems: "center", height: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="wavebar" style={{ height: 6 + (i % 2) * 7,
              animationDelay: `${i * 0.12}s`,
              background: armed === "dr" ? C.blue : C.green }} />
          ))}
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600,
          color: armed === "dr" ? C.blue : C.greenInk }}>
          {armed === "dr" ? Lyou.drSpeaking : Lyou.ammaSpeaking}
        </span>
      </div>
    )}
  </div>
);

const XlateOverlay = ({ elapsed, onClose }) => {
  const [mode, setMode] = useState("face");         /* face · side */
  const [drLang, setDrLang] = useState("en");
  const [youLang, setYouLang] = useState("ta");
  const [msgs, setMsgs] = useState([]);
  const [armed, setArmed] = useState(null);         /* which mic is hot */
  const [hint, setHint] = useState(null);
  const [picker, setPicker] = useState(null);       /* shared row only */
  const idxRef = useRef({ dr: 0, you: 0 });
  const Lyou = XLATE_LABELS[youLang] || XLATE_LABELS.en;

  const land = (who) => {
    const queue = XLATE_LINES.filter((l) => l.who === who);
    const i = idxRef.current[who];
    if (i >= queue.length) { setHint(who); setTimeout(() => setHint(null), 2600); return; }
    idxRef.current[who] = i + 1;
    setMsgs((p) => [...p, { id: `${who}${i}`, who, line: queue[i] }]);
    buzz();
  };
  const tapMic = (who) => {
    if (armed) return;
    const queue = XLATE_LINES.filter((l) => l.who === who);
    if (idxRef.current[who] >= queue.length) { land(who); return; }
    setArmed(who);
    setTimeout(() => { setArmed(null); land(who); }, 1600);
  };

  /* the seam both people can see: the honest part (still recording),
     the seating switch, the way back */
  const strip = (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
      padding: "8px 12px", background: C.card, zIndex: 5,
      boxShadow: "0 -0.5px 0 rgba(0,0,0,.1), 0 0.5px 0 rgba(0,0,0,.1)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, background: C.redSoft,
        color: C.red, borderRadius: 99, padding: "6px 10px", fontSize: 13, fontWeight: 700,
        fontVariantNumeric: "tabular-nums" }}>
        <span className="blink" style={{ width: 7, height: 7, borderRadius: 99, background: C.red }} />
        {fmtClock(elapsed)}
      </span>
      <div style={{ display: "flex", background: C.bg, borderRadius: 99, padding: 3, flex: 1 }}>
        {[["face", "Face to face"], ["side", "Side by side"]].map(([id, label]) => (
          <button key={id} className="tap" onClick={() => setMode(id)}
            style={{ flex: 1, border: "none", borderRadius: 99, padding: "6px 4px",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
              background: mode === id ? C.card : "transparent",
              color: mode === id ? C.ink : C.sub,
              boxShadow: mode === id ? "0 1px 3px rgba(0,0,0,.14)" : "none" }}>
            {label}
          </button>
        ))}
      </div>
      <button className="tap" onClick={onClose}
        style={{ border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99,
          padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: FONT, whiteSpace: "nowrap" }}>
        ‹ Recording
      </button>
    </div>
  );

  /* side by side only: both mics at the shared edge, each under the
     column its bubbles land in — doctor left, you right */
  const sharedMics = (
    <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: "8px 18px 14px",
      position: "relative" }}>
      <XlateMic color={C.blue} soft={C.blueSoft} langId={drLang} name={Lyou.dr}
        armed={armed === "dr"} dim={armed === "you"} ariaLabel="Doctor microphone"
        onTap={() => tapMic("dr")} onPickLang={() => setPicker(picker === "dr" ? null : "dr")} />
      <XlateMic color={C.green} soft={C.greenSoft} langId={youLang} name={Lyou.me}
        armed={armed === "you"} dim={armed === "dr"} ariaLabel="Your microphone"
        onTap={() => tapMic("you")} onPickLang={() => setPicker(picker === "you" ? null : "you")} />
      {picker && (
        <>
          <div onClick={() => setPicker(null)} style={{ position: "fixed", inset: 0, zIndex: 6 }} />
          <div className="menuIn" style={{ position: "absolute", bottom: 104, zIndex: 7,
            left: picker === "dr" ? "12%" : "62%", background: C.card, borderRadius: 13,
            boxShadow: "0 10px 30px rgba(0,0,0,.22)", padding: 5, width: 150 }}>
            {XLATE_LANGS.map((l) => (
              <button key={l.id} className="tap"
                onClick={() => { (picker === "dr" ? setDrLang : setYouLang)(l.id); setPicker(null); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", border: "none", background: "transparent", borderRadius: 9,
                  padding: "10px 12px", fontSize: 15, fontWeight: 600, color: C.ink,
                  cursor: "pointer", fontFamily: FONT }}>
                {l.name}
                {(picker === "dr" ? drLang : youLang) === l.id &&
                  <Icon d={icons.check} size={14} sw={2.6} color={C.blue} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 46, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      {mode === "face" ? (
        <>
          <XlateSeat who="dr" rotated lang={drLang} setLang={setDrLang} msgs={msgs}
            armed={armed} onMic={() => tapMic("dr")} hint={hint === "dr"} />
          {strip}
          <XlateSeat who="you" lang={youLang} setLang={setYouLang} msgs={msgs}
            armed={armed} onMic={() => tapMic("you")} hint={hint === "you"}
            onArmOther={() => tapMic("dr")} />
        </>
      ) : (
        <>
          {strip}
          <XlateShared msgs={msgs} drLang={drLang} youLang={youLang} Lyou={Lyou} armed={armed} />
          {hint && (
            <div className="fadeMsg" style={{ fontSize: 12.5, color: C.ter, textAlign: "center",
              padding: "0 18px 4px" }}>
              {Lyou.done}
            </div>
          )}
          {sharedMics}
        </>
      )}
    </div>
  );
};

const RecordPage = ({ title = "Dr. Chen · Cardiology", forWhom, onCancel, onFinish, onDiscard }) => {
  const [phase, setPhase] = useState("ready");     /* ready · rec · paused */
  const [elapsed, setElapsed] = useState(0);
  const [bars, setBars] = useState([]);
  const [xlate, setXlate] = useState(false);
  const [finishAsk, setFinishAsk] = useState(false);
  const [discardArm, setDiscardArm] = useState(false);
  const lastH = useRef(22);

  useEffect(() => {
    if (phase !== "rec") return;
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(tick);
  }, [phase]);
  useEffect(() => {
    if (phase !== "rec") return;
    const iv = setInterval(() => {
      setBars((prev) => {
        const target = 7 + Math.random() * 54 * (Math.random() < 0.16 ? 0.25 : 1);
        const h = lastH.current * 0.5 + target * 0.5;
        lastH.current = h;
        const next = [...prev, h];
        return next.length > 46 ? next.slice(next.length - 46) : next;
      });
    }, 150);
    return () => clearInterval(iv);
  }, [phase]);

  const rec = phase === "rec"; const paused = phase === "paused";

  return (
    <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 40, background: C.bg,
      display: "flex", flexDirection: "column" }}>
      {phase === "ready" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 10px 0", flexShrink: 0 }}>
            <button className="tap" onClick={onCancel} aria-label="Back"
              style={{ border: "none", background: "none", color: C.blue, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 1, fontFamily: FONT,
                fontSize: 17, fontWeight: 600, padding: "11px 10px 11px 6px" }}>
              <Icon d={icons.back} size={22} sw={2.4} />Back
            </button>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
            padding: "0 22px", gap: 14 }}>
            <div style={{ padding: "0 2px 2px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>Record this visit</div>
              <div style={{ fontSize: 15, color: C.sub, marginTop: 3 }}>{title}</div>
            </div>
            <Card>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 99, background: C.blueSoft,
                  color: C.blue, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0 }}>
                  <Icon d={icons.mic} size={19} />
                </div>
                <div>
                  <div style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 4 }}>
                    One ask before the red button
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.55, color: C.ink }}>
                    “Okay if I record this, so I can listen back at home?” — doctors hear it every
                    day, and almost always say yes.
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, marginTop: 12,
                paddingTop: 12, borderTop: `0.5px solid ${C.line}` }}>
                The recording stays on your phone. Nothing is shared unless you choose to share it.
              </div>
            </Card>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 6px",
              fontSize: 13.5, color: C.ter, lineHeight: 1.45 }}>
              <Icon d={icons.globe} size={15} sw={2} />
              Different languages in the room? Live translate is one tap away while recording.
            </div>
          </div>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 10, padding: "0 20px 30px" }}>
            <button className="tap" onClick={() => { buzz(BUZZ_THUMP); setPhase("rec"); }}
              aria-label="Start recording"
              style={{ width: 78, height: 78, borderRadius: 99, border: `3.5px solid ${C.red}`,
                background: "transparent", cursor: "pointer", padding: 5,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: "100%", height: "100%", borderRadius: 99, background: C.red,
                display: "block" }} />
            </button>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>Start recording</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 18px 0", flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{paused ? "Paused" : "Recording"}</div>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{title}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7,
              background: paused ? C.orangeSoft : C.redSoft, color: paused ? C.orangeInk : C.red,
              borderRadius: 99, padding: "8px 14px", fontSize: 14.5, fontWeight: 700,
              fontVariantNumeric: "tabular-nums" }}>
              <span className={paused ? "" : "blink"} style={{ width: 9, height: 9, borderRadius: 99,
                background: paused ? C.orange : C.red, display: "block" }} />
              {paused ? "On hold" : "REC"}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 26, padding: "0 0 8px" }}>
            <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-.015em",
              fontVariantNumeric: "tabular-nums", color: paused ? C.sub : C.ink,
              transition: "color .3s" }}>
              {fmtClock(elapsed)}
            </div>

            {/* the ticker: sound is born at the red line and drifts into
                history; the dotted stretch ahead is time not yet lived.
                The now-line sits dead center — Voice Memos' balance:
                history and future weigh the same, nothing reads askew. */}
            <div style={{ width: "100%", height: 84, position: "relative", overflow: "hidden",
              opacity: paused ? 0.45 : 1, transition: "opacity .3s" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1,
                background: C.line }} />
              <div style={{ position: "absolute", left: "50%", right: 16, top: "50%",
                borderTop: `1.5px dashed ${C.dash}` }} />
              <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, display: "flex",
                alignItems: "center", gap: 2.5 }}>
                {bars.map((h, i) => (
                  <div key={i} className={i === bars.length - 1 ? "barIn" : ""}
                    style={{ width: 3.5, height: h, borderRadius: 99, flexShrink: 0,
                      background: paused ? C.ter : C.red,
                      opacity: 0.3 + 0.7 * ((i + 1) / bars.length) }} />
                ))}
              </div>
              <div style={{ position: "absolute", left: "50%", top: 6, bottom: 6, width: 2,
                borderRadius: 99, background: paused ? C.orange : C.red }} />
              <div style={{ position: "absolute", left: "50%", top: 2, width: 8, height: 8,
                borderRadius: 99, background: paused ? C.orange : C.red,
                transform: "translateX(-3px)" }} />
            </div>

            <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.55, textAlign: "center",
              padding: "0 34px" }}>
              {paused
                ? "Nothing is being heard. Resume when you're ready."
                : "Set the phone down — be with your doctor. Recall is taking the notes."}
            </div>
          </div>

          <div style={{ padding: "0 16px 26px", display: "flex", gap: 10, flexShrink: 0 }}>
            <button className="tap" onClick={() => setXlate(true)}
              style={{ flex: 1, minHeight: 56, borderRadius: 14, border: "none",
                background: C.blueSoft, color: C.blue, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3, whiteSpace: "nowrap" }}>
              <Icon d={icons.globe} size={19} />Live translate
            </button>
            <button className="tap" onClick={() => setPhase(paused ? "rec" : "paused")}
              style={{ flex: 1, minHeight: 56, borderRadius: 14, border: "none",
                background: paused ? C.orange : C.bg, color: paused ? "#fff" : C.ink,
                boxShadow: paused ? "none" : "0 0 0 0.5px rgba(0,0,0,.08)",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 3 }}>
              <Icon d={paused ? icons.play : icons.pause} size={19} sw={2.2} />
              {paused ? "Resume" : "Pause"}
            </button>
            <button className="tap" onClick={() => setFinishAsk(true)}
              style={{ flex: 1, minHeight: 56, borderRadius: 14, border: "none",
                background: C.red, color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3 }}>
              <span style={{ width: 15, height: 15, borderRadius: 4.5, background: "#fff",
                display: "block" }} />
              Finish
            </button>
          </div>
        </>
      )}

      {xlate && <XlateOverlay elapsed={elapsed} onClose={() => setXlate(false)} />}

      {finishAsk && (
        <Sheet title="Finish recording?" onClose={() => { setFinishAsk(false); setDiscardArm(false); }}>
          <div style={{ fontSize: 15.5, lineHeight: 1.55, color: C.ink, padding: "0 2px 16px" }}>
            <b>{fmtClock(elapsed)}</b> recorded{forWhom ? ` for ${forWhom}` : ""}. Next, Recall writes
            the transcript and a plain-language summary — about fifteen seconds, and you can watch.
          </div>
          <BigButton tone="red" onClick={() => onFinish(elapsed)}>Finish & save</BigButton>
          <div style={{ height: 8 }} />
          <BigButton tone="tinted" onClick={() => { setFinishAsk(false); setDiscardArm(false); }}>
            Keep recording
          </BigButton>
          <button className="tap"
            onClick={() => (discardArm ? onDiscard() : setDiscardArm(true))}
            style={{ display: "block", margin: "14px auto 0", border: "none", background: "none",
              color: C.red, fontSize: 14.5, fontWeight: discardArm ? 700 : 600, cursor: "pointer",
              fontFamily: FONT, padding: "8px 12px" }}>
            {discardArm ? "Tap again — it's gone for good" : "Discard the recording"}
          </button>
        </Sheet>
      )}
    </div>
  );
};

/* ---------------------------- sheets ------------------------------- */

const Sheet = ({ title, onClose, children }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)" }} />
    <div className="sheetIn" style={{ position: "relative", background: C.bg, borderRadius: "22px 22px 0 0",
      padding: "8px 16px 24px", maxHeight: "88%", overflowY: "auto" }}>
      <div style={{ width: 38, height: 5, borderRadius: 99, background: C.track, margin: "4px auto 12px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.01em" }}>{title}</div>
        {/* labeled for screen readers, 44px for shaky hands — an unlabeled
            36px X was the audit's first catch */}
        <button className="tap" onClick={onClose} aria-label="Close" style={{ width: 44, height: 44,
          borderRadius: 99, border: "none", background: C.track, color: C.sub, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={17} sw={2.4} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const AddVisitSheet = ({ onClose, onRecord, onUpcoming }) => (
  <Sheet title="Add a visit" onClose={onClose}>
    <Card onClick={onUpcoming}>
      <Row leading={<Icon d={icons.visits} size={20} />} title="An upcoming appointment"
        sub="Pick the doctor and date — Recall starts a brief two weeks before." />
    </Card>
    <div style={{ height: 10 }} />
    <Card onClick={onRecord} style={{ boxShadow: `0 0 0 1.5px ${C.red}` }}>
      <Row leading={<span style={{ width: 12, height: 12, borderRadius: 99, background: C.red, display: "block" }} />}
        leadingBg={C.redSoft} title="Record a visit happening now"
        sub="You're at the doctor's — start recording right away." />
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0" }}>
      Either way it ends up in Visits — upcoming ones build a brief, recorded ones get a transcript and summary.
    </div>
  </Sheet>
);

const AddDocSheet = ({ onClose, onScan, onAdd }) => (
  <Sheet title="Add a document" onClose={onClose}>
    <Card onClick={onScan} style={{ boxShadow: `0 0 0 1.5px ${C.blue}` }}>
      <Row leading={<Icon d={icons.camera} size={20} />} title="Scan with the camera"
        sub="One page or a whole stack — Recall straightens each page and detects what it is." />
    </Card>
    <div style={{ height: 10 }} />
    <Card onClick={onAdd}>
      <Row leading={<Icon d={icons.share} size={20} />} title="Upload a file"
        sub="A PDF or photo already on your phone." />
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0" }}>
      After it's read, you'll get the original, a plain-language summary, and a translate button — and Recall
      will flag anything worth asking a doctor about.
    </div>
  </Sheet>
);

/* one check-in CTA — the call/chat choice is progressive disclosure */
const CheckinModeSheet = ({ onPick, onClose }) => (
  <Sheet title="How would you like to do it?" onClose={onClose}>
    <Card onClick={() => onPick("voice")} style={{ boxShadow: `0 0 0 1.5px ${C.blue}` }}>
      <Row leading={<Icon d={icons.mic} size={20} />} title="A call with Recall"
        sub="Hands-free — Recall talks and listens, like a phone call." />
    </Card>
    <div style={{ height: 10 }} />
    <Card onClick={() => onPick("chat")}>
      <Row leading={<Icon d={icons.chat} size={20} />} title="Chat instead"
        sub="Type or talk at your own pace, and read the replies as you go." />
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0" }}>
      Both land in the same entry — and you can switch between call and chat mid-conversation
      without losing your place.
    </div>
  </Sheet>
);

/* Apple's "Edit Medications List" pattern — editing opens a sheet,
   the page underneath never morphs in place */
const EditCabinetSheet = ({ period, customMeds, onRemove, onAddMed, onClose, showToast }) => (
  <Sheet title="Edit your cabinet" onClose={onClose}>
    <Card onClick={onAddMed} style={{ boxShadow: `0 0 0 1.5px ${C.blue}`, marginBottom: 12 }}>
      <Row leading={<Icon d={icons.plus} size={19} sw={2.4} />} title="Add a medication"
        sub="Search by name, or scan the bottle" />
    </Card>
    <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
      color: C.sub, margin: "4px 6px 8px" }}>
      Current medications
    </div>
    <Card>
      {customMeds.map((m, i) => (
        <div key={m.id}>
          {i > 0 && <Divider />}
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px" }}>
            <button className="tap" onClick={() => onRemove(m.id)} aria-label={`Remove ${m.name}`}
              style={{ width: 28, height: 28, borderRadius: 99, border: "none", cursor: "pointer",
                background: C.redSoft, color: C.red, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 19, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>−</button>
            <MiniAvatar look={m.look} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{m.name} {m.dose}</div>
              <div style={{ fontSize: 13.5, color: C.sub }}>{m.when}</div>
            </div>
            <span style={{ color: C.ter, fontSize: 19, flexShrink: 0 }}>☰</span>
          </div>
        </div>
      ))}
      {CABINET_BASE(period).map((name, i) => {
        const look = MED_LOOKS[name];
        return (
          <div key={name}>
            {(i > 0 || customMeds.length > 0) && <Divider />}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px" }}>
              <button className="tap" aria-label={`About removing ${name}`}
                onClick={() => showToast(`${shortMedName(name)} is part of your care plan — Recall will check with you in a chat before removing it.`, 3400)}
                style={{ width: 28, height: 28, borderRadius: 99, border: "none", cursor: "pointer",
                  background: C.track, color: C.ter, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 19, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>−</button>
              <MiniAvatar look={look} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 13.5, color: C.sub }}>{MED_DETAILS[name].schedule}</div>
              </div>
              <span style={{ color: C.ter, fontSize: 19, flexShrink: 0 }}>☰</span>
            </div>
          </div>
        );
      })}
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
      Removing a medication keeps its history in your journal — nothing you've logged is lost.
    </div>
  </Sheet>
);

/* edit a med from its own page — schedule & appearance, in a sheet */
const EditMedSheet = ({ med, custom, onSave, onClose }) => {
  const initLook = custom ? custom.look : MED_LOOKS[med.name] || { shape: "tablet", color: "white" };
  const schedStr = custom ? custom.when : MED_DETAILS[med.name]?.schedule || "";
  const asNeeded = /as needed/i.test(schedStr);
  const [timesSel, setTimesSel] = useState(() => new Set(
    [["morning", /morning/i], ["midday", /midday|noon/i], ["evening", /evening|dinner/i]]
      .filter(([, re]) => re.test(schedStr)).map(([k]) => k)));
  const [withFood, setWithFood] = useState(/with food/i.test(schedStr));
  const [shape, setShape] = useState(initLook.shape);
  const [color, setColor] = useState(initLook.color);
  const col = medColor(color);
  const toggleTime = (id) => setTimesSel((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const timesLabel = TIME_PRESETS.filter((t) => timesSel.has(t[0])).map((t) => t[1]).join(" & ");
  const when = asNeeded ? "As needed" : timesLabel + (withFood ? ", with food" : "");
  const slots = TIME_PRESETS.filter((t) => timesSel.has(t[0]))
    .map(([k, label, time]) => ({ key: k, label, time, order: SLOTS[k].order }));
  const ok = asNeeded || timesSel.size > 0;
  return (
    <Sheet title={`Edit ${shortMedName(med.name)}`} onClose={onClose}>
      <Card style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "4px 0" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: col[2],
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MedShape shape={shape} color={col[1]} size={48} />
          </div>
          <div style={{ fontSize: 16.5, fontWeight: 700 }}>{med.name}</div>
          <div style={{ fontSize: 13.5, color: C.sub }}>{when || "Pick at least one time"}</div>
        </div>
      </Card>

      {asNeeded ? (
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, padding: "10px 6px" }}>
          As-needed — there's no schedule to edit. Log doses from Today, or mention them in a check-in.
        </div>
      ) : (
        <>
          <SectionLabel>At what time?</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIME_PRESETS.map(([id, label, time]) => (
              <Chip key={id} label={`${label} · ${time}`} on={timesSel.has(id)} onClick={() => toggleTime(id)} />
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Card onClick={() => setWithFood(!withFood)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  border: withFood ? "none" : `2px solid ${C.ctrl}`,
                  background: withFood ? C.green : "#fff", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {withFood && <Icon d={icons.check} size={14} sw={3} />}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Take with food</div>
              </div>
            </Card>
          </div>
        </>
      )}

      <SectionLabel>Shape & color</SectionLabel>
      <Card style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          {MED_SHAPES.map(([id, label]) => (
            <button key={id} className="tap" onClick={() => setShape(id)} aria-label={label}
              style={{ border: "none", cursor: "pointer", fontFamily: FONT, padding: "6px 2px",
                borderRadius: 11, width: 50, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, background: shape === id ? C.blueSoft : "transparent" }}>
              <MedShape shape={id} color={shape === id ? col[1] : "#C7C7CE"} size={27} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: shape === id ? C.blue : C.sub }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
          {MED_COLORS.map(([id, hex]) => (
            <button key={id} className="tap" onClick={() => setColor(id)} aria-label={id}
              style={{ width: 36, height: 36, borderRadius: 99, cursor: "pointer", background: hex,
                border: color === id ? `3px solid ${C.ink}` : id === "white" ? `2px solid ${C.line}` : "2px solid transparent",
                boxShadow: color === id ? "none" : "0 1px 3px rgba(0,0,0,.12)" }} />
          ))}
        </div>
      </Card>

      <div style={{ marginTop: 14, opacity: ok ? 1 : 0.45 }}>
        <BigButton onClick={() => ok && onSave({ when, slots, look: { shape, color } })}>Save changes</BigButton>
      </div>
    </Sheet>
  );
};

/* ============== care spaces — the door, the pages, the rooms ========= */

/* iOS-style switch — used for fact-shares and notification prefs */
/* the visual pill stays Apple-sized; the BUTTON is a 44pt hit box —
   switches are exactly where a shaky thumb gets punished for precision */
const Toggle = ({ on, onClick }) => (
  <button className="tap" onClick={onClick} aria-label={on ? "On" : "Off"}
    style={{ width: 54, height: 44, border: "none", cursor: "pointer", flexShrink: 0,
      background: "transparent", position: "relative", padding: 0 }}>
    <span style={{ position: "absolute", top: 8, left: 4, width: 46, height: 28, borderRadius: 99,
      background: on ? C.green : C.track, transition: "background .15s ease" }} />
    <span style={{ position: "absolute", top: 10, left: on ? 24 : 6, width: 24, height: 24, borderRadius: 99,
      background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.25)", transition: "left .15s ease" }} />
  </button>
);

const NewChip = ({ n }) => (
  <span style={{ fontSize: 13, fontWeight: 700, color: C.orangeInk, background: C.orangeSoft,
    borderRadius: 99, padding: "5px 11px", flexShrink: 0, marginRight: 4 }}>{n} new</span>
);

const StatusChip = ({ status }) => {
  const cfg = {
    yes: { label: "Yes ✓", bg: C.greenSoft, color: C.greenInk },
    wait: { label: "Waiting", bg: C.track, color: C.sub },
    no: { label: "Not this time", bg: C.track, color: C.sub },
  }[status];
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.bg,
      borderRadius: 99, padding: "6px 12px", flexShrink: 0 }}>{cfg.label}</span>
  );
};

/* ------------------- day zero — the setup receipt ------------------- */
/* Setup was a phone call, not a wizard — so day zero's surface is a
   RECEIPT, not a flow. Every "from your setup" provenance line in the
   app finally has a place to land: one page that lists what the call
   made (each row a door to the real thing), quotes the consent moment
   word for word, and names the shelf's emptiness as a made thing —
   because the absence IS the principle: nothing enters her record that
   she didn't put there. One page, every period; history doesn't expire. */
const SetupStoryPage = ({ period, obSummary, onBack, onMember, onGoTab, onHealth, onPrivacy }) => {
  const day1 = period === "day1";
  /* ---- the SELF variant: the receipt of the setup you just walked ----
     Straight out of the flow, the page reads back the session's own
     facts — what you typed, what the ~90-second talk heard, what is
     deliberately NOT set up yet — and one frame line names the seam:
     this page is yours; the world around it continues as Amma so weeks
     of use are walkable. Two beginnings, each telling its own truth. */
  if (obSummary) {
    const o = obSummary;
    const answered = [
      `${o.name}${o.pron ? ` · ${o.pron}` : ""}`,
      `Born ${o.born}`,
      o.sex === "unsaid" ? "Sex — left unsaid, and that's fine" : o.sex,
      o.lang,
      `${o.region} — your health region`,
      o.noAllergy ? "No medication allergies you know of"
        : `Allergic to ${o.allergies.join(", ")}`,
    ];
    return (
      <Page title="How your Recall began" onBack={onBack}>
        <Card tone={C.blueSoft}>
          <div style={{ display: "flex", gap: 13 }}>
            <RecallOrb size={44} mood="happy" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: C.blueDeep }}>
                A few answers, then a first short talk
              </div>
              <div style={{ fontSize: 14.5, color: C.blueSub, lineHeight: 1.5, marginTop: 3 }}>
                Just now · the questions took a couple of minutes; the talk, about 90 seconds.
                Everything below is what you gave — nothing else.
              </div>
            </div>
          </div>
        </Card>

        <SectionLabel>You answered</SectionLabel>
        <Card>
          {answered.map((t, i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 11,
              padding: "9px 2px", borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
              <span style={{ color: C.green, flexShrink: 0, display: "flex" }}>
                <Icon d={icons.check} size={15} sw={2.8} />
              </span>
              <span style={{ fontSize: 15.5, lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </Card>

        <SectionLabel>Your cabinet & your first short talk</SectionLabel>
        <Card>
          <Row leading={<Icon d={icons.meds} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
            title="Your medicine cabinet" right={null}
            sub={o.meds.length
              ? `${o.meds.join(" · ")} — added by you. The rest goes in from its own bottle, in the app.`
              : "Left for the bottles on purpose — each pill goes in from its own bottle, so nothing sits here you didn't put here."} />
          <Divider />
          <Row leading={<Icon d={icons.mic} size={19} />} leadingBg={C.purpleSoft} leadColor={C.purpleInk}
            title="Your first short talk" right={null}
            sub="About 90 seconds — the morning headaches, the short sleep, Dr. Dubois's Thursday visit, and your tablet question. It became today's entry, and it's still open: pick it up on Today, talk as long as you like." />
          <Divider />
          <Row leading={<Icon d={icons.bell} size={19} />} leadingBg={C.orangeSoft} leadColor={C.orange}
            title="Reminders" right={null} sub={o.reminderLine + "."} />
        </Card>

        <SectionLabel>Not set up yet — on purpose</SectionLabel>
        <Card>
          <div style={{ fontSize: 15, lineHeight: 1.55 }}>
            <b>No one else sees anything.</b> Family or a caregiver joins only by your
            invitation and their yes — from Your circle, whenever you like. Until then,
            every word stays on this phone.
          </div>
        </Card>

        {/* the seam, named where the question arises — on the receipt */}
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px",
          textAlign: "center" }}>
          This page is your own setup, kept exactly as you gave it. The rest of this preview
          continues as <b>Amma</b> — her journal, her circle, her weeks of use — so you can
          walk a life with Recall, not an empty first day.
        </div>
      </Page>
    );
  }
  return (
    <Page title="How Recall began" onBack={onBack}>
      {/* the call itself — an orb block, because Recall spoke here.
          "The same setup as anyone's, just asked out loud" is the whole
          bridge: setting up alone is a few taps and a first short talk;
          hers folded the SAME stations into one assisted call. The page
          below walks those stations in the flow's own order, so the
          receipt reads as the flow remembered, not a separate legend. */}
      <Card tone={C.blueSoft}>
        <div style={{ display: "flex", gap: 13 }}>
          <RecallOrb size={44} mood="calm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: C.blueDeep }}>
              One phone call — you, Sarah, and Recall
            </div>
            <div style={{ fontSize: 14.5, color: C.blueSub, lineHeight: 1.5, marginTop: 3 }}>
              {day1 ? "This morning, 9:15" : "Tuesday, July 21"} · about twenty minutes — the same
              setup as anyone's, just asked out loud. You talked, Sarah checked the spellings, and
              every piece was read back before it was kept.
            </div>
          </div>
        </div>
      </Card>

      <SectionLabel>What the call walked through</SectionLabel>
      <Card>
        {/* station order = the flow's own order: the floor questions,
            the cabinet, the first visit, then the talk that closed it */}
        <Row leading={<Icon d={icons.heart} size={19} />} leadingBg={C.tealSoft} leadColor={C.tealInk}
          title="What Recall now knows"
          sub="Asked first — your name, year, sex, language, region & penicillin: the floor no first conversation is safe without. The knees & blood pressure came up in the talk. Only you see this page."
          onClick={onHealth} />
        <Divider />
        <Row leading={<Icon d={icons.meds} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
          title="Your medicine cabinet"
          sub={day1
            ? "Left empty on purpose — each pill goes in from its own bottle later today, so nothing sits here you didn't put here."
            : "Started empty on purpose — you scanned Metformin and Lisinopril from their bottles that first day."}
          onClick={() => onGoTab("meds")} />
        <Divider />
        <Row leading={<Icon d={icons.visits} size={20} />} title="Dr. Patel · July 24"
          sub="Your first visit — read off the fridge card during the talk."
          onClick={() => onGoTab("visits")} />
        <Divider />
        <Row leading={<Icon d={icons.mic} size={19} />} leadingBg={C.purpleSoft} leadColor={C.purpleInk}
          title="Your first short talk" right={null}
          sub={day1
            ? "The call's last minutes — it became today's entry, still open on Today. Most mornings take a couple of minutes; talk as long as you like."
            : "The call's last minutes became your first entry — a couple of minutes most mornings ever since, and you picked the rhythm."} />
      </Card>

      <SectionLabel>Your people — each by your yes</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.orangeSoft} leadColor={C.orange}
          title="Sarah — family"
          sub="Invited the evening before; your yes on the call let her in. She sees your visits — nothing else."
          onClick={() => onMember("sarah")} />
        <Divider />
        <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
          title="Denise — your caregiver" sub="The caregiver baseline — every switch on her page, yours to turn off."
          onClick={() => onMember("denise")} />
      </Card>

      <SectionLabel>The moment that decided it</SectionLabel>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <RecallOrb size={26} mood="calm" />
            <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.45, paddingTop: 2 }}>
              “And who should see what, Amma?”
            </div>
          </div>
          <div style={{ background: C.bg, borderRadius: 12, padding: "10px 13px",
            fontSize: 15.5, fontWeight: 600, lineHeight: 1.45 }}>
            “Sarah can see my visits. Not my journal — that's mine.”
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, marginTop: 10 }}>
          Kept exactly so. It's a switch on Sarah's page, not a promise — change it any time.
        </div>
        {/* the answer she gave became a standing page — the moment is
            the onboarding's privacy story, the page is where it lives */}
        <Divider />
        <Row leading={<Icon d={icons.lock} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
          title="Who can see what"
          sub="Your answer, kept as the standing rules — every wall, in plain words."
          onClick={onPrivacy} pad="8px 2px" />
      </Card>

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px",
        textAlign: "center" }}>
        Recall never learns about you silently — setup included. Anything added since says
        who added it, right where it lives.
        {day1 && " The Today card retires tonight — this story keeps its address under Your circle."}
      </div>
    </Page>
  );
};

/* Sarah's receipt — the same morning from the other kitchen. One truth,
   two seats: the SAME call, the SAME consent quote her mother's page
   keeps, plus the part only Sarah lived — the evening before: her
   worry, her seat, one text. The page's whole argument is what her
   ten minutes did NOT do: nothing she wrote entered Amma's record;
   the call did the making, with Amma on the line. */
const SarahStoryPage = ({ period, onBack, onRoom }) => {
  const day1 = period === "day1";
  return (
    <Page title="How this began" onBack={onBack}>
      <Card tone={C.blueSoft}>
        <div style={{ display: "flex", gap: 13 }}>
          <RecallOrb size={44} mood="calm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: C.blueDeep }}>
              One phone call — you, Amma, and Recall
            </div>
            <div style={{ fontSize: 14.5, color: C.blueSub, lineHeight: 1.5, marginTop: 3 }}>
              {day1 ? "This morning, 9:15" : "Tuesday, July 21, 9:15"} · about twenty minutes,
              you on the line from your own kitchen — the same setup as anyone's, asked out loud.
              She talked, you checked the spellings, and everything was read back to her before
              it was kept.
            </div>
          </div>
        </div>
      </Card>

      <SectionLabel>The evening before — your ten minutes</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.chat} size={19} />} leadingBg={C.orangeSoft} leadColor={C.orange}
          title="You wrote down what worried you" right={null} pad="6px 2px"
          sub="“The stairs — her knees. Whether she's eating properly.” Raised on the call in your words — the stairs became the first thing Recall ever asked her about." />
        <Divider />
        <Row leading={<Icon d={icons.person} size={19} />} leadingBg={C.purpleSoft} leadColor={C.purple}
          title="You chose your seat — family" right={null} pad="6px 2px"
          sub="Suggest, never act. You picked it before you ever asked her — and her yes gates everything you send." />
        <Divider />
        <Row leading={<Icon d={icons.chat} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
          title="You sent one text" right={null} pad="6px 2px"
          sub={`A time and a promise: her own phone, nothing to install, ${day1 ? "you'd be" : "you were"} on the line.`} />
      </Card>

      <SectionLabel>The moment that decided it</SectionLabel>
      <Card>
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <RecallOrb size={26} mood="calm" />
          <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, paddingTop: 2 }}>
            “And who should see what, Amma?”
          </div>
        </div>
        <div style={{ background: C.bg, borderRadius: 11, padding: "11px 13px", marginTop: 11,
          fontSize: 16, fontWeight: 650, lineHeight: 1.5 }}>
          “Sarah can see my visits. Not my journal — that's mine.”
        </div>
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, marginTop: 10 }}>
          Kept exactly so — the switches on your side moved the moment she said it. Only her
          yes ever widens them; hearing it said is how you know the room tells the truth.
        </div>
      </Card>

      <SectionLabel>What it opened for you</SectionLabel>
      <Card onClick={onRoom}>
        <Row leading={<Icon d={icons.person} size={19} />} leadingBg={C.greenSoft} leadColor={C.green}
          title="Amma's room" sub="What she shares and what you send — it opened that morning" pad="4px 2px" />
      </Card>

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "18px 10px 8px",
        textAlign: "center" }}>
        Nothing you wrote that evening entered her record. She said it herself, on the call —
        that's why it's hers.
      </div>
    </Page>
  );
};

/* the circle sheet, r2 — purely people. Every row is a person; every
   person opens the page about THAT relationship (you included).       */
/* ---------------- About your health — the profile page ------------- */
/* The manage shelf for context. Not an Apple-Health form: nothing here
   was typed — the setup call was the form, and each fact carries where
   it came from and WHERE IT WORKS. Facts open in place (accordion, no
   overlay to fall out of), remove waits with an Undo, and the page
   states its two boundaries out loud: the circle never sees it, and it
   writes nothing — it only shapes what gets asked.                    */
const HealthProfilePage = ({ onBack, ui, diabetesAdded, removed, onRemove, onUndo, profileNeed }) => {
  const [open, setOpen] = useState(null);
  const factRow = (f, i, removable = true) => {
    if (removed[f.id]) return (
      <div key={f.id}>
        {i > 0 && <Divider />}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: C.ter, textDecoration: "line-through" }}>{f.t}</div>
            <div style={{ fontSize: 13.5, color: C.ter, marginTop: 2 }}>Removed — check-ins stop accounting for it</div>
          </div>
          <UndoPill onClick={() => onUndo(f.id)} />
        </div>
      </div>
    );
    const on = open === f.id;
    return (
      <div key={f.id}>
        {i > 0 && <Divider />}
        <Row leading={<Icon d={icons[f.icon]} size={19} />} leadingBg={C.tealSoft} leadColor={C.tealInk}
          title={f.t} sub={f.s} onClick={() => setOpen(on ? null : f.id)}
          right={<span style={{ display: "flex", color: C.ter, transform: on ? "rotate(-90deg)" : "rotate(90deg)",
            transition: "transform .2s" }}><Icon d={icons.chevron} size={15} sw={2.2} /></span>} />
        {on && (
          <div style={{ padding: "0 2px 13px 54px" }}>
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
              <b style={{ color: C.ink }}>How it's used</b> · {f.works}
            </div>
            <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, marginTop: 7 }}>{f.src}</div>
            {f.keep ? (
              <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.45, marginTop: 7 }}>{f.keep}</div>
            ) : removable && (
              <button className="tap" onClick={() => { setOpen(null); onRemove(f); }}
                style={{ border: "none", background: "none", cursor: "pointer", fontFamily: FONT,
                  color: C.blue, fontSize: 14.5, fontWeight: 600, padding: "9px 0 0", minHeight: 44,
                  display: "inline-flex", alignItems: "center" }}>
                Remove — Recall stops using it
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  const ongoing = [...PROFILE_FACTS.ongoing, ...(diabetesAdded ? [PROFILE_FACTS.diabetes] : [])];
  return (
    <Page title="About your health" onBack={onBack}>
      <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.55, padding: "2px 4px 10px" }}>
        The facts that shape how Recall asks — a knee is a different question at 78 than at 40.
        Only you see this page. These shape your check-ins and ride your visit briefs — your
        circle never sees them, and they write nothing in your journal.
      </div>

      {/* the profile grows by request, never silently — same grammar as
          everything: heard at a visit, waiting on her yes */}
      {profileNeed && (
        <>
          <SectionLabel>Waiting on you</SectionLabel>
          <Card tone={C.orangeSoft} style={{ marginBottom: 4 }} onClick={() => ui.openRequest(profileNeed)}>
            <Row leading={<Icon d={icons.heart} size={19} />} leadingBg="#fff" leadColor={C.orange}
              title={profileNeed.title} sub={profileNeed.sub} pad="4px 2px" />
          </Card>
        </>
      )}

      {/* the section labels carry the taxonomy: what was ASKED at setup
          (the safety floor) vs what only life can add */}
      <SectionLabel>The basics · asked at your setup call</SectionLabel>
      <Card>{PROFILE_FACTS.basics.map((f, i) => factRow(f, i, false))}</Card>

      <SectionLabel>Ongoing · grows only as life names it</SectionLabel>
      <Card>{ongoing.map((f, i) => factRow(f, i))}</Card>

      <SectionLabel>Allergies · asked at setup — never left to chance</SectionLabel>
      <Card>{PROFILE_FACTS.allergies.map((f, i) => factRow(f, i))}</Card>

      {/* one truth, doors not copies — the cabinet owns the meds */}
      <SectionLabel>Also part of the picture</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.meds} size={19} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
          title="Your medications" sub="Kept in your cabinet — the profile borrows them, the cabinet owns them"
          onClick={() => ui.goTab("meds")} />
      </Card>

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px" }}>
        The setup call asked only for what a first conversation can't be safe without — your name,
        year, sex, language, region and allergies — and nothing is collected for its own sake.
        The rest arrives only as life names it: a doctor says it, or you do; Recall proposes;
        you decide. Everything here was said out loud and read back before it was kept. Nothing
        is ever guessed. To add or change something, just say it in any check-in.
      </div>
    </Page>
  );
};

/* ------------- who can see what — the trust page -------------------- */
/* Security, for a 78-year-old, is not the word "encrypted" — it's a
   short list of walls in her own words, each one checkable against a
   surface she can open. The page states only what the product visibly
   enacts: the share sheet IS a checklist (transcript & recording stay
   off until confirmed), the care update IS curated line by line, and
   Sarah's window shows exactly the crossed list. Placed where the
   wondering happens: beside "what Recall knows" on her page, and on
   the setup receipt where she first answered the question.            */
const PRIVACY_WALLS = [
  { icon: "journal", t: "Your journal & check-ins",
    s: "Only you. Sharing one piece is a choice you make each time — never a switch left on." },
  { icon: "heart", t: "About your health",
    s: "Only you. Ever. It shapes questions and rides briefs, but no one in your circle can open it — no setting exists that would let them." },
  { icon: "visits", t: "Visit briefs & recordings",
    s: "You, and whoever you hand them to. Every share is a checklist first — the transcript and the recording stay back unless you say so, each time." },
  { icon: "person", t: "Sarah & your circle",
    s: "They see what you approved and what you shared — that list, nothing more. Asking you something shows them nothing." },
  { icon: "lock", t: "Everyone else",
    s: "No one. Your words are never sold, never advertising, never anyone's training material — they're yours the way a diary is." },
];

const PrivacyPage = ({ onBack }) => (
  <Page title="Who can see what" onBack={onBack}>
    <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.55, padding: "2px 4px 10px" }}>
      Recall holds the most private kind of thing — your health, in your own voice. So the
      walls are few and plain, and none of them move on their own:
    </div>

    <Card>
      {PRIVACY_WALLS.map((w, i) => (
        <div key={w.t}>
          {i > 0 && <Divider />}
          <Row leading={<Icon d={icons[w.icon]} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title={w.t} sub={w.s} right={null} />
        </div>
      ))}
    </Card>

    <SectionLabel>What has actually crossed</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.check} size={19} />} leadingBg={C.greenSoft} leadColor={C.green}
        title="Your answers to their asks" right={null}
        sub="Each yes and no you give travels to the person who asked — the answer, never more." />
      <Divider />
      <Row leading={<Icon d={icons.share} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
        title="The things you shared" right={null}
        sub="Dr. Chen's visit summary · “July, in short” — each went once, exactly as you checked it." />
      <Divider />
      <Row leading={<Icon d={icons.chat} size={19} />} leadingBg={C.purpleSoft} leadColor={C.purple}
        title="Your hellos" right={null}
        sub="One line, your words, sent only when you chose to send one." />
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 2px 2px" }}>
        That's the whole list. A share never opens a door — it hands over one thing, once.
      </div>
    </Card>

    <SectionLabel>The locks themselves</SectionLabel>
    <Card>
      <div style={{ fontSize: 15, lineHeight: 1.55, color: C.ink }}>
        Your words live locked on this phone the way a banking app is locked, and your phone's
        own lock guards the door. Lose the phone and nothing opens. Sarah could never read your
        journal from hers — there is nothing on her phone to read.
      </div>
    </Card>

    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px" }}>
      These rules are your answer to one question from your setup call — “Who should see what,
      Amma?” They've stood ever since, and they bend only when you say so: every switch lives
      on a page you can open, and “no” is always a full answer.
    </div>
  </Page>
);

const CircleSheet = ({ onClose, device, thataNewsCount, invited, sarahRemoved,
  onYou, onRoom, onMember, onInvite, onTour, onSetupStory, onStartJournal, showToast }) => (
  <Sheet title="Your circle" onClose={onClose}>
    {device === "amma" ? (
      <>
        <Card onClick={onYou}>
          <Row leading={<Icon d={icons.person} size={21} />} title="Amma" sub="You · profile & settings" pad="4px 2px" />
        </Card>

        <SectionLabel>You're helping</SectionLabel>
        <Card onClick={onRoom}>
          <Row leading={<Icon d={icons.person} size={21} />} leadingBg={C.tealSoft} leadColor={C.teal}
            title="Thatha" sub="You're his caregiver" pad="4px 2px"
            right={<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {thataNewsCount > 0 && <NewChip n={thataNewsCount} />}
              <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
            </div>} />
        </Card>

        <SectionLabel>Helping you</SectionLabel>
        <Card>
          <Row leading={<Icon d={icons.person} size={21} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
            title="Denise · Caregiver" sub="Can add and fix things. You can undo anything."
            onClick={() => onMember("denise")} pad="8px 2px" />
          {!sarahRemoved && (
            <>
              <Divider />
              <Row leading={<Icon d={icons.person} size={21} />} leadingBg={C.orangeSoft} leadColor={C.orange}
                title="Sarah · Family" sub="Can suggest. You decide."
                onClick={() => onMember("sarah")} pad="8px 2px" />
            </>
          )}
          {invited && (
            <>
              <Divider />
              <Row leading={<Icon d={icons.person} size={21} />} leadingBg={C.track} leadColor={C.ter}
                title="Ravi" sub="Invited — waiting" right={null} pad="8px 2px" />
            </>
          )}
        </Card>

        <div style={{ marginTop: 14 }}>
          <BigButton tone="tinted" icon={<Icon d={icons.plus} size={19} sw={2.2} />} onClick={onInvite}>
            Invite someone
          </BigButton>
        </div>
        <div style={{ height: 10 }} />
        <Card onClick={onTour}>
          <Row leading={<Icon d={icons.speaker} size={20} />} title="Show me around"
            sub="A gentle tour of the five tabs — with read-aloud." pad="4px 2px" />
        </Card>
        <div style={{ height: 10 }} />
        {/* the setup story's permanent address — it's about people and
            what they see, so it lives where the people live */}
        <Card onClick={onSetupStory}>
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title="How Recall began" sub="Your setup call · July 21" pad="4px 2px" />
        </Card>
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
          The bell is about your record. People you help live here, behind your avatar.
        </div>
      </>
    ) : (
      <>
        <Card onClick={onStartJournal}>
          <Row leading={<Icon d={icons.person} size={21} />} title="Sarah"
            sub="You · no journal yet — tap to start your own" pad="4px 2px" />
        </Card>
        <SectionLabel>You're helping</SectionLabel>
        <Card onClick={onRoom}>
          <Row leading={<Icon d={icons.person} size={21} />} title="Amma" sub="You're her family member" pad="4px 2px"
            right={<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <NewChip n={2} /><Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
            </div>} />
        </Card>
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
          Your people are your home on this phone — this sheet and the People screen are the same place.
        </div>
      </>
    )}
  </Sheet>
);

/* You → profile & settings. "You are a member of your own circle" —
   this page is your relationship with Recall. Commitments moved here
   from the v9 sheet (they're settings, not people).                   */
const YouPage = ({ onBack, onMember, onTour, onHealth, onPrivacy, sarahRemoved, showToast, appearance }) => {
  const [uiLang, setUiLang] = useState("en");
  const [prefs, setPrefs] = useState({ requests: true, reminders: true, insight: false });
  const flip = (k, label) => setPrefs((p) => {
    const v = !p[k];
    showToast(v ? `${label} — on` : `${label} — off`, 1800);
    return { ...p, [k]: v };
  });
  return (
    <Page title="You" onBack={onBack}>
      <Card>
        <Row leading={<Icon d={icons.person} size={21} />} title="Amma" sub="Your Recall" right={null} pad="4px 2px" />
      </Card>

      <SectionLabel>What Recall listens for</SectionLabel>
      <Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMMITMENTS.map((c) => (
            <span key={c} style={{ padding: "8px 14px", borderRadius: 99, fontSize: 14.5, fontWeight: 600,
              background: C.blueSoft, color: C.blue }}>{c}</span>
          ))}
        </div>
        <div style={{ fontSize: 14, color: C.sub, marginTop: 10, lineHeight: 1.45 }}>
          The things a doctor would ask about — Recall listens for them while you just talk.
          Tap one to quiet it any time.
        </div>
      </Card>

      {/* listens-for above, KNOWS here — topics vs facts, side by side.
          The facts door: what shapes the questions, only hers to see */}
      <SectionLabel>What Recall knows</SectionLabel>
      <Card onClick={onHealth}>
        <Row leading={<Icon d={icons.heart} size={20} />} leadingBg={C.tealSoft} leadColor={C.tealInk}
          title="About your health"
          sub="Your age, sex, language & region · the knees · blood pressure · penicillin — it shapes the questions"
          pad="4px 2px" />
      </Card>

      {/* the trust page's front door — beside what Recall knows sits who
          can see it. The two questions arrive together in real life. */}
      <SectionLabel>Who can see what</SectionLabel>
      <Card onClick={onPrivacy}>
        <Row leading={<Icon d={icons.lock} size={20} />} leadingBg={C.blueSoft} leadColor={C.blue}
          title="Your walls, in plain words"
          sub="Journal and profile: only you. Sharing is a checklist, never a switch. Nothing crosses without you."
          pad="4px 2px" />
      </Card>

      {/* appearance — seeing comfortably is a prerequisite for everything
          else on this page. Whole-UI scaling (not text-only) so buttons
          grow with the words they label; dark is a palette, not a filter. */}
      {appearance && (
        <>
          <SectionLabel>Appearance</SectionLabel>
          <Card>
            <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 3 }}>Text size</div>
            <div style={{ fontSize: 13.5, color: C.sub, marginBottom: 10, lineHeight: 1.45 }}>
              Everything grows together — buttons stay easy to hit.
            </div>
            <Seg options={Object.keys(TEXT_SIZES)} value={appearance.textSize}
              onChange={(v) => { appearance.setTextSize(v); showToast(`Text size — ${v.toLowerCase()} ✓`, 1800); }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14,
              paddingTop: 13, borderTop: `0.5px solid ${C.line}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>Dark mode</div>
                <div style={{ fontSize: 13.5, color: C.sub }}>Easier on the eyes in the evening</div>
              </div>
              <Toggle on={appearance.dark}
                onClick={() => { appearance.setDark(!appearance.dark);
                  showToast(appearance.dark ? "Light mode ✓" : "Dark mode ✓", 1800); }} />
            </div>
          </Card>
        </>
      )}

      <SectionLabel>Settings</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.globe} size={20} />} title="Language"
          sub="Summaries translate · transcripts keep their spoken language"
          right={<span style={{ fontSize: 14.5, fontWeight: 600, color: C.sub, flexShrink: 0 }}>
            {uiLang === "en" ? "English first" : "Français d'abord"}
          </span>}
          onClick={() => { const l = uiLang === "en" ? "fr" : "en"; setUiLang(l);
            showToast(l === "fr" ? "Les résumés s'afficheront en français d'abord" : "Summaries will show in English first", 2400); }} />
        <Divider />
        <Row leading={<Icon d={icons.mic} size={20} />} title="Voice plan"
          sub="Chat is unlimited — minutes are a format, not a paywall"
          right={<span style={{ fontSize: 14.5, fontWeight: 600, color: C.sub, flexShrink: 0 }}>11 of 30 min</span>} />
      </Card>

      <SectionLabel>Notifications</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.bell} size={20} />} title="Requests & approvals"
          right={<Toggle on={prefs.requests} onClick={() => flip("requests", "Requests & approvals")} />} />
        <Divider />
        <Row leading={<Icon d={icons.meds} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk} title="Dose reminders"
          right={<Toggle on={prefs.reminders} onClick={() => flip("reminders", "Dose reminders")} />} />
        <Divider />
        <Row leading={<Icon d={icons.spark} size={20} />} leadingBg={C.purpleSoft} leadColor={C.purple} title="Insight day"
          right={<Toggle on={prefs.insight} onClick={() => flip("insight", "Insight day")} />} />
      </Card>

      <SectionLabel>Sharing at a glance</SectionLabel>
      <Card>
        <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
          title="Denise sees care basics" sub="The caregiver baseline — meds, doses, logistics"
          onClick={() => onMember("denise")} />
        {!sarahRemoved && (
          <>
            <Divider />
            <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.orangeSoft} leadColor={C.orange}
              title="Sarah sees upcoming visits" sub="Schedules only — never your words"
              onClick={() => onMember("sarah")} />
          </>
        )}
      </Card>
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0" }}>
        The switches live on each person's page — one place where "what can they see" is always true.
      </div>

      <div style={{ marginTop: 14 }}>
        <Card onClick={onTour}>
          <Row leading={<Icon d={icons.speaker} size={20} />} title="Show me around" pad="4px 2px" />
        </Card>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "14px 6px 0" }}>
        Everything starts private to you.
      </div>
    </Page>
  );
};

/* a member page — the control center for one arrow. Fact-toggles only:
   schedules and lists, never the owner's words (those share each time). */
const MemberPage = ({ person, facts, setFact, onBack, onSendUpdate, onChangeRole, onRemove, showToast }) => {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const tint = person.color === "orange"
    ? { bg: C.orangeSoft, ink: C.orange }
    : { bg: C.greenSoft, ink: C.greenInk };
  return (
    <Page title={person.name} onBack={onBack}>
      <Card>
        <Row leading={<Icon d={icons.person} size={21} />} leadingBg={tint.bg} leadColor={tint.ink}
          title={`${person.name} · ${person.role}`} sub={person.roleLine} right={null} pad="4px 2px" />
        {/* provenance is meaning, not decoration — sub ink, never ter:
            ter is reserved for captions whose loss costs nothing */}
        {person.since && (
          <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, padding: "8px 2px 2px" }}>
            {person.since}
          </div>
        )}
      </Card>

      <SectionLabel>What {person.name} sees on her own</SectionLabel>
      <Card>
        {person.facts.map((f, i) => (
          <div key={f.id}>
            {i > 0 && <FullDivider />}
            <Row title={f.t} right={<Toggle on={facts[f.id]}
              onClick={() => {
                const v = !facts[f.id];
                setFact(f.id, v);
                showToast(v ? `${person.name} now sees this — schedules and lists, never your words`
                  : `Turned off — ${person.name} no longer sees this`, 2600);
              }} />} pad="9px 2px" />
          </div>
        ))}
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 2px 2px" }}>
          {person.factsNote || "Schedules and lists — never your words. Anything you've said, you share each time."}
        </div>
      </Card>

      <div style={{ marginTop: 12 }}>
        <BigButton tone="tinted" icon={<Icon d={icons.share} size={18} />} onClick={onSendUpdate}>
          Send {person.name} an update
        </BigButton>
      </div>

      {(person.lately || []).length > 0 && (
        <>
          <SectionLabel>Lately</SectionLabel>
          <Card>
            {person.lately.map((l, i) => (
              <div key={i}>
                {i > 0 && <Divider />}
                <Row leading={<Icon d={icons[l.icon]} size={19} />}
                  leadingBg={l.good ? C.greenSoft : C.track} leadColor={l.good ? C.greenInk : C.ter}
                  title={l.t} sub={l.s} right={null} />
              </div>
            ))}
          </Card>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <Card>
          <Row leading={<Icon d={icons.person} size={20} />} title={`Change what ${person.name} can do`}
            onClick={onChangeRole} pad="8px 2px" />
          <Divider />
          <Row leading={<Icon d={icons.close} size={18} />} leadingBg={C.redSoft} leadColor={C.red}
            titleColor={C.red} title={`Remove ${person.name}`}
            onClick={() => setConfirmRemove(true)} pad="8px 2px" />
        </Card>
      </div>

      {confirmRemove && (
        <div style={{ marginTop: 12 }}>
          <ConfirmCard cfg={{
            title: `Remove ${person.name} from your circle?`,
            sub: "Sharing stops right away. What already happened stays in your record, stamped.",
            yes: "Remove", no: "Keep her",
          }} onAnswer={(v) => { setConfirmRemove(false); if (v === "yes") onRemove(); }} />
        </div>
      )}

      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0", textAlign: "center" }}>
        {person.foot}
      </div>
    </Page>
  );
};

/* role change — the same two plain-language cards as inviting.
   Owner-only; supporters can't request elevation in-app.             */
const ROLE_CARDS = [
  { id: "family", label: "Family", body: "They can suggest. You decide — nothing changes without your yes." },
  { id: "caregiver", label: "Caregiver", body: "They can add and fix things. You see everything and can undo anything. They can also suggest." },
];

const RoleCard = ({ role, selected, current, onClick }) => (
  <button className="tap" onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left",
    border: "none", borderRadius: 14, background: C.card, padding: "14px 15px", cursor: "pointer",
    fontFamily: FONT, marginBottom: 9,
    boxShadow: selected ? `0 0 0 2px ${C.blue}` : "0 0 0 0.5px rgba(0,0,0,.06)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.blue }}>
        {role.label}
      </span>
      {current && <span style={{ fontSize: 12.5, fontWeight: 700, color: C.greenInk, background: C.greenSoft,
        borderRadius: 99, padding: "4px 10px" }}>Current</span>}
    </div>
    <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 5, color: C.ink, fontWeight: 500 }}>{role.body}</div>
  </button>
);

const RoleChangePage = ({ person, onBack, showToast }) => (
  <Page title={`${person.name}'s role`} onBack={onBack}>
    <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, padding: "6px 4px 14px" }}>
      Only you can change this. {person.name} is told in plain words the moment it changes.
    </div>
    {ROLE_CARDS.map((r) => (
      <RoleCard key={r.id} role={r} current={r.label === person.role}
        onClick={() => {
          if (r.label === person.role) showToast(`${person.name} is already ${r.label.toLowerCase()} — nothing changes`, 2400);
          else showToast(`${person.name} would become ${r.label.toLowerCase()} and be told — kept as-is in this preview`, 3200);
        }} />
    ))}
  </Page>
);

const InvitePage = ({ onBack, onSent, invited }) => {
  const [role, setRole] = useState(null);
  return (
    <Page title="Invite" onBack={onBack}>
      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.015em", padding: "6px 4px 14px", lineHeight: 1.3 }}>
        Who will this person be for you?
      </div>
      {ROLE_CARDS.map((r) => (
        <RoleCard key={r.id} role={r} selected={role === r.id} onClick={() => setRole(r.id)} />
      ))}
      <div style={{ marginTop: 10 }}>
        <BigButton tone={role ? "blue" : "tinted"} onClick={() => role && onSent()}>Send the invite</BigButton>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
        The invite tells them exactly what they'll be able to do.
        <br />You can change or remove this anytime.
      </div>
      {invited && (
        <>
          <SectionLabel>Waiting</SectionLabel>
          <Card>
            <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.track} leadColor={C.ter}
              title="Ravi" sub="Invited — waiting" right={null} pad="4px 2px" />
          </Card>
        </>
      )}
    </Page>
  );
};

/* ------------------- rooms: the guest shell ------------------------- */
/* A room is a place you VISIT. The exit names where it lands and is
   pinned on every screen; subpage Back stacks beneath it.             */
const RoomShell = ({ owner, roleLine, title, onBack, onExit, children, fab }) => (
  <div className="pageIn" style={{ position: "absolute", inset: 0, zIndex: 25, background: C.bg,
    display: "flex", flexDirection: "column" }}>
    <div style={{ flexShrink: 0, background: C.card, boxShadow: "0 0.5px 0 rgba(0,0,0,.08)",
      padding: title ? "10px 16px 9px" : "12px 16px 13px" }}>
      <button className="tap" onClick={onExit} style={{ border: "none", background: "none", color: C.blue,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: FONT,
        fontSize: 15.5, fontWeight: 700, padding: "2px 2px", margin: "0 -2px" }}>
        <Icon d={icons.back} size={18} sw={2.6} />Your Recall
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: title ? 7 : 10 }}>
        <div style={{ width: title ? 28 : 38, height: title ? 28 : 38, borderRadius: 99, background: owner.color,
          color: "#fff", fontSize: title ? 13 : 16.5, fontWeight: 700, display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0 }}>
          {owner.letter}
        </div>
        <div style={{ fontSize: title ? 16 : 21, fontWeight: 700, letterSpacing: "-.02em" }}>{owner.name}'s Recall</div>
      </div>
      {!title && roleLine && (
        <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, marginTop: 7 }}>{roleLine}</div>
      )}
    </div>
    {title && (
      <div style={{ display: "flex", alignItems: "center", padding: "8px 10px 4px", flexShrink: 0 }}>
        <button className="tap" onClick={onBack} aria-label="Back"
          style={{ border: "none", background: "none", color: C.blue, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 1, fontFamily: FONT,
            fontSize: 17, fontWeight: 600, padding: "8px 6px" }}>
          <Icon d={icons.back} size={22} sw={2.4} />Back
        </button>
        <div style={{ fontSize: 17.5, fontWeight: 700, flex: 1, textAlign: "center", paddingRight: 84 }}>{title}</div>
      </div>
    )}
    <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 16px 96px" }}>
      {children}
    </div>
    {fab}
  </div>
);

const THATHA_OWNER = { name: "Thatha", letter: "T", color: C.teal };
const AMMA_OWNER = { name: "Amma", letter: "A", color: C.blue };

/* the caregiver room hub — everything daily lives right here:
   dose check-offs, the note card, new-for-you. Depth is for management. */
const RoomHub = ({ period, news, thataTaken, toggleThataDose, noteAdded, ui, onExit,
  fabOpen, setFabOpen, onFab, showToast }) => (
  <RoomShell owner={THATHA_OWNER} onExit={onExit}
    roleLine="You're his caregiver — you can add and fix things; he can undo."
    fab={<Fab tab="room" open={fabOpen} setOpen={setFabOpen} bottom={24} onAction={onFab} />}>
    {news.length > 0 && (
      <>
        <SectionLabel>New for you</SectionLabel>
        <Card>
          {news.map((n, i) => (
            <div key={i}>
              {i > 0 && <Divider />}
              <Row leading={<Icon d={icons[n.icon]} size={19} />} leadingBg={C.track} leadColor={C.ter}
                title={n.t} sub={n.s} right={null} />
            </div>
          ))}
        </Card>
      </>
    )}

    <SectionLabel>His day, in your words</SectionLabel>
    <Card>
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-.01em" }}>
        You mentioned he skipped lunch yesterday — how was his appetite today?
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, margin: "7px 0 13px" }}>Observations · about 90 seconds · filed as your note</div>
      <button className="tap" onClick={() => ui.openCheckin("carenote")} style={{ width: "100%", minHeight: 52, borderRadius: 13,
        border: "none", background: C.blue, color: "#fff", fontSize: 16.5, fontWeight: 600,
        cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
        justifyContent: "center", gap: 10 }}>
        <RecallOrb size={24} />Answer about his day
      </button>
    </Card>

    <SectionLabel>This week's notes</SectionLabel>
    <Card>
      {noteAdded && (
        <>
          <Row leading={<Icon d={icons.pencil} size={19} />} title="Today"
            sub="Appetite better · the short walk · the letter question"
            onClick={() => ui.openPage("roomNote", { day: "Today", mark: false,
              body: "Appetite came back — he finished his lunch, and we did the short walk after. He asked about the same letter twice this afternoon, but he laughed about it." })} />
          <Divider />
        </>
      )}
      {THATHA.notes.map((n, i) => (
        <div key={n.id}>
          {i > 0 && <Divider />}
          <Row leading={<Icon d={icons.pencil} size={19} />} title={n.day} sub={n.sub}
            onClick={() => ui.openPage("roomNote", n)} />
        </div>
      ))}
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 2px 2px" }}>
        Your notebook about him — marked "From Amma." Thatha can read every note; his journal stays his.
      </div>
    </Card>

    <SectionLabel>Today</SectionLabel>
    <Card>
      {THATHA.doses.map((d, i) => {
        const on = thataTaken.has(d.id);
        const look = MED_LOOKS[d.name] || { shape: "tablet", color: "white" };
        const col = medColor(look.color);
        return (
          <div key={d.id}>
            {i > 0 && <FullDivider />}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 2px" }}>
              <button className="tap" onClick={() => toggleThataDose(d.id)}
                aria-label={on ? `Mark ${d.name} not taken` : `Mark ${d.name} taken`}
                style={{ width: 32, height: 32, borderRadius: 99, flexShrink: 0, cursor: "pointer",
                  border: on ? "none" : `2px solid ${C.ctrl}`, background: on ? C.green : C.card,
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .25s ease" }}>
                {on && <Icon d={icons.check} size={17} sw={3} />}
              </button>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: col[2],
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                opacity: on ? 0.45 : 1, transition: "opacity .25s" }}>
                <MedShape shape={look.shape} color={col[1]} size={23} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: on ? C.ter : C.ink,
                  textDecoration: on ? "line-through" : "none", textDecorationThickness: 1.5 }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 14, color: C.ter }}>
                  {on ? (d.id === "t-lis" ? "8:05 AM · checked by you" : `Checked by you · ${NOW_TIME}`) : d.when}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 2px 2px" }}>
        Checks are stamped "by Amma" — Thatha sees the same stamp.
      </div>
    </Card>

    <SectionLabel>Needs attention</SectionLabel>
    <Card tone={C.orangeSoft}>
      <Row leading={<Icon d={icons.meds} size={19} />} leadingBg="#fff" leadColor={C.orange}
        titleColor={C.orangeInk} title="Metformin — 4 days left" sub="Refill before Monday"
        right={null} />
      <div style={{ padding: "2px 2px 4px 54px" }}>
        <BigButton small tone="tinted"
          onClick={() => showToast("Reminder set for the pharmacy run ✓", 2400)}>Remind me</BigButton>
      </div>
    </Card>

    <SectionLabel>His care</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.meds} size={20} />} leadingBg={C.greenSoft} leadColor={C.greenInk}
        title="Medications" sub="Cabinet · schedule · refills" onClick={() => ui.openPage("roomMeds")} />
      <Divider />
      <Row leading={<Icon d={icons.visits} size={20} />} title="Visits" sub="Dr. Osei · Aug 12"
        onClick={() => ui.openPage("roomVisit")} />
      <Divider />
      <Row leading={<Icon d={icons.docs} size={20} />} title="Documents" sub="2 filed by you"
        onClick={() => ui.openPage("roomDocs")} />
    </Card>

    <SectionLabel>Shared with you</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.docs} size={19} />} title={THATHA.sharedSummary.title}
        sub="His choice, each time — summaries never share by toggle"
        onClick={() => ui.openPage("roomShared")} />
    </Card>

    <div style={{ marginTop: 12 }}>
      <Card>
        <Row leading={<Icon d={icons.list} size={19} />} leadingBg={C.track} leadColor={C.ter}
          title="Activity" sub="Everything that's happened here, stamped"
          onClick={() => ui.openPage("roomActivity")} />
      </Card>
    </div>

    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0", textAlign: "center" }}>
      Thatha's check-ins and journal stay private to him.
    </div>
  </RoomShell>
);

const RoomMedsPage = ({ onBack, onExit, medAdded, openMed, openAdd }) => {
  const wk = trailingWeek();
  return (
    <RoomShell owner={THATHA_OWNER} title="Medications" onBack={onBack} onExit={onExit}>
      <SectionLabel>His week</SectionLabel>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {THATHA.adherence.map((f, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <DoseRing frac={f} size={32} sw={4} muted={i > 4} />
              <span style={{ fontSize: 13, color: C.sub }}>{i === 6 ? "Today" : wk[i].letter}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 2px 0" }}>
          Thursday missed the evening dose — never judged, just noted.
        </div>
      </Card>

      <SectionLabel>His cabinet</SectionLabel>
      <Card>
        {THATHA.cabinet.map((m, i) => {
          const look = MED_LOOKS[m.name] || { shape: "tablet", color: "white" };
          const col = medColor(look.color);
          return (
            <div key={m.id}>
              {i > 0 && <Divider />}
              <Row leading={<MedShape shape={look.shape} color={col[1]} size={27} />} leadingBg={col[2]}
                title={m.name} sub={m.sub} onClick={() => openMed(m)} />
            </div>
          );
        })}
        {medAdded && (
          <>
            <Divider />
            <Row leading={<MedShape shape="oblong" color={medColor("blue")[1]} size={27} />} leadingBg={medColor("blue")[2]}
              title="Metoprolol 25 mg" sub="Mornings · added by you just now — he can undo"
              onClick={() => openMed({ id: "t-new", name: "Metoprolol 25 mg", sub: "Mornings · added by you just now" })} />
          </>
        )}
      </Card>

      <div style={{ marginTop: 14 }}>
        <BigButton icon={<Icon d={icons.plus} size={19} sw={2.2} />} onClick={openAdd}>Add a medication</BigButton>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "12px 6px 0" }}>
        Every change applies right away — he sees each one and can undo.
      </div>
    </RoomShell>
  );
};

const RoomMedDetailPage = ({ med, changed, onBack, onExit, onChange, showToast }) => {
  const isLis = med.id === "t-lis";
  const history = isLis
    ? (changed ? [{ when: "Just now", t: "Moved to evenings", s: "by you — Thatha can undo" }, ...THATHA.medHistory] : THATHA.medHistory)
    : [{ when: "May 12", t: "Added", s: "from Dr. Osei's letter · he kept it" }];
  return (
    <RoomShell owner={THATHA_OWNER} title="Medication" onBack={onBack} onExit={onExit}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 4px 14px" }}>
        {(() => {
          const look = MED_LOOKS[med.name] || { shape: "oblong", color: "blue" };
          const col = medColor(look.color);
          return (
            <div style={{ width: 56, height: 56, borderRadius: 16, background: col[2],
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MedShape shape={look.shape} color={col[1]} size={36} />
            </div>
          );
        })()}
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.015em" }}>{med.name}</div>
          <div style={{ fontSize: 14.5, color: C.sub, marginTop: 2 }}>
            {isLis && changed ? "1 tablet · evenings" : "1 tablet · mornings"}
          </div>
        </div>
      </div>

      <SectionLabel>History</SectionLabel>
      <Card>
        {history.map((h, i) => (
          <div key={i}>
            {i > 0 && <FullDivider />}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 2px" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, minWidth: 52, paddingTop: 2 }}>{h.when}</span>
              <div>
                <div style={{ fontSize: 15.5, fontWeight: 600 }}>{h.t}</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{h.s}</div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 2px 2px" }}>
          Both voices, one ledger — how it got this way is never a mystery.
        </div>
      </Card>

      <div style={{ marginTop: 14 }}>
        <BigButton onClick={onChange}>Change for Thatha</BigButton>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "8px 6px 0" }}>
        Applies right away — he sees it and can undo.
      </div>
      <button className="tap" onClick={() => showToast("Sent as a suggestion instead — Thatha decides ✓", 2800)}
        style={{ display: "block", margin: "4px auto 0", border: "none", background: "none", color: C.blue,
          fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, padding: "8px 10px" }}>
        Not sure? Send it as a suggestion instead
      </button>
    </RoomShell>
  );
};

const ChangeWhenSheet = ({ onClose, onPick }) => (
  <Sheet title="When should Thatha take it?" onClose={onClose}>
    {["Morning", "Evening", "Morning & evening"].map((o) => (
      <Card key={o} style={{ marginBottom: 9 }} onClick={() => onPick(o)}>
        <Row title={o} pad="6px 2px" />
      </Card>
    ))}
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "6px 6px 0", textAlign: "center" }}>
      Applies right away, stamped "by Amma" — Thatha sees it and can undo.
    </div>
  </Sheet>
);

/* logistics are care; content is his. She can move the appointment and
   prep the papers — the record of what was said belongs to Thatha.     */
const RoomVisitPage = ({ onBack, onExit, onRecord, showToast }) => (
  <RoomShell owner={THATHA_OWNER} title="Visit" onBack={onBack} onExit={onExit}>
    <div style={{ padding: "2px 4px 10px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.015em" }}>{THATHA.visit.title}</div>
      <div style={{ fontSize: 14.5, color: C.sub, marginTop: 3 }}>{THATHA.visit.date}</div>
    </div>

    <SectionLabel>Logistics — you can change these</SectionLabel>
    <Card>
      <Row title="When" right={<span style={{ fontSize: 14.5, color: C.sub, flexShrink: 0 }}>{THATHA.visit.date}</span>} pad="9px 2px" />
      <FullDivider />
      <Row title="Where" right={<span style={{ fontSize: 14.5, color: C.sub, flexShrink: 0 }}>{THATHA.visit.place}</span>} pad="9px 2px" />
      <FullDivider />
      <Row title="Bring" sub={THATHA.visit.bring}
        onClick={() => showToast("Added to the bring list ✓", 2200)} pad="9px 2px" />
    </Card>

    <SectionLabel>At the visit</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.mic} size={19} />} leadingBg={C.redSoft} leadColor={C.red}
        title="Record the visit with him"
        sub={`Files to his record, marked "Recorded by Amma." He can remove it.`}
        onClick={onRecord} />
    </Card>

    <SectionLabel>After the visit</SectionLabel>
    <Card style={{ background: C.track }}>
      <Row leading={<Icon d={icons.lock} size={19} />} leadingBg="#fff" leadColor={C.ter}
        title="Summary & transcript" sub="Only if Thatha shares them — ask him after the visit." right={null} />
    </Card>

    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0", textAlign: "center" }}>
      Changes apply right away — Thatha sees each one and can undo.
    </div>
  </RoomShell>
);

const RoomDocsPage = ({ onBack, onExit, onAdd, showToast }) => (
  <RoomShell owner={THATHA_OWNER} title="Documents" onBack={onBack} onExit={onExit}>
    <Card>
      {THATHA.docs.map((d, i) => {
        const m = d.id === "t-lab"
          ? { icon: "flask", bg: C.purpleSoft, color: C.purpleInk }
          : { icon: "docs", bg: C.blueSoft, color: C.blue };
        return (
          <div key={d.id}>
            {i > 0 && <Divider />}
            <Row leading={<Icon d={icons[m.icon]} size={19} />} leadingBg={m.bg} leadColor={m.color}
              title={d.title} sub={d.sub}
              onClick={() => showToast("Opens full-screen — the same reader as your own documents", 2600)} />
          </div>
        );
      })}
    </Card>
    <div style={{ marginTop: 14 }}>
      <BigButton icon={<Icon d={icons.scan} size={19} />} onClick={onAdd}>Add a document</BigButton>
    </div>
    <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "12px 6px 0" }}>
      Scans file into Thatha's record, stamped "Filed by you" — he can remove any of them.
    </div>
  </RoomShell>
);

const RoomActivityPage = ({ onBack, onExit }) => (
  <RoomShell owner={THATHA_OWNER} title="Activity" onBack={onBack} onExit={onExit}>
    {THATHA.activity.map(([day, items]) => (
      <div key={day}>
        <SectionLabel>{day}</SectionLabel>
        <Card>
          {items.map((it, i) => (
            <div key={i}>
              {i > 0 && <FullDivider />}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 2px" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, minWidth: 42, paddingTop: 2,
                  fontVariantNumeric: "tabular-nums" }}>{it.when}</span>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 600 }}>{it.t}</div>
                  <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{it.s}</div>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    ))}
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
      Everything within your sight, stamped and dated. His check-ins and journal never appear here.
    </div>
  </RoomShell>
);

const RoomNotePage = ({ note, onBack, onExit }) => (
  <RoomShell owner={THATHA_OWNER} title="Care note" onBack={onBack} onExit={onExit}>
    <div style={{ padding: "2px 4px 10px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.015em" }}>{note.day}</div>
      <div style={{ fontSize: 14.5, color: C.sub, marginTop: 3 }}>Your note · marked "From Amma"</div>
    </div>
    <Card>
      <div style={{ fontSize: 16, lineHeight: 1.6 }}>{note.body}</div>
    </Card>
    {note.mark && (
      <Card style={{ marginTop: 10, background: C.track }}>
        <Row leading={<Icon d={icons.person} size={19} />} leadingBg="#fff" leadColor={C.teal}
          title={`Thatha marked this: "I remember it differently"`}
          sub="His mark travels with the note — everywhere it goes, including his brief." right={null} />
      </Card>
    )}
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0" }}>
      Notes are append-only — his to read always, yours to write, nobody's to erase. This one can feed
      his next visit brief as "What Amma has noticed," reviewed before anything goes.
    </div>
  </RoomShell>
);

const SharedReaderBody = ({ data }) => {
  const [lang, setLang] = useState("en");
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "2px 4px 12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.25 }}>{data.title}</div>
          <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4, lineHeight: 1.45 }}>{data.sub}</div>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <Card>
        <div style={{ fontSize: 16, lineHeight: 1.6 }}>{lang === "en" ? data.en : data.fr}</div>
      </Card>
    </>
  );
};

/* share sheet for WORDS — a choice list, not a verdict. Defaults are
   minimal; the transcript is one deliberate tap + one plain confirm.   */
const ShareVisitSheet = ({ onClose, onCurate, showToast }) => {
  const [checks, setChecks] = useState({ summary: true, qa: false, transcript: false, recording: false });
  const [confirming, setConfirming] = useState(null);
  const CONFIRM_COPY = {
    transcript: { title: "Include your exact words?", sub: "The transcript is everything said in the room. It goes to Sarah this once — no toggle ever sends it on its own.", yes: "Include it", no: "Keep it back" },
    recording: { title: "Include the recording?", sub: "Your voices, the whole visit. It goes this once, to Sarah only.", yes: "Include it", no: "Keep it back" },
  };
  const CheckRow = ({ id, title, sub, heavy }) => (
    <div className="tap" onClick={() => {
      if (checks[id]) setChecks((c) => ({ ...c, [id]: false }));
      else if (heavy) setConfirming(id);
      else setChecks((c) => ({ ...c, [id]: true }));
    }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 2px", cursor: "pointer" }}>
      <span style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0,
        border: checks[id] ? "none" : `2px solid ${C.ctrl}`, background: checks[id] ? C.blue : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        {checks[id] && <Icon d={icons.check} size={14} sw={3} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  );
  return (
    <Sheet title="Share this visit" onClose={onClose}>
      <Card style={{ marginBottom: 10 }}>
        <Row leading={<Icon d={icons.person} size={20} />} leadingBg={C.orangeSoft} leadColor={C.orange}
          title="Sarah" sub="Family"
          right={<span style={{ fontSize: 13, fontWeight: 700, color: C.blue, background: C.blueSoft,
            borderRadius: 99, padding: "5px 11px" }}>Chosen</span>} pad="4px 2px" />
      </Card>
      <SectionLabel>What goes with it</SectionLabel>
      <Card>
        <CheckRow id="summary" title="The summary" sub="In English — she reads her language, you keep yours" />
        <FullDivider />
        <CheckRow id="qa" title="Your questions & the answers" />
        <FullDivider />
        <CheckRow id="transcript" title="The transcript" sub="Your exact words from the room" heavy />
        <FullDivider />
        <CheckRow id="recording" title="The recording" heavy />
      </Card>
      {confirming && (
        <div style={{ marginTop: 10 }}>
          <ConfirmCard cfg={CONFIRM_COPY[confirming]} onAnswer={(v) => {
            if (v === "yes") setChecks((c) => ({ ...c, [confirming]: true }));
            setConfirming(null);
          }} />
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <BigButton onClick={() => { onClose(); showToast("Shared with Sarah — exactly what you checked, nothing else ✓", 3200); }}>
          Share with Sarah
        </BigButton>
      </div>
      <button className="tap" onClick={onCurate} style={{ display: "block", margin: "8px auto 0", border: "none",
        background: "none", color: C.blue, fontSize: 14.5, fontWeight: 600, cursor: "pointer",
        fontFamily: FONT, padding: "8px 10px" }}>
        Curate it with Recall instead
      </button>
      <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "6px 6px 0" }}>
        Sarah will see exactly what's checked — nothing else travels.
      </div>
    </Sheet>
  );
};

/* the curation review — where "share this month, skip the mood stuff"
   lands. Sections flip by tap (or by voice); the review IS the receipt. */
/* Sharing an update is three real decisions, in order: WHICH DAYS, WHICH
   PARTS, then SEE EXACTLY WHAT TRAVELS. No bare In/Out pills — every row
   shows the actual words it would send, and the preview is the same card
   Sarah receives (the app's symmetry rule: senders see what receivers see). */
const CurationPage = ({ onBack, onSent, showToast }) => {
  const [secs, setSecs] = useState(CARE_UPDATE.sections.map((s) => ({ ...s })));
  const [range, setRange] = useState("This month");
  const [previewOpen, setPreviewOpen] = useState(false);
  const chosen = secs.filter((s) => s.on);
  const flip = (id) => {
    const s = secs.find((x) => x.id === id);
    showToast(s.on ? `“${s.t}” is out — those words stay with you` : `“${s.t}” is back in`, 2200);
    setSecs((prev) => prev.map((x) => (x.id === id ? { ...x, on: !x.on } : x)));
  };
  return (
    <Page title="Update for Sarah" onBack={onBack}>
      <SectionLabel>Which days</SectionLabel>
      <div style={{ display: "flex", gap: 8 }}>
        {["This week", "This month", "Since her last"].map((r) => {
          const on = range === r;
          return (
            <button key={r} className="tap" onClick={() => setRange(r)}
              style={{ flex: 1, border: "none", borderRadius: 11, padding: "11px 6px", fontSize: 14,
                fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                background: on ? C.blue : C.card, color: on ? "#fff" : C.ink,
                boxShadow: on ? "none" : "0 0 0 0.5px rgba(0,0,0,.08)" }}>
              {r}
            </button>
          );
        })}
      </div>

      <SectionLabel>What travels — read each part</SectionLabel>
      <Card>
        {secs.map((s, i) => (
          <div key={s.id}>
            {i > 0 && <FullDivider />}
            <div className="tap" role="button" onClick={() => flip(s.id)}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 2px", cursor: "pointer" }}>
              <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0, marginTop: 2,
                background: s.on ? C.blue : "transparent", border: s.on ? "none" : `2px solid ${C.line}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{s.t}</div>
                <div style={{ fontSize: 13.5, color: s.on ? C.sub : C.ter, lineHeight: 1.45, marginTop: 2,
                  opacity: s.on ? 1 : 0.7 }}>
                  {s.on ? (s.body || "") : (s.out || "Out — those words stay with you")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "8px 6px 0" }}>
        Includes {CARE_UPDATE.quotes.length} of your own quotes — or just say it in a talk:
        “take the sleep part out.”
      </div>

      <SectionLabel>Exactly what Sarah sees</SectionLabel>
      {!previewOpen ? (
        <BigButton tone="tinted" onClick={() => setPreviewOpen(true)}>
          Preview her card — {chosen.length} part{chosen.length === 1 ? "" : "s"}
        </BigButton>
      ) : (
        <div style={{ border: `1.5px dashed ${C.dash}`, borderRadius: 16, padding: 14, background: C.bg }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ter }}>
            FROM AMMA · {range.toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em", marginTop: 6 }}>
            {CARE_UPDATE.title}
          </div>
          {chosen.map((s) => (
            <div key={s.id} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>{s.t}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 2 }}>{s.body}</div>
            </div>
          ))}
          {CARE_UPDATE.quotes.map((q, i) => (
            <div key={i} style={{ fontSize: 14.5, fontStyle: "italic", lineHeight: 1.5, color: C.ink,
              marginTop: 10, paddingLeft: 10, borderLeft: `3px solid ${C.line}` }}>{q}</div>
          ))}
          <div style={{ fontSize: 12.5, color: C.ter, marginTop: 12 }}>
            Dashed border = not sent yet. This is the whole card — nothing else travels.
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <BigButton onClick={onSent}>Send exactly this to Sarah</BigButton>
      </div>
      <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", padding: "10px 6px 0" }}>
        Nothing sends until you approve it.
      </div>
    </Page>
  );
};

/* ------------------ Sarah's phone: supporter-only ------------------- */
/* No journal of her own, so her people ARE her home (the People page). */
const PeopleHome = ({ ui, showToast, period, newCount = 2 }) => (
  <>
    {/* day 1 only — the mirror of Amma's door: the same morning still
        deserves top billing on the phone that arranged it */}
    {period === "day1" && (
      <>
        <Card onClick={() => ui.openPage("sarahStory")}>
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title="Set up this morning" sub="Her setup, asked out loud — one call, you on the line · read it back" pad="2px 0" />
        </Card>
        <div style={{ height: 12 }} />
      </>
    )}
    <Card>
      <Row leading={<Icon d={icons.person} size={21} />} title="Sarah" sub="You · no journal yet" right={null} pad="6px 2px" />
      <Divider />
      <Row leading={<Icon d={icons.pencil} size={19} />} leadingBg={C.track} leadColor={C.ter}
        title="Start your own journal" sub="Your home would grow a Today — whenever you want one"
        onClick={() => showToast("Recall would set up your own check-ins — no pressure, whenever you like", 3000)} />
    </Card>

    <SectionLabel>You're helping</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.person} size={21} />} title="Amma" sub="You're her family member"
        onClick={() => ui.openPage("famRoom")}
        right={<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NewChip n={newCount} /><Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
        </div>} pad="8px 2px" />
      {/* the origin story's permanent address — it lives with the person
          it's about, mirroring the circle sheet on Amma's phone */}
      {period !== "day1" && (
        <>
          <Divider />
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title="How this began" sub="You set Recall up for her · July 21"
            onClick={() => ui.openPage("sarahStory")} pad="6px 2px" />
        </>
      )}
    </Card>

    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
      Amma's room holds what she shares and what you suggest. Her journal is hers — it never appears here.
    </div>
  </>
);

/* the request card preview — trust through symmetry: the sender sees
   EXACTLY the card the owner will receive, dashed = not sent yet.      */
const RequestPreview = ({ title, sub, quote, effect, yesLabel = "Approve", noLabel = "Not now" }) => (
  <div style={{ border: `1.5px dashed ${C.dash}`, borderRadius: 16, padding: 13, background: C.bg }}>
    <SourceChip type="family" />
    <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.015em", marginTop: 8, lineHeight: 1.3 }}>{title}</div>
    <div style={{ fontSize: 14, color: C.sub, marginTop: 3 }}>{sub}</div>
    <SectionLabel>Why</SectionLabel>
    <Card>
      <div style={{ fontSize: 15, lineHeight: 1.5, fontStyle: "italic" }}>{quote}</div>
      <div style={{ fontSize: 13, color: C.ter, marginTop: 6 }}>— Sarah · your words become the evidence</div>
    </Card>
    <SectionLabel>What happens if you say yes</SectionLabel>
    <Card>
      <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{effect}</div>
    </Card>
    {/* her real decision buttons name their outcomes — the preview must too */}
    <div style={{ display: "flex", gap: 9, marginTop: 12, opacity: 0.55, pointerEvents: "none" }}>
      <div style={{ flex: 1, minHeight: 44, borderRadius: 12, background: C.blue, color: "#fff", fontSize: 15,
        fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px",
        textAlign: "center" }}>{yesLabel}</div>
      <div style={{ flex: 1, minHeight: 44, borderRadius: 12, background: C.track, color: C.ink, fontSize: 15,
        fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px",
        textAlign: "center" }}>{noLabel}</div>
    </div>
  </div>
);

/* Amma's room, from Sarah's side — a window plus a mailbox. Everything
   here mirrors month-1 on her phone: the Osei row wears Sarah's OWN
   pending ask the same way Amma's Osei row wears it — one request,
   two phones, the same small line. No FAB: the room has exactly two
   verbs, and they sit where the reading ends. */
const FamilyRoomPage = ({ sugs, onExit, ui, onAskHello, hello, onHow, fresh = [] }) => {
  const oseiSug = sugs.find((s) => s.id === "osei");
  const eyeSug = sugs.find((s) => s.id === "eye");
  return (
  <RoomShell owner={AMMA_OWNER} onExit={onExit} roleLine="You can suggest; Amma decides.">
    <SectionLabel>New for you</SectionLabel>
    <Card>
      {/* her line back leads — the room's warmest object, her words */}
      {hello && hello !== "asked" && hello !== "passed" && (
        <>
          <Row leading={<Icon d={icons.chat} size={19} />} leadingBg={C.blueSoft} leadColor={C.blue}
            title={`“${hello}”`} sub="From Amma, just now — one line, her words, her choice" right={null} />
          <Divider />
        </>
      )}
      {/* an answer that landed while she was away — the verdict leads,
          because the verdict IS the news. A no reads as an answer here,
          never as a failure: same row, her words, no red anywhere. */}
      {fresh.map((s) => (
        <div key={s.id}>
          <Row leading={<Icon d={s.status === "yes" ? icons.check : icons.chat}
              size={19} sw={s.status === "yes" ? 2.6 : 1.8} />}
            leadingBg={s.status === "yes" ? C.greenSoft : C.track}
            leadColor={s.status === "yes" ? C.green : C.sub}
            title={s.ans} sub={`${s.t} · answered ${(s.ansAt || "").toLowerCase()}`}
            onClick={() => ui.openPage("famSugDetail", s)} />
          <Divider />
        </div>
      ))}
      <Row leading={<Icon d={icons.check} size={19} sw={2.6} />} leadingBg={C.greenSoft} leadColor={C.green}
        title="Amma said yes to the hearing test" sub="Thursday, August 20 — it's on her Visits" right={null} />
    </Card>

    <SectionLabel>Shared with you</SectionLabel>
    <Card>
      {SARAH_SHARED.map((s, i) => (
        <div key={s.id}>
          {i > 0 && <Divider />}
          <Row leading={<Icon d={icons[s.icon]} size={19} />}
            leadingBg={s.kind === "update" ? C.purpleSoft : C.blueSoft}
            leadColor={s.kind === "update" ? C.purple : C.blue}
            title={s.t} sub={s.s}
            onClick={() => ui.openPage(s.kind === "update" ? "famUpdate" : "famSummary")} />
        </div>
      ))}
      <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "10px 2px 2px" }}>
        Amma's journal is private to her. When she shares something, it lands here.
      </div>
    </Card>

    <SectionLabel>Upcoming · Amma shares these</SectionLabel>
    <Card>
      <Row leading={<Icon d={icons.visits} size={19} />} title="Hearing test · Dr. Fortin"
        sub="Thursday, August 20" right={null} />
      <Divider />
      {/* the window tells the truth about her decision: the same row that
          carried the pending ask now carries its outcome */}
      <Row leading={<Icon d={icons.visits} size={19} />} title="Dr. Osei · Eyes"
        sub={oseiSug && oseiSug.status === "yes" ? "Friday, August 28 · moved, as you asked" : "Friday, August 21"}
        right={null} />
      {oseiSug && oseiSug.status === "no" && (
        <RowNotice text="She kept August 21 — see what she said"
          onClick={() => ui.openPage("famSugDetail", oseiSug)}
          style={{ margin: "-8px 0 2px 50px" }} />
      )}
      {eyeSug && eyeSug.status === "yes" && (
        <>
          <Divider />
          <Row leading={<Icon d={icons.visits} size={19} />} title="Eye exam · Dr. Lam"
            sub="Thursday, September 3 · she added it" right={null} />
        </>
      )}
      {oseiSug && oseiSug.status === "wait" && (
        <RowNotice text="You suggested August 28 — waiting · view"
          onClick={() => ui.openPage("famSugDetail", oseiSug)}
          style={{ margin: "-8px 0 2px 50px" }} />
      )}
    </Card>

    <SectionLabel>Your suggestions</SectionLabel>
    <Card>
      {sugs.map((s, i) => (
        <div key={s.id}>
          {i > 0 && <FullDivider />}
          <Row title={s.t} sub={s.s} onClick={() => ui.openPage("famSugDetail", s)}
            right={<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <StatusChip status={s.status} /><Icon d={icons.chevron} size={15} color={C.ter} sw={2.2} />
            </div>} pad="9px 2px" />
        </div>
      ))}
    </Card>

    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 9 }}>
      <BigButton icon={<Icon d={icons.plus} size={19} sw={2.2} />} onClick={() => ui.openPage("famSuggest")}>
        Suggest something
      </BigButton>
      {/* one hello a day, embodied: once asked, the button becomes its
          own quiet status — no double-knocking, no nudge machinery */}
      {hello == null ? (
        <BigButton tone="tinted" icon={<Icon d={icons.chat} size={18} />} onClick={onAskHello}>
          Ask how she's doing
        </BigButton>
      ) : (
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, textAlign: "center",
          padding: "10px 8px 2px" }}>
          {hello === "asked" || hello === "passed"
            ? "Asked today — it waits quietly in her Updates. No nudges."
            : "She answered today — one hello a day is the whole idea."}
        </div>
      )}
    </div>

    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0", textAlign: "center" }}>
      Suggestions close their loop — Waiting, Yes, or "Not this time." Never silence.
    </div>
    <div className="tap" onClick={onHow}
      style={{ textAlign: "center", padding: "12px 0 4px", cursor: "pointer" }}>
      <span style={{ fontSize: 14.5, fontWeight: 600, color: C.blue }}>How this works</span>
    </div>
  </RoomShell>
  );
};

/* the five things a family member actually sends — enumerated from the
   world, not the schema. "Ask for an update" left this list: it's the
   room's own second verb (the hello), not a suggestion kind — one idea,
   one door. "Something you noticed" is the family observation: it can
   never write into her record, so it arrives as an ask like everything
   else — her yes keeps it BESIDE her day, signed, never inside the
   journal. (The caregiver's version files immediately and undoable —
   same verb, different arrival, decided by role.) */
const SUGGEST_KINDS = [
  { id: "visit", t: "A visit worth making", s: "An appointment idea — she decides" },
  { id: "question", t: "A question for her next visit", s: "Rides the brief she takes in" },
  { id: "noticed", t: "Something you noticed", s: "Kept beside her day, signed — if she says yes" },
  { id: "doc", t: "A document you have", s: "Files only when she says yes" },
  { id: "med", t: "A medication change", s: "She approves before anything moves" },
];

/* one FORM per kind — tapping "a medication change" must never compose
   a hearing visit. Fields are real inputs with chip shortcuts (form,
   not voice, on purpose: the supporter is structuring an ask, not
   journaling health — and modality follows the person: Sarah types,
   Amma-as-caregiver talks). The WHY is the one required field — her
   words become the evidence Amma reads, so it can't be canned. Every
   dynamic string the sender types lands verbatim in the preview: the
   sender sees exactly what the receiver decides on. */
const SUGGEST_FORMS = {
  visit: {
    fields: [
      { id: "what", label: "What kind of visit", chips: ["A hearing check", "An eye exam", "The dentist"], ph: "Type it, or tap one" },
      { id: "when", label: "Around when", chips: ["Soon", "In October", "After the holidays"], ph: "A season, not a date — nothing is booked" },
    ],
    whyPh: "You've been turning the TV up, Amma — worth a listen test before winter.",
    title: (f) => `Sarah suggests ${(f.what || "a visit").toLowerCase()}`,
    sub: (f) => `${f.what || "A visit"} · ${(f.when || "whenever suits").toLowerCase()}`,
    effect: "Saying yes adds it to your Visits as a plan — no date is booked without you. A brief starts building before you go.",
    yes: "Add to my Visits", no: "Not this time",
    waits: "It waits in her Visits list as a pending plan, in date order — not a pop-up.",
    where: "Waiting in her Visits list as a pending plan, in date order — she opens it when she's ready.",
    sentT: (f) => f.what || "A visit idea",
    ansYes: (f) => `Amma added it to her Visits — ${(f.what || "the visit").toLowerCase()}, ${(f.when || "whenever suits").toLowerCase()}.`,
  },
  question: {
    fields: [
      { id: "q", label: "The question", chips: ["The ankle swelling — worth a look?", "Could the new pill cause dizziness?"], ph: "Ask it the way she'd ask it" },
    ],
    fixedLine: "It rides her next visit's brief — read before she goes, asked only if she wants it asked.",
    whyPh: "Your ankles looked swollen on Sunday — I'd feel better if the doctor took a look.",
    title: () => "Sarah has a question for your next visit",
    sub: (f) => f.q || "A question for the brief",
    effect: "Saying yes pins it to your next visit's brief, marked as from Sarah. It's asked in the room only if you want it asked.",
    yes: "Add to the brief", no: "Leave it out",
    ansYes: () => "Amma pinned it to her next brief — she'll decide in the room whether to ask it.",
    waits: "It waits with her next visit's brief — not a pop-up.",
    where: "Riding her next visit's brief, marked as yours — she reads it before she goes.",
    sentT: (f) => f.q || "A question for the brief",
  },
  noticed: {
    fields: [
      { id: "what", label: "What you noticed", chips: ["Short of breath on the phone", "The TV louder again", "Quieter than usual"], ph: "Plain words — what you saw or heard" },
      { id: "when", label: "When", chips: ["Today", "Yesterday", "This week"], ph: "Roughly is fine" },
    ],
    whyPh: "You sounded out of breath just walking to the kettle — not to fuss, just keeping an eye.",
    title: () => "Sarah noticed something",
    sub: (f) => `${f.what || "An observation"} · ${(f.when || "recently").toLowerCase()}`,
    effect: "Saying yes keeps it beside your day, marked “Sarah noticed.” Your journal stays untouched — and the next brief can carry it if you want.",
    yes: "Keep it, signed", no: "No, thank you",
    ansYes: () => "Amma kept it beside her day, signed “Sarah noticed.” Her journal stayed hers.",
    waits: "It waits in her Updates — it can never enter her journal.",
    where: "Waiting in her Updates. If she says yes it sits beside her day, signed — never inside her journal.",
    sentT: (f) => f.what || "Something noticed",
  },
  doc: {
    fields: [
      { id: "what", label: "What you have", chips: ["Her insurance card", "A lab letter", "A photo of a bottle"], ph: "What is it?" },
    ],
    whyPh: "Found the card in my files — want it with your documents?",
    title: (f) => `Sarah has ${(f.what || "a document").toLowerCase()} for you`,
    sub: () => "Ready to file — only on your yes",
    effect: "Saying yes files it into your Documents with Sarah's name on it. Until then, Recall holds it unopened.",
    yes: "File it", no: "Not this time",
    ansYes: (f) => `Amma filed it — ${(f.what || "the document").toLowerCase()} is in her Documents now.`,
    waits: "It waits in her Documents under “Waiting on you” — not a pop-up.",
    where: "Waiting in her Documents under “Waiting on you” — it files only when she says yes.",
    sentT: (f) => `Sent ${(f.what || "a document").toLowerCase()}`,
  },
  med: {
    fields: [
      { id: "which", label: "Which medication", chips: ["Calcium 600 mg", "Metformin 500 mg"], ph: "You see the ones she shares", note: "From what she shares with you" },
      { id: "change", label: "The change you'd suggest", chips: ["Move it to dinnertime", "Ask the doctor about the dose"], ph: "Say the change simply" },
    ],
    whyPh: "You said it sits heavy at bedtime — dinner might be kinder on your stomach.",
    title: (f) => `Sarah suggests a change to your ${shortMedName(f.which || "medication").toLowerCase()}`,
    sub: (f) => `${f.which || "A medication"} · ${f.change || "a change"}`,
    effect: "Saying yes applies the change and tomorrow's list follows. Nothing about your routine moves until you say so.",
    /* outcome-named buttons, kept dynamic — her yes button IS the change
       Sarah composed, never a generic "confirm" */
    yes: (f) => f.change || "Make the change", no: "Keep it as is",
    ansYes: (f) => `Amma said yes to your ${shortMedName(f.which || "medication").toLowerCase()} change — ${(f.change || "the change").toLowerCase()}.`,
    waits: "It waits as a small note on her med's row — not a pop-up.",
    where: "Riding her med's row as a small note — she'll see it next time she looks at Meds. Not a pop-up.",
    sentT: (f) => f.change ? `${f.change} — ${shortMedName(f.which || "a med")}` : "A medication change",
  },
};

const KIND_ICON = { visit: "visits", question: "chat", noticed: "person", doc: "docs", med: "meds" };

/* ONE composition, TWO phones. The suggestion Sarah composed doesn't get
   re-authored into a request on Amma's side — it IS the request, read
   through this lens. Her title, her sub, her why, verbatim, with the
   outcome-named buttons she previewed. If these two ever drifted, the
   preview would be a marketing mock-up instead of a promise. */
const needFromSug = (sug) => {
  const d = SUGGEST_FORMS[sug.kind];
  if (!d || !sug.f) return null;
  const f = sug.f;
  return {
    id: sug.id, sugId: sug.id, type: "family", live: true,
    icon: KIND_ICON[sug.kind] || "person",
    title: d.title(f), sub: d.sub(f),
    evidence: sug.quote, evidenceSrc: `Sarah · ${(sug.s || "just now").replace(/^Sent /, "")}`,
    effect: d.effect, actions: ["approve"],
    yesLabel: typeof d.yes === "function" ? d.yes(f) : d.yes,
    noLabel: d.no,
    ansYes: d.ansYes ? d.ansYes(f) : "Amma said yes.",
    doneToast: "Answered ✓ Sarah sees it on her phone — that's the whole loop",
  };
};

/* a labeled field: chip shortcuts above a real input. Tapping a chip
   fills the input; typing overrides it — the chips are speed, never a
   cage. Nothing here is required except the why: details have gentle
   defaults, but evidence can't. */
const ComposerField = ({ field, value, onChange }) => (
  <>
    <SectionLabel>{field.label}</SectionLabel>
    <Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 10 }}>
        {field.chips.map((c) => {
          const on = value === c;
          return (
            <button key={c} className="tap" onClick={() => onChange(on ? "" : c)} style={{
              border: "none", cursor: "pointer", fontFamily: FONT, minHeight: 40,
              padding: "9px 13px", borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: on ? C.blueSoft : C.bg, color: on ? C.blue : C.ink,
              boxShadow: on ? `0 0 0 1.5px ${C.blue}` : "none" }}>
              {c}
            </button>
          );
        })}
      </div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.ph}
        style={{ width: "100%", fontSize: 16, fontWeight: 600, color: C.ink, border: "none",
          outline: "none", background: C.bg, borderRadius: 11, padding: "12px 13px",
          fontFamily: FONT, boxSizing: "border-box" }} />
      {field.note && (
        <div style={{ fontSize: 12.5, color: C.ter, padding: "7px 2px 0" }}>{field.note}</div>
      )}
    </Card>
  </>
);

const SuggestComposerPage = ({ onBack, onSent, onExit }) => {
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState(null);
  const [f, setF] = useState({});
  const [why, setWhy] = useState("");
  const d = kind ? SUGGEST_FORMS[kind] : null;
  const pick = (id) => { setKind(id); setF({}); setWhy(""); setStep(2); };
  /* the preview composes LIVE from what she typed — the interactivity
     IS the trust device: what you write is literally what Amma reads */
  const quote = why.trim() ? `“${why.trim()}”` : "";
  return (
    <RoomShell owner={AMMA_OWNER} title={`Suggest · ${step} of 3`}
      onBack={step === 1 ? onBack : () => setStep(step - 1)}
      onExit={onExit}>
      {step === 1 && (
        <>
          <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, padding: "2px 4px 12px" }}>
            What kind of thing is it?
          </div>
          {SUGGEST_KINDS.map((k) => (
            <Card key={k.id} style={{ marginBottom: 9 }} onClick={() => pick(k.id)}>
              <Row title={k.t} sub={k.s} pad="4px 2px" />
            </Card>
          ))}
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "8px 6px 0" }}>
            Whatever the kind, it arrives the same way: quietly, in place, waiting for her yes.
          </div>
        </>
      )}
      {step === 2 && d && (
        <>
          {d.fields.map((field) => (
            <ComposerField key={field.id} field={field} value={f[field.id]}
              onChange={(v) => setF((p) => ({ ...p, [field.id]: v }))} />
          ))}
          {d.fixedLine && (
            <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, padding: "10px 6px 0" }}>
              {d.fixedLine}
            </div>
          )}
          <SectionLabel>Why — in your words</SectionLabel>
          <Card>
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3}
              placeholder={`e.g. “${d.whyPh}”`}
              style={{ width: "100%", fontSize: 15.5, lineHeight: 1.5, color: C.ink, border: "none",
                outline: "none", background: C.bg, borderRadius: 11, padding: "12px 13px",
                fontFamily: FONT, resize: "none", boxSizing: "border-box" }} />
            <div style={{ fontSize: 13, color: C.ter, padding: "8px 2px 0" }}>
              The one thing that can't be skipped — your words become the “Why” she reads.
              Say it like you'd say it to her.
            </div>
          </Card>
          {/* the soft gate, again: never a dead button — the label itself
              says what's missing until the why exists */}
          <div style={{ marginTop: 14 }}>
            <BigButton tone={why.trim() ? "blue" : "tinted"} onClick={() => why.trim() && setStep(3)}>
              {why.trim() ? "Preview what Amma sees" : "Your why first — it's what she reads"}
            </BigButton>
          </div>
        </>
      )}
      {step === 3 && d && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
            color: C.ter, textAlign: "center", padding: "2px 0 10px" }}>
            This is what Amma will see
          </div>
          <RequestPreview title={d.title(f)} sub={d.sub(f)} quote={quote} effect={d.effect}
            yesLabel={typeof d.yes === "function" ? d.yes(f) : d.yes} noLabel={d.no} />
          <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
            {d.waits}
          </div>
          <div style={{ marginTop: 12 }}>
            {/* `f` travels with the ask — it's what lets Amma's phone
                rebuild this exact card instead of a paraphrase of it */}
            <BigButton onClick={() => onSent({ kind, f, t: d.sentT(f), s: "Sent just now",
              where: d.where, quote })}>Send to Amma</BigButton>
          </div>
          <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "10px 6px 0" }}>
            This goes to Amma as a suggestion.
            <br />Nothing changes unless she says yes.
          </div>
        </>
      )}
    </RoomShell>
  );
};

/* one suggestion, opened: a two-line story — sent, then answered (or
   where it waits). A waiting ask tells the sender HOW it sits on
   Amma's side; an answered one closes in her words, yes or no alike. */
const SuggestionDetailPage = ({ sug, onBack, onExit }) => (
  <RoomShell owner={AMMA_OWNER} title="Your suggestion" onBack={onBack} onExit={onExit}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px 12px" }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.015em", lineHeight: 1.3, flex: 1 }}>{sug.t}</div>
      <StatusChip status={sug.status} />
    </div>
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 2px" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, minWidth: 62, paddingTop: 2 }}>Sent</span>
        <div style={{ fontSize: 15, color: C.ink }}>{sug.s}</div>
      </div>
      {sug.status !== "wait" && sug.ans && (
        <>
          <FullDivider />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 2px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, minWidth: 62, paddingTop: 2,
              color: sug.status === "yes" ? C.greenInk : C.sub }}>Answered</span>
            <div>
              <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.45 }}>{sug.ans}</div>
              {sug.ansAt && (
                <div style={{ fontSize: 13, color: C.ter, marginTop: 4 }}>{sug.ansAt} · on her phone</div>
              )}
            </div>
          </div>
        </>
      )}
      {sug.status === "wait" && sug.where && (
        <>
          <FullDivider />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 2px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, minWidth: 62, paddingTop: 2 }}>On her side</span>
            <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.45 }}>{sug.where}</div>
          </div>
        </>
      )}
      {sug.quote && (
        <>
          <FullDivider />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 2px" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ter, minWidth: 62, paddingTop: 2 }}>Your why</span>
            <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.45, fontStyle: "italic" }}>{sug.quote}</div>
          </div>
        </>
      )}
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "14px 6px 0", textAlign: "center" }}>
      No nudges, no resends — she saw it, and she answers when she answers.
    </div>
  </RoomShell>
);

/* the care update, opened — authored by Amma, not mined by Recall.     */
const CareUpdateReaderPage = ({ onBack, onExit, showToast }) => (
  <RoomShell owner={AMMA_OWNER} title={CARE_UPDATE.title} onBack={onBack} onExit={onExit}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 10px" }}>
      <div style={{ fontSize: 13.5, color: C.sub }}>A care update from Amma · {CARE_UPDATE.range}</div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, background: C.blueSoft,
        borderRadius: 99, padding: "4px 10px" }}>EN</span>
    </div>
    {CARE_UPDATE.sections.filter((s) => s.on).map((s) => (
      <Card key={s.id} style={{ marginBottom: 9 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.purple }}>
          {s.t}
        </div>
        {s.bars && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 52, padding: "8px 2px 2px" }}>
            {s.bars.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: C.purple, opacity: 0.72,
                borderRadius: "5px 5px 0 0" }} />
            ))}
          </div>
        )}
        <div style={{ fontSize: 15.5, lineHeight: 1.55, marginTop: 7 }}>{s.body}</div>
      </Card>
    ))}
    <div style={{ marginTop: 6 }}>
      <BigButton tone="tinted" icon={<Icon d={icons.speaker} size={18} />}
        onClick={() => showToast("Recall reads the update aloud", 2200)}>
        Read it aloud
      </BigButton>
    </div>
    <div style={{ fontSize: 13.5, color: C.ter, textAlign: "center", lineHeight: 1.5, padding: "12px 6px 0" }}>
      Amma chose exactly what's in this update. She spoke her language — you read yours.
    </div>
  </RoomShell>
);

/* "How this works" — the room-scoped explainer behind the FAB          */
const HowSheet = ({ kind, onClose }) => (
  <Sheet title="How this works" onClose={onClose}>
    <Card>
      {(kind === "room" ? [
        ["check", "You can add and fix things", "Meds, visits, documents, dose check-offs — applied right away, stamped with your name."],
        ["undo", "Thatha can undo anything", "One tap on his side, no questions asked. Not sure? Send it as a suggestion instead."],
        ["lock", "His journal stays his", "Check-ins, transcripts, mood — visible only if he shares a specific thing with you."],
      ] : [
        ["plus", "You suggest; she decides", "Visits, questions, documents, things you noticed — each waits for her yes, and never in silence: Waiting, Yes, or Not this time."],
        ["chat", "Hellos, not check-ups", "Ask how she's doing and she sends one line back — her words, her choice, or nothing. Not a chat; for a conversation, call her."],
        ["lock", "Nobody writes as Amma", "Her journal has one voice — hers. A caregiver can file signed notes she can remove; family sends asks. Only she journals."],
      ]).map(([ic, t, s], i) => (
        <div key={t}>
          {i > 0 && <Divider />}
          <Row leading={<Icon d={icons[ic]} size={19} />} title={t} sub={s} right={null} />
        </div>
      ))}
    </Card>
  </Sheet>
);

/* the hello — the room's second verb, finally given its contract. It is
   deliberately NOT a chat: one knock, at most one line back, no thread.
   The product says so out loud and points at the phone for real
   conversation — a messaging app inside a memory app would compete
   with her family's actual calls, and lose. What makes it belong HERE
   is what SMS can't do: the answer comes from her day, chosen by her,
   without her composing anything. */
const AskHelloSheet = ({ onClose, onSend }) => (
  <Sheet title="Ask how she's doing" onClose={onClose}>
    <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.55, padding: "0 4px" }}>
      A knock, not a check-up. Amma answers with one line from her day — her words,
      her choice — or not at all.
    </div>
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
      color: C.ter, padding: "14px 4px 7px" }}>What she sees, in her Updates</div>
    <div style={{ border: `1.5px dashed ${C.dash}`, borderRadius: 16, padding: 14, background: C.bg }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ter }}>FROM SARAH</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>Sarah's thinking of you</div>
      <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginTop: 4 }}>
        Send a line back from your day? You choose the line — or send nothing.
      </div>
      <div style={{ display: "flex", gap: 9, marginTop: 12, opacity: 0.55, pointerEvents: "none" }}>
        <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.blue, color: "#fff",
          fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Send a line</div>
        <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.track, color: C.ink,
          fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Not today</div>
      </div>
    </div>
    <div style={{ marginTop: 16 }}>
      <BigButton icon={<Icon d={icons.chat} size={18} />} onClick={onSend}>Send the hello</BigButton>
    </div>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "14px 6px 4px" }}>
      One hello, one line back — this isn't a chat, and Recall spaces them out: at most one
      a day. For a real conversation, call her. Recall never replaces that.
    </div>
  </Sheet>
);

/* A no is already an answer — this sheet only asks whether to put a
   word with it. It borrows the hello's grammar exactly (she CHOOSES a
   line, never composes one), because the alternative — a text box in
   front of an 82-year-old at the moment she's declining her daughter —
   is how a warm no turns into homework and then into silence. So:
   four taps, all of them complete answers, and closing the sheet still
   sends the plain no. There is no route out of here that leaves Sarah
   waiting. */
const WARM_NOS = [
  "I like my own routine — but thank you.",
  "Not just now — maybe later on.",
  "Let's talk about it when you call.",
];

const DeclineSheet = ({ req, onClose, onSend }) => (
  <Sheet title="Say a word back?" onClose={onClose}>
    <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.55, padding: "0 4px 4px" }}>
      Sarah will see “Not this time” either way — nothing is expected. A word just
      makes it kinder.
    </div>
    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
      color: C.ter, padding: "14px 4px 8px" }}>
      About · {req.title}
    </div>
    {WARM_NOS.map((line) => (
      <button key={line} className="tap" onClick={() => onSend(line)} style={{
        display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        fontFamily: FONT, background: C.card, color: C.ink, fontSize: 16, fontWeight: 600,
        lineHeight: 1.45, borderRadius: 13, padding: "14px 15px", marginBottom: 9, minHeight: 44,
        boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)" }}>
        “{line}”
      </button>
    ))}
    <button className="tap" onClick={() => onSend(null)} style={{ border: "none", background: "none",
      cursor: "pointer", fontFamily: FONT, color: C.blue, fontSize: 15, fontWeight: 600,
      padding: "10px 4px 2px", minHeight: 44, display: "block", width: "100%", textAlign: "left" }}>
      Send it plain — no words
    </button>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.55, padding: "12px 6px 4px" }}>
      Your no is already sent. This is only whether a word goes with it.
    </div>
  </Sheet>
);

const UpdatesSheet = ({ onClose, period, needs = [], openRequest, hello, onHelloAnswer }) => {
  const waiting = needs.filter((n) => !n.applied);
  const applied = needs.filter((n) => n.applied);
  return (
  <Sheet title="Updates" onClose={onClose}>
    {/* a hello from the circle — social, not a request about her record,
        so it wears blue, not orange. The picker IS the card: she taps a
        line from her day (never composes) or closes the door warmly. */}
    {hello === "asked" && (
      <Card tone={C.blueSoft} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.blueSub }}>FROM SARAH</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.blueDeep, marginTop: 5 }}>Sarah's thinking of you</div>
        <div style={{ fontSize: 14, color: C.blueSub, lineHeight: 1.5, marginTop: 3, marginBottom: 11 }}>
          Send a line back from your day? You choose — nothing goes without you.
        </div>
        {[
          (CHECKIN_ENTRY[period] || CHECKIN_ENTRY.week2).paras[0].replace(/[“”]/g, ""),
          "A good day — tell her not to worry.",
        ].map((line) => (
          <button key={line} className="tap" onClick={() => onHelloAnswer(line)} style={{
            display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
            fontFamily: FONT, background: C.card, color: C.ink, fontSize: 15, fontWeight: 600,
            lineHeight: 1.45, borderRadius: 11, padding: "12px 13px", marginBottom: 8, minHeight: 44 }}>
            “{line}”
          </button>
        ))}
        <button className="tap" onClick={() => onHelloAnswer(null)} style={{ border: "none",
          background: "none", cursor: "pointer", fontFamily: FONT, color: C.blueSub,
          fontSize: 14.5, fontWeight: 600, padding: "8px 2px 2px", minHeight: 44 }}>
          Not today — that's fine too
        </button>
      </Card>
    )}
    {waiting.length > 0 && (
      <>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
          color: C.orangeInk, margin: "2px 6px 8px" }}>
          Needs you · {waiting.length}
        </div>
        <Card tone={C.orangeSoft} style={{ marginBottom: 6 }}>
          {waiting.map((n, i) => (
            <div key={n.id}>
              {i > 0 && <FullDivider />}
              <Row leading={<Icon d={icons[n.icon]} size={19} />}
                leadingBg="#fff" leadColor={C.orange} title={n.title} sub={n.sub}
                onClick={() => openRequest(n)} />
            </div>
          ))}
        </Card>
      </>
    )}
    {applied.length > 0 && (
      <>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
          color: C.sub, margin: "14px 6px 8px" }}>
          Already applied — you can undo
        </div>
        <Card style={{ marginBottom: 6 }}>
          {applied.map((n, i) => (
            <div key={n.id}>
              {i > 0 && <Divider />}
              <Row leading={<Icon d={icons[n.icon]} size={19} />}
                leadingBg={C.orangeSoft} leadColor={C.orange} title={n.title} sub={n.sub}
                onClick={() => openRequest(n)} />
            </div>
          ))}
        </Card>
      </>
    )}
    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase",
      color: C.sub, margin: "14px 6px 8px" }}>
      Earlier
    </div>
    <Card>
      {(period === "week2" || period === "visitday" || period === "month1") && (
        <>
          <Row leading={<Icon d={icons.spark} size={19} />} leadingBg={C.purpleSoft} leadColor={C.purple}
            title="Weekly insight unlocked" sub="Saturday · it's in your Journal" />
          <Divider />
        </>
      )}
      <Row leading={<Icon d={icons.docs} size={19} />}
        title="Sarah asked for your insurance card"
        sub={period === "week1" ? "This morning" : "July 28 · done"} />
    </Card>
    <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
      Everything anyone does or asks for shows up here — nothing happens silently. Each open item
      also waits where it would land; decide it anywhere and it leaves everywhere.
    </div>
  </Sheet>
  );
};

const ShareSheet = ({ onClose }) => (
  <Sheet title="Share your brief" onClose={onClose}>
    <Card onClick={() => {}}>
      <Row leading={<Icon d={icons.share} size={19} />} title="Share as it is"
        sub="Send the full brief exactly as you just read it." />
    </Card>
    <div style={{ height: 10 }} />
    <Card onClick={() => {}} style={{ boxShadow: `0 0 0 1.5px ${C.blue}` }}>
      <Row leading={<Icon d={icons.mic} size={19} />} title="Curate it with Recall first"
        sub={'Just say it: "Keep the medications, leave out my sleep notes." Then review before it goes anywhere.'} />
    </Card>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 6px 0" }}>
      <div style={{ width: 7, height: 7, borderRadius: 99, background: C.green, flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: C.sub, lineHeight: 1.45 }}>
        Nothing is shared until you approve the final version.
      </span>
    </div>
  </Sheet>
);

/* --------------- the conversation: call ⇄ chat --------------------- */

const ThinkChip = ({ text, dark }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 99,
    padding: "8px 14px", fontSize: 13.5, alignSelf: "flex-start",
    background: dark ? "rgba(255,255,255,.12)" : "#fff",
    color: dark ? "#fff" : C.sub,
    boxShadow: dark ? "none" : "0 0 0 0.5px rgba(0,0,0,.06)" }}>
    <span className="blink" style={{ width: 7, height: 7, borderRadius: 99, background: dark ? "#7CC0FF" : C.blue }} />
    {text}
  </div>
);

const ChatBubble = ({ who, children }) => (
  <div style={{
    alignSelf: who === "me" ? "flex-end" : "flex-start", maxWidth: "82%",
    background: who === "me" ? C.blue : C.card, color: who === "me" ? "#fff" : C.ink,
    borderRadius: who === "me" ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
    padding: "11px 15px", fontSize: 16, lineHeight: 1.45,
    boxShadow: who === "me" ? "none" : "0 0 0 0.5px rgba(0,0,0,.06)",
  }}>
    {children}
  </div>
);

const CallButton = ({ children, label, onClick, bg }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <button className="tap" onClick={onClick} aria-label={label} style={{ width: 64, height: 64, borderRadius: 99,
      border: "none", background: bg, color: "#fff", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </button>
    {/* the word IS part of the control — a label you can read but not
        tap is a dead zone exactly where an unsteady finger aims */}
    <span className="tap" onClick={onClick} style={{ fontSize: 13.5, opacity: 0.8, cursor: "pointer" }}>{label}</span>
  </div>
);

/* small in-conversation panels: ideas & the internal scenario tester.
   color is set explicitly — these open over the dark call screen and
   used to inherit its white text, which made them unreadable */
const OverlayPanel = ({ title, caption, onClose, children }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 46, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }} />
    <div className="sheetIn" style={{ position: "relative", background: C.bg, color: C.ink,
      borderRadius: "22px 22px 0 0", padding: "14px 16px 22px", maxHeight: "80%",
      display: "flex", flexDirection: "column" }}>
      <div style={{ width: 38, height: 5, borderRadius: 99, background: C.track, margin: "-4px auto 12px", flexShrink: 0 }} />
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 3, color: C.ink, flexShrink: 0 }}>{title}</div>
      {caption && <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, marginBottom: 10, flexShrink: 0 }}>{caption}</div>}
      <div className="scroll" style={{ overflowY: "auto", minHeight: 0 }}>{children}</div>
    </div>
  </div>
);

/* backstage chip — internal preview of what Recall does behind the talk */
const StageChip = ({ text, dark }) => (
  <div style={{ maxWidth: "94%", display: "inline-flex", alignItems: "flex-start", gap: 8,
    borderRadius: 10, padding: "7px 11px", fontSize: 12, lineHeight: 1.4, fontStyle: "italic",
    border: `1px dashed ${dark ? "rgba(255,255,255,.4)" : "#C7C7CF"}`,
    color: dark ? "rgba(255,255,255,.75)" : C.ter, textAlign: "left" }}>
    <span style={{ fontStyle: "normal", fontWeight: 700, fontSize: 10, letterSpacing: ".06em",
      flexShrink: 0, marginTop: 2 }}>BACKSTAGE</span>
    <span>{text}</span>
  </div>
);

/* noted chip — something captured quietly, settled later at review */
const NotedChip = ({ text, dark }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 99,
    padding: "8px 14px", fontSize: 13, fontWeight: 600, lineHeight: 1.35, maxWidth: "94%",
    background: dark ? "rgba(124,192,255,.18)" : C.blueSoft,
    color: dark ? "#AFD6FF" : C.blue, textAlign: "left" }}>
    <Icon d={icons.check} size={14} sw={2.6} />
    <span>{text}</span>
  </div>
);

/* speech pacing — longer sentences hold the screen a bit longer */
const turnDur = (t) =>
  t.k === "r" || t.k === "a" ? Math.min(4600, 1500 + t.t.length * 34) : 2100;

/* captures merge by their title — replaying a moment replaces its capture
   instead of doubling it, so the review never shows the same fact twice.
   A cap with `replaces` swaps out the old wording (the say-it-again path). */
const mergeCaps = (prev, next) => {
  const out = [...prev];
  next.forEach((c) => {
    const i = out.findIndex((p) => p.t === c.t || (c.replaces && p.t === c.replaces));
    if (i >= 0) out[i] = c; else out.push(c);
  });
  return out;
};

const CallOverlay = ({ startMode = "voice", startScenario = "base", onDone, showToast,
  period = "day1", followedTopics = [], topicStates = {} }) => {
  const [mode, setMode] = useState(startMode);
  const [secs, setSecs] = useState(84);
  const [scn, setScn] = useState(startScenario);
  const [ti, setTi] = useState(0);
  const [answered, setAnswered] = useState({});
  const [bank, setBank] = useState([]); /* caps kept across flask moments — one
                                           call can chain several, one review recaps them all */
  const [panel, setPanel] = useState(null);
  const [peek, setPeek] = useState(null); /* one topic, glanced at over the live call */
  const [parked, setParked] = useState(null); /* call history peek: index into speech turns, null = live */
  const [muted, setMuted] = useState(false);  /* mute = Recall can't hear you; the talk waits */
  const [extras, setExtras] = useState([]);   /* turns appended live (chat dictation) */
  const [dictating, setDictating] = useState(false);
  const [readAloud, setReadAloud] = useState(false); /* chat replies spoken — off by default: chat is chosen for quiet places */
  const touchX = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  const script = SCRIPTS[scn];
  /* a scoped script is ABOUT someone else (a care note) — the 6-commitment
     bar is the owner's shape, not the caregiver's, so a scope chip replaces it */
  const scope = script.scope;
  const turns = [...script.turns, ...extras];
  const cur = turns[ti];
  const idle = !cur;
  const waitingConfirm = !!(cur && cur.k === "confirm" && !answered[cur.c]);
  /* an ifYes turn only plays when its confirm was answered yes */
  const skipCur = !!(cur && cur.ifYes && answered[cur.ifYes] !== "yes");

  /* the conversation plays itself; confirm cards pause it until answered,
     and mute holds it — Recall can't hear you, so the talk waits */
  useEffect(() => {
    if (!cur || waitingConfirm || muted) return;
    const t = setTimeout(() => setTi((v) => v + 1),
      skipCur ? 60 : cur.k === "confirm" ? 900 : turnDur(cur));
    return () => clearTimeout(t);
  }, [scn, ti, waitingConfirm, skipCur, muted, turns.length]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [ti, mode]);

  /* a confirm needs live context — leave any history peek for good */
  useEffect(() => { if (waitingConfirm) setParked(null); }, [waitingConfirm]);

  const visible = (t) => !t.ifYes || answered[t.ifYes] === "yes";
  const cover = turns.slice(0, ti + 1).reduce((acc, t) => (t.cover != null ? t.cover : acc), script.cover);
  const mood = muted ? "sleeping"
    : !cur ? "calm"
    : cur.k === "think" ? "thinking"
    : cur.k === "a" ? "listening"
    : cur.k === "r" ? (cur.mood || "calm")
    : "calm";
  const talking = !muted && cur && cur.k === "r" && !skipCur;
  const status = muted ? "muted — Recall can't hear you"
    : idle ? "listening — take your time"
    : cur.k === "r" ? "Recall is speaking"
    : cur.k === "a" ? "listening to you"
    : cur.k === "think" ? "thinking…"
    : cur.k === "confirm" ? "waiting for your tap"
    : "listening";

  const pickScenario = (id) => {
    setBank((b) => mergeCaps(b, collectCaptured())); /* what this moment noted survives the switch */
    setScn(id); setTi(0); setAnswered({}); setPanel(null); setParked(null);
    setMuted(false); setExtras([]); setDictating(false);
  };

  /* internal preview control — jump the moment to its end so a tester
     can go straight to Done → review. Stops AT any card that needs a
     tap (a confirm is a decision, never skippable); press again after
     answering to run out the rest. */
  const skipAhead = () => {
    setMuted(false); setParked(null);
    let j = ti;
    while (j < turns.length && !(turns[j].k === "confirm" && !answered[turns[j].c])) j++;
    setTi(j);
  };
  const submitDictation = () => { setDictating(false); setExtras((e) => [...e, ...DICTATION_TURNS]); };
  const answer = (key, v) => {
    setAnswered((p) => ({ ...p, [key]: v }));
    showToast(v === "yes" ? CONFIRMS[key].yesMsg : CONFIRMS[key].noMsg, 2600);
  };

  /* everything quietly captured during the talk — the review recaps it */
  const collectCaptured = () => {
    const out = [];
    turns.slice(0, ti + 1).forEach((t) => {
      if (t.k === "note" && t.cap) out.push(t.cap);
      if (t.k === "confirm" && answered[t.c] === "yes" && CONFIRMS[t.c].cap) out.push(CONFIRMS[t.c].cap);
    });
    return out;
  };
  const finish = () => onDone(mergeCaps(bank, collectCaptured()), scn);

  /* the topics drawer — what Recall is carrying, one tap away in the
     same place every call. Two sections answer the two mid-call
     worries: "did it catch that?" (noted so far, live) and "what is it
     following?" (the active stories). Read-only ON PURPOSE: nothing
     here is a form; the one action hands a topic to the conversation.
     The call never pauses underneath. */
  const carriedTopics = topicsFor(period, followedTopics)
    .map((t) => ({ ...t, ...(topicStates[t.id] || {}) }))
    .filter((t) => t.state === "active");
  const noted = mergeCaps(bank, collectCaptured());
  const bringUp = (t) => {
    setPanel(null); setPeek(null); setParked(null);
    setExtras((e) => [...e,
      ...(t.bringup || [{ k: "r", t: `${t.name} — tell me how it's been since last time.` }])]);
  };

  const panels = (
    <>
      {panel === "ideas" && (
        <OverlayPanel title="Some starting points"
          caption="From your week — tap one and Recall opens that thread, or just keep talking."
          onClose={() => setPanel(null)}>
          <Card>
            {IDEAS.map((t, i) => (
              <div key={t.t}>
                {i > 0 && <Divider />}
                <Row leading={<Icon d={icons.chat} size={19} />} title={t.t} sub={t.s}
                  onClick={() => { pickScenario(t.scen); showToast("Okay — let's talk about that", 2000); }} />
              </div>
            ))}
          </Card>
        </OverlayPanel>
      )}
      {panel === "test" && (
        <OverlayPanel title="Test a moment"
          caption="Internal control — each moment is one script that plays in BOTH call and chat; switching keeps your place. Dashed “backstage” chips show what Recall does internally; Amma never sees them."
          onClose={() => setPanel(null)}>
          {SCEN_GROUPS.map(([g, items]) => (
            <div key={g}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
                color: C.sub, margin: "12px 4px 7px" }}>{g}</div>
              {items.map(([id, label, blurb]) => (
                <button key={id} className="tap" onClick={() => pickScenario(id)}
                  style={{ display: "block", width: "100%", textAlign: "left", border: "none", borderRadius: 12,
                    background: scn === id ? C.blueSoft : "#fff", padding: "12px 14px",
                    cursor: "pointer", fontFamily: FONT, marginBottom: 7, boxShadow: "0 0 0 0.5px rgba(0,0,0,.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600, color: scn === id ? C.blue : C.ink }}>{label}</span>
                    {scn === id && <Icon d={icons.check} size={16} sw={2.6} color={C.blue} />}
                  </div>
                  <div style={{ fontSize: 13, color: C.sub, marginTop: 2, lineHeight: 1.35 }}>{blurb}</div>
                </button>
              ))}
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: C.ter, lineHeight: 1.45, padding: "6px 4px 2px" }}>
            Re-tap a moment to replay it from the top. Moments chain: whatever each one captures stays for
            the review, so playing several in one call builds a denser day. The ⏩ button beside the flask
            fast-forwards the current moment — it stops at any card that needs your tap, then runs out the
            rest. Ending with Done always flows into Recall's review.
          </div>
        </OverlayPanel>
      )}
      {panel === "topics" && (
        <OverlayPanel title="In mind — this call"
          caption="A glance at Recall's notes — the call keeps going; swipe down to return."
          onClose={() => setPanel(null)}>
          <SectionLabel>Noted so far</SectionLabel>
          <Card>
            {noted.length === 0 ? (
              <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, padding: "6px 2px" }}>
                Nothing yet — just talk. Anything worth keeping lands here as you say it.
              </div>
            ) : noted.map((c, i) => (
              <div key={c.t} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 2px",
                borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: c.kind === "done" ? C.greenSoft : C.blueSoft,
                  color: c.kind === "done" ? C.green : C.blue,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={c.kind === "done" ? icons.check : icons.clock} size={15} sw={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{c.t}</div>
                  <div style={{ fontSize: 12.5, color: C.sub }}>
                    {c.kind === "done" ? "confirmed in the talk" : "you'll settle it at review"}
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <SectionLabel>Being followed</SectionLabel>
          <Card>
            {carriedTopics.length === 0 ? (
              <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, padding: "6px 2px" }}>
                Nothing followed yet. When something needs following over time, it starts here —
                you'll always be asked first.
              </div>
            ) : carriedTopics.map((t, i) => (
              <div key={t.id} className="tap" onClick={() => setPeek(t)} style={{ display: "flex",
                alignItems: "center", gap: 11, padding: "9px 2px", cursor: "pointer",
                borderTop: i > 0 ? `0.5px solid ${C.line}` : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: C.orangeSoft, color: C.orange,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={icons.topic} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis" }}>{t.latest}</div>
                </div>
                <button className="tap" onClick={(e) => { e.stopPropagation(); bringUp(t); }}
                  style={{ border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99,
                    padding: "8px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: FONT, flexShrink: 0 }}>
                  Bring it up
                </button>
              </div>
            ))}
          </Card>
          <div style={{ fontSize: 12.5, color: C.ter, lineHeight: 1.5, padding: "8px 4px 2px" }}>
            Nothing here is a form — it's a glance. “Bring it up” hands a topic to the conversation —
            Recall raises it at the next pause, never mid-sentence. A topic's name opens its story
            without leaving the call.
          </div>
        </OverlayPanel>
      )}
      {peek && (
        <OverlayPanel title={peek.name}
          caption="A glance while the call keeps going — managing waits for Journal › Topics."
          onClose={() => setPeek(null)}>
          <TopicBody t={{ ...peek, ...(topicStates[peek.id] || {}) }} />
          <div style={{ marginTop: 12 }}>
            <BigButton tone="tinted" icon={<Icon d={icons.mic} size={17} />} onClick={() => bringUp(peek)}>
              Bring it up in the talk
            </BigButton>
          </div>
        </OverlayPanel>
      )}
    </>
  );

  /* ---------------- chat skin — same conversation, bubbles ---------- */
  if (mode === "chat") {
    const shown = turns.slice(0, ti + 1).filter(visible);
    const next = turns[ti + 1];
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 40, background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 10px",
          background: C.card, boxShadow: "0 0.5px 0 rgba(0,0,0,.08)" }}>
          <RecallOrb size={40} mood={mood} talking={readAloud && talking} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Recall</div>
            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
              {scope ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, background: C.tealSoft,
                  borderRadius: 99, padding: "3px 9px", whiteSpace: "nowrap" }}>{scope.chip}</span>
              ) : (
                <>
                  <Dots6 n={cover} />
                  {/* the drawer's chat-side door — same drawer, both skins */}
                  <button className="tap" onClick={() => setPanel("topics")}
                    aria-label="Topics — what Recall is carrying"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "none",
                      background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "4px 9px",
                      fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}>
                    <Icon d={icons.topic} size={11} sw={2.4} />
                    Topics{carriedTopics.length > 0 ? ` · ${carriedTopics.length}` : ""}
                  </button>
                </>
              )}
              <span style={{ fontSize: 11.5, color: C.ter, whiteSpace: "nowrap", overflow: "hidden",
                textOverflow: "ellipsis" }}>{status}</span>
            </div>
          </div>
          <button className="tap" onClick={() => {
            setReadAloud((v) => {
              showToast(v ? "Read-aloud off" : "Recall will read replies out loud", 2000);
              return !v;
            });
          }} aria-label="Read replies aloud"
            style={{ width: 34, height: 34, borderRadius: 99, border: "none",
              background: readAloud ? C.blueSoft : "transparent",
              color: readAloud ? C.blue : C.ter, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.speaker} size={18} />
          </button>
          <button className="tap" onClick={() => setPanel("test")} aria-label="Test scenarios"
            style={{ width: 34, height: 34, borderRadius: 99, border: "none", background: "transparent",
              color: C.ter, cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.flask} size={17} />
          </button>
          <button className="tap" onClick={skipAhead} aria-label="Fast-forward the moment"
            style={{ width: 34, height: 34, borderRadius: 99, border: "none", background: "transparent",
              color: C.ter, cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.ff} size={16} />
          </button>
          <button className="tap" onClick={() => setMode("voice")} style={{ border: "none",
            background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "9px 14px",
            fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d={icons.mic} size={15} />Call
          </button>
          <button className="tap" onClick={finish} style={{ border: "none", background: "none",
            color: C.blue, fontSize: 15.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
            Done
          </button>
        </div>

        <div className="scroll" style={{ flex: 1, overflowY: "auto", padding: "18px 16px",
          display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((it, i) => {
            const isCur = i === shown.length - 1;
            if (it.k === "a")
              return <div key={i} className={isCur ? "fadeMsg" : ""} style={{ display: "flex", justifyContent: "flex-end" }}><ChatBubble who="me">{it.t}</ChatBubble></div>;
            if (it.k === "r")
              return (
                <div key={i} className={isCur ? "fadeMsg" : ""} style={{ display: "flex",
                  flexDirection: "column", alignItems: "flex-start" }}>
                  <ChatBubble who="recall">
                    {it.t}
                    {isCur && readAloud && (
                      <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, marginLeft: 8,
                        height: 11, color: C.blue, verticalAlign: "middle" }}>
                        <span className="wavebar" style={{ height: 7 }} />
                        <span className="wavebar" style={{ height: 11, animationDelay: ".2s" }} />
                        <span className="wavebar" style={{ height: 8, animationDelay: ".4s" }} />
                      </span>
                    )}
                  </ChatBubble>
                  {/* a primed question shows its work, right under the asking */}
                  {it.why && (
                    <div style={{ fontSize: 12.5, lineHeight: 1.45, color: C.sub,
                      padding: "4px 8px 0", maxWidth: "84%" }}>
                      Why this question · {it.why}
                    </div>
                  )}
                </div>
              );
            if (it.k === "think") return <ThinkChip key={i} text={it.t} />;
            if (it.k === "stage")
              return <div key={i} style={{ display: "flex", justifyContent: "center" }}><StageChip text={it.t} /></div>;
            if (it.k === "note")
              return <div key={i} style={{ display: "flex", justifyContent: "center" }}><NotedChip text={it.t} /></div>;
            if (it.k === "confirm") {
              const c = CONFIRMS[it.c];
              const a = answered[it.c];
              return a ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ChatBubble who="recall">{a === "yes" ? c.yesMsg : c.noMsg}</ChatBubble>
                </div>
              ) : (
                <div key={i} style={{ maxWidth: "88%", alignSelf: "flex-start", width: "100%" }}>
                  <ConfirmCard cfg={c} onAnswer={(v) => answer(it.c, v)} />
                </div>
              );
            }
            return null;
          })}
          {!idle && !waitingConfirm && next && next.k === "r" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <RecallOrb size={26} mood="thinking" />
              <span style={{ fontSize: 13.5, color: C.ter }}>Recall is typing…</span>
            </div>
          )}
          {idle && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <RecallOrb size={26} mood="calm" />
              <span style={{ fontSize: 13.5, color: C.ter }}>Recall is listening — or tap Done to review.</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: "8px 14px 22px", background: C.bg }}>
          {dictating ? (
            /* Speak-style dictation: tap mic → talk → tap ✓ → your words appear as a bubble */
            <div className="sheetIn" style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button className="tap" onClick={() => setDictating(false)} aria-label="Cancel dictation"
                style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: C.track,
                  color: C.sub, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.close} size={17} sw={2.4} />
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: C.card,
                borderRadius: 99, padding: "10px 16px", boxShadow: `0 0 0 1.5px ${C.green}` }}>
                <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 3, height: 18, color: C.green }}>
                  {[9, 15, 11, 18, 13].map((h, i) => (
                    <span key={i} className="wavebar" style={{ height: h, width: 3.5, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </span>
                <span style={{ flex: 1, fontSize: 15, color: C.greenInk, fontWeight: 600 }}>
                  Listening — take your time
                </span>
              </div>
              <button className="tap" onClick={submitDictation} aria-label="Finish dictation"
                style={{ width: 48, height: 48, borderRadius: 99, border: "none", background: C.blue,
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.check} size={22} sw={2.8} />
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button className="tap" onClick={() => setPanel("ideas")} aria-label="Starting points"
                style={{ width: 44, height: 44, borderRadius: 99, border: "none", background: C.blueSoft,
                  color: C.blue, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.bulb} size={20} />
              </button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: C.card,
                borderRadius: 99, padding: "7px 7px 7px 17px", boxShadow: "0 0 0 0.5px rgba(0,0,0,.08)" }}>
                <span style={{ flex: 1, fontSize: 15.5, color: C.ter }}>Type your answer…</span>
                <button className="tap" onClick={() => setDictating(true)} aria-label="Dictate"
                  style={{ width: 40, height: 40, borderRadius: 99,
                    border: "none", background: C.blue, color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={icons.mic} size={18} />
                </button>
              </div>
            </div>
          )}
          <div style={{ fontSize: 12.5, color: C.ter, textAlign: "center", marginTop: 7 }}>
            {dictating
              ? "Your words appear as text when you tap ✓ — nothing sends by accident."
              : "Chat is always unlimited · type or dictate — same conversation."}
          </div>
        </div>
        {panels}
      </div>
    );
  }

  /* ---------------- call skin — ONE caption at a time --------------- */
  /* A real call isn't a wall of texts. We show a single spoken line,
     replaced as the talk moves. History is a peek — swipe or the ‹ ›
     arrows step back through past lines; a "Live" pill snaps forward.
     The full running history stays legible in the chat skin. */
  const shownAll = turns.slice(0, ti + 1).filter(visible);
  const speech = shownAll.filter((t) => t.k === "a" || t.k === "r");
  const atLive = parked === null || waitingConfirm;
  const parkedTurn = !atLive ? speech[Math.min(parked, speech.length - 1)] : null;
  const canPeek = speech.length > 1 && !waitingConfirm;
  const goOlder = () => { if (!canPeek) return; setParked((p) => (p === null ? speech.length - 2 : Math.max(0, p - 1))); };
  const goNewer = () => setParked((p) => (p === null ? null : p >= speech.length - 1 ? null : p + 1));
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx > 45) goOlder(); else if (dx < -45) goNewer();
    touchX.current = null;
  };
  /* what fills the single caption slot right now */
  const liveKind = idle ? "idle" : cur.k;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40,
      background: "linear-gradient(180deg, #0B1F3A 0%, #0A2C4F 55%, #093057 100%)",
      display: "flex", flexDirection: "column", color: "#fff" }}>

      {/* the topics pill — top-left, 44pt, the same place every call; a
          full screen away from Chat / Mute / Done so navigation never
          shares the thumb zone with call actions. The internal flask
          and ⏩ live in the right column, dimmed, under the bulb. */}
      {!scope && (
        <button className="tap" onClick={() => setPanel("topics")} aria-label="Topics — what Recall is carrying"
          style={{ position: "absolute", top: 16, left: 16, display: "inline-flex", alignItems: "center",
            gap: 6, border: "none", background: "rgba(255,255,255,.12)", color: "#fff", borderRadius: 99,
            padding: "12px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
          <Icon d={icons.topic} size={14} sw={2} />
          Topics
          {carriedTopics.length > 0 && (
            <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 99, minWidth: 18,
              height: 18, fontSize: 11, display: "inline-flex", alignItems: "center",
              justifyContent: "center", padding: "0 5px" }}>{carriedTopics.length}</span>
          )}
        </button>
      )}
      <button className="tap" onClick={() => setPanel("ideas")} aria-label="Starting points"
        style={{ position: "absolute", top: 16, right: 16, width: 38, height: 38, borderRadius: 99,
          border: "none", background: "rgba(255,255,255,.14)", color: "#fff",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={icons.bulb} size={18} />
      </button>
      <button className="tap" onClick={() => setPanel("test")} aria-label="Test scenarios"
        style={{ position: "absolute", top: 62, right: 16, width: 38, height: 38, borderRadius: 99,
          border: "none", background: "rgba(255,255,255,.1)", color: "#fff", opacity: 0.55,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={icons.flask} size={18} />
      </button>
      <button className="tap" onClick={skipAhead} aria-label="Fast-forward the moment"
        style={{ position: "absolute", top: 108, right: 16, width: 38, height: 38, borderRadius: 99,
          border: "none", background: "rgba(255,255,255,.1)", color: "#fff", opacity: 0.55,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={icons.ff} size={17} />
      </button>

      <div style={{ textAlign: "center", paddingTop: 34, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <RecallOrb size={86} glow mood={mood} talking={talking} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, letterSpacing: "-.01em" }}>Recall</div>
        <div style={{ fontSize: 15, opacity: 0.75, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{mm}:{ss}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8,
          background: "rgba(255,255,255,.12)", borderRadius: 99, padding: "6px 13px", fontSize: 13 }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: C.green }} />
          11 min left this month · chat is unlimited
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: 10 }}>
          {scope ? (
            <>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9FE0EE", background: "rgba(48,176,199,.22)",
                borderRadius: 99, padding: "4px 12px" }}>{scope.chip}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{status}</span>
            </>
          ) : (
            <>
              <Dots6 n={cover} light />
              <span style={{ fontSize: 12, opacity: 0.6 }}>{cover} of 6 touched · {status}</span>
            </>
          )}
        </div>

        {/* history controls live UP HERE, a screen away from the call buttons —
            they navigate the transcript, so they sit with the status, not the actions */}
        {canPeek && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
            <button className="tap" onClick={goOlder} aria-label="Earlier line"
              disabled={!atLive ? parked === 0 : false}
              style={{ width: 40, height: 40, borderRadius: 99, border: "none", cursor: "pointer",
                background: "rgba(255,255,255,.12)", color: "#fff",
                opacity: (!atLive && parked === 0) ? 0.3 : 0.85,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.back} size={20} sw={2.4} />
            </button>
            {atLive ? (
              <span style={{ fontSize: 12, opacity: 0.55, minWidth: 96, display: "inline-flex",
                alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span className="blink" style={{ width: 6, height: 6, borderRadius: 99, background: "#8FE3A8" }} />
                Live
              </span>
            ) : (
              <button className="tap" onClick={() => setParked(null)}
                style={{ minWidth: 96, border: "none", borderRadius: 99, cursor: "pointer",
                  background: "rgba(143,227,168,.22)", color: "#BFF0CE", padding: "9px 14px",
                  fontSize: 12.5, fontWeight: 700, fontFamily: FONT }}>
                Back to live ›
              </button>
            )}
            <button className="tap" onClick={goNewer} aria-label="Newer line"
              disabled={atLive}
              style={{ width: 40, height: 40, borderRadius: 99, border: "none",
                cursor: atLive ? "default" : "pointer", transform: "scaleX(-1)",
                background: "rgba(255,255,255,.12)", color: "#fff", opacity: atLive ? 0.3 : 0.85,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.back} size={20} sw={2.4} />
            </button>
          </div>
        )}
      </div>

      {/* ONE thing on screen: the current spoken line, a think/note chip, or a peeked past line */}
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "8px 22px 6px", textAlign: "center", gap: 16,
          minHeight: 0, position: "relative" }}>

        {/* history peek */}
        {!atLive && parkedTurn ? (
          <div className="fadeMsg" key={"p" + parked} style={{ width: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", opacity: 0.5, marginBottom: 8 }}>
              EARLIER · {parked + 1} of {speech.length}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em",
              color: parkedTurn.k === "a" ? "#8FE3A8" : "#7CC0FF", marginBottom: 4 }}>
              {parkedTurn.k === "a" ? "YOU" : "RECALL"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.45, opacity: 0.92 }}>
              {parkedTurn.k === "a" ? parkedTurn.t : `“${parkedTurn.t}”`}
            </div>
          </div>
        ) : liveKind === "think" ? (
          <ThinkChip text={cur.t} dark />
        ) : liveKind === "stage" ? (
          <StageChip text={cur.t} dark />
        ) : liveKind === "note" ? (
          <NotedChip text={cur.t} dark />
        ) : liveKind === "confirm" ? (
          <div style={{ opacity: 0.75, fontSize: 15, lineHeight: 1.5, maxWidth: 300 }}>
            One quick check before I save it — just below.
          </div>
        ) : liveKind === "idle" ? (
          <div style={{ fontSize: 15, opacity: 0.6, lineHeight: 1.5 }}>
            Take your time — Recall is listening.<br />Tap <b style={{ opacity: 0.85 }}>Done</b> when you'd like to review.
          </div>
        ) : (
          /* current spoken line — the one caption */
          <div className="fadeMsg" key={"c" + ti} style={{ width: "100%" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
              color: cur.k === "a" ? "#8FE3A8" : "#7CC0FF", marginBottom: 6 }}>
              {cur.k === "a" ? "YOU" : "RECALL"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-.01em" }}>
              {cur.k === "a" ? cur.t : `“${cur.t}”`}
            </div>
            {cur.k === "r" && cur.why && (
              <div style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.62, marginTop: 9,
                maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                Why this question · {cur.why}
              </div>
            )}
          </div>
        )}

        {/* waveform / listening dots — the aliveness cue, one row */}
        <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {atLive && !muted && cur && (cur.k === "r" || cur.k === "a") && !skipCur ? (
            <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 26 }}>
              {[13, 24, 18, 30, 21, 27, 14, 24, 19].map((h, i) => (
                <div key={i} className="wave" style={{ width: 5, height: h, borderRadius: 99,
                  background: cur.k === "a" ? "rgba(143,227,168,.9)" : "rgba(255,255,255,.85)",
                  animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          ) : atLive ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: muted ? 0.4 : 1 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={muted ? "" : "blink"} style={{ width: 7, height: 7, borderRadius: 99,
                  background: "rgba(255,255,255,.5)", animationDelay: `${i * 0.25}s` }} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {waitingConfirm && (
        <div style={{ padding: "0 20px 14px", flexShrink: 0 }}>
          <ConfirmCard cfg={CONFIRMS[cur.c]} onAnswer={(v) => answer(cur.c, v)} />
        </div>
      )}

      <div style={{ padding: "0 34px 34px", display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexShrink: 0 }}>
        <CallButton label="Chat" onClick={() => { setMuted(false); setMode("chat"); }} bg="rgba(255,255,255,.16)">
          <Icon d={icons.chat} size={24} />
        </CallButton>
        {/* Mute, not Pause — the familiar call verb. Recall stops hearing
            you and waits (sleeping eyes); there's nothing else to "pause",
            since a check-in can always be left and continued later. */}
        <CallButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}
          bg={muted ? "rgba(255,204,102,.32)" : "rgba(255,255,255,.16)"}>
          <Icon d={muted ? icons.micOff : icons.mic} size={24} />
        </CallButton>
        <CallButton label="Done" onClick={finish} bg={C.red}>
          <Icon d={icons.phoneEnd} size={26} sw={1.6} />
        </CallButton>
      </div>
      {panels}
    </div>
  );
};

/* Recall thinks before it reviews — nothing is sudden */
const ProcessingOverlay = ({ lines = PROC_LINES }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(v + 1, lines.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 42,
      background: "linear-gradient(180deg, #0B1F3A 0%, #0A2C4F 60%, #093057 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 22, color: "#fff", textAlign: "center", padding: "0 32px" }}>
      <RecallOrb size={96} glow mood="thinking" />
      <div key={i} className="fadeMsg" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.4 }}>
        {lines[i]}
      </div>
      <div style={{ fontSize: 14, opacity: 0.65 }}>A moment — this becomes your review.</div>
    </div>
  );
};

/* What each finalize visibly deposits into the visit brief(s) — realistic
   data points a five-minute talk would yield, per period. Month 1 shows
   how one conversation can feed TWO briefs at once. */
const FINALIZE_BRIEFS = {
  day1: [{ brief: "Dr. Patel — annual physical", when: "July 24", rows: [
    ["pattern", "Knee stiff in the mornings, easing by breakfast — first data point"],
    ["check", "Both pills with breakfast, on time"],
  ]}],
  week1: [{ brief: "Dr. Chen — cardiology", when: "July 30", rows: [
    ["pattern", "Knee follows longer walks — third day, firming up"],
    ["check", "Sleep 7 hours — steadier on walk days"],
  ]}],
  week2: [{ brief: "Dr. Chen — cardiology", when: "tomorrow", rows: [
    ["pattern", "Stairs without stopping halfway — new this week"],
    ["question", "“Should the water pill move to mornings?”"],
  ]}],
  visitday: [{ brief: "Dr. Chen — cardiology", when: "today", rows: [
    ["check", "How you're feeling going in — one line, kept for the visit"],
  ]}],
  month1: [
    { brief: "Dr. Osei — family medicine", when: "Aug 21", rows: [
      ["pattern", "Energy dips after short sleep — second week running"],
    ]},
    { brief: "Eye exam — Dr. Lam", when: "Sept 3", rows: [
      ["check", "Starts collecting Aug 20 — nothing needed from you yet"],
    ]},
  ],
};

/* the entry's opening line, in Amma's own words — each period quotes
   the day it actually had (week2's is her transcript verbatim) */
const FINALIZE_ENTRY = {
  day1: "“A little stiff first thing, fine after — and I took both with breakfast.”",
  week1: "“Better, actually. I held the rail, but I didn't stop halfway this time.”",
  week2: "“Seven hours — best all week. The earlier bedtime helped.”",
  visitday: "“Feeling alright going in. A bit nervous about the numbers.”",
  month1: "“Walked with Sarah, knee fine. Slept eight hours.”",
};

/* ------------------- completion, as moments ------------------------ */
/* The put-away is the one screen in Recall that isn't a working
   surface, so it stops being a scroll. On a full day it becomes paged
   moments — ONE idea per screen, one Continue under the thumb, dots
   for place, swipe both ways — in the fixed order the pipeline
   actually runs: entry · health story · topics · [Recall thinking] ·
   briefs · rhythm. A moment renders only when it has something to
   say, and a day with two or fewer things skips the sequence entirely
   (one screen, one tap). Nothing here is a transaction: everything
   was saved before the first moment, so closing mid-sequence loses
   nothing and swiping back re-reads without un-committing. */

/* one chrome for every moment: dots pinned top, the orb and the idea
   optically centered, the single button under the thumb. Identical
   skeleton everywhere means only the words and the accent change. */
const Moment = ({ i, n, mood, hero, title, caption, children, button, onNext, back }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
    <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "18px 0 2px", flexShrink: 0 }}>
      {Array.from({ length: n }).map((_, d) => (
        <span key={d} style={{ width: d === i ? 18 : 6, height: 6, borderRadius: 99,
          background: d === i ? "#fff" : "rgba(255,255,255,.3)", transition: "width .25s ease" }} />
      ))}
    </div>
    {/* the idea sits in the upper-middle, not dead centre — a lone card
        at true centre reads as unfinished, and the space below it is
        what gives the Continue button its own air */}
    <div key={i} className={back ? "fadeMsg" : "stepIn"}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 15, padding: "8px 20px 15%", overflow: "hidden" }}>
      <div className="orbPulse" style={{ display: "flex", justifyContent: "center", borderRadius: 99 }}>
        {hero || <RecallOrb size={62} glow mood={mood} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.015em", textAlign: "center",
        lineHeight: 1.3, textWrap: "balance" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
      {caption && (
        <div style={{ fontSize: 13.5, lineHeight: 1.5, textAlign: "center", color: "rgba(255,255,255,.62)" }}>
          {caption}
        </div>
      )}
    </div>
    <div style={{ padding: "0 20px 26px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {button || <BigButton tone="glass" onClick={onNext}>Continue</BigButton>}
    </div>
  </div>
);

/* on-glass card — the navy ground is this surface's identity in both
   themes, so the cards are lit from it rather than pasted on it */
const MCard = ({ children, accent, style }) => (
  <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 14, padding: "13px 14px",
    border: "0.5px solid rgba(255,255,255,.16)",
    borderLeft: accent ? `2.5px solid ${accent}` : "0.5px solid rgba(255,255,255,.16)", ...style }}>
    {children}
  </div>
);

/* a "+ something changed" line — green plus, the record's own verb */
const MAdd = ({ children, icon, color = "#7CE49A" }) => (
  <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 15, lineHeight: 1.45 }}>
    <span style={{ color, flexShrink: 0, fontWeight: 800, marginTop: icon ? 1 : 0 }}>
      {icon ? <Icon d={icon} size={16} sw={2.2} /> : "+"}
    </span>
    <span style={{ flex: 1 }}>{children}</span>
  </div>
);

const FinalizeOverlay = ({ period, captured, onDone }) => {
  const st = INSIGHT_STATE[period];
  const target = Math.min(st.filled + 1, 7);
  /* the takeover belongs to the CROSSING — the finalize that earns the
     week. Past five, an extra day is a quieter "richer", not a fanfare. */
  const crossing = st.filled < 5 && target >= 5;
  const beyond = st.filled >= 5;
  const briefs = FINALIZE_BRIEFS[period] || FINALIZE_BRIEFS.week2;
  /* which topics today's talk moved — read from the topics layer itself:
     each seeded story's `moved` line, plus anything she followed at THIS
     review (the proposal answered "Follow it"). Day 1 has none on
     purpose: nothing has a story yet on the first day. */
  const newTopics = captured
    .filter((c) => c.home === "Topics" && c.settled === "done" && c.topicId)
    .map((c) => ({ id: c.topicId, t: c.topicName,
      s: "followed just now — its mentions are already connected" }));
  const topics = [
    ...newTopics,
    ...topicsFor(period).filter((t) => t.moved && !t.proposed)
      .filter((t) => !newTopics.some((n) => n.id === t.id))
      .map((t) => ({ id: t.id, t: t.name, s: t.moved })),
  ];
  /* what changed in the RECORD — confirmed facts only. A question isn't
     a record change (it rides with the brief) and a reminder isn't one
     either (it waits on Today); each is reported where it belongs. */
  const story = captured.filter((c) => ["Meds", "Visits", "Visit history"].includes(c.home));
  const reminders = captured.filter((c) => c.home === "Today");
  const questions = captured.filter((c) => c.home === "brief");
  const docOf = (b) => (b.brief.match(/Dr\.\s+[\w'-]+/) || [b.brief.split("—")[0].trim()])[0];
  const reduced = typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* the adaptive rule: two or fewer things to say → one screen */
  const things = story.length + topics.length + questions.length
    + briefs.reduce((n, b) => n + b.rows.length, 0);
  const sequence = things >= 3;

  /* moments render only when non-empty; the order is the pipeline's */
  const steps = ["entry"];
  if (story.length) steps.push("story");
  if (topics.length) steps.push("topics");
  briefs.forEach((_, bi) => steps.push(`brief${bi}`));
  steps.push("rhythm");
  const firstBrief = steps.findIndex((s) => s.startsWith("brief"));

  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const [beat, setBeat] = useState(false);
  const [ring, setRing] = useState(st.filled);
  const beatDone = useRef(false);  /* the router thinks once — re-reading doesn't re-think */
  const touchX = useRef(null);
  const step = steps[i];

  /* the ring gains its day when the rhythm moment arrives — the one
     number on this surface, and it earns its animation by being late */
  useEffect(() => {
    if (step !== "rhythm" && sequence) return;
    const t = setTimeout(() => setRing(target), reduced ? 0 : 420);
    return () => clearTimeout(t);
  }, [step, sequence]);

  /* the thinking beat: a real pause while the router reads the visits.
     No button, no dot — it's a breath. Reduced motion skips it whole. */
  useEffect(() => {
    if (!beat) return;
    const t = setTimeout(() => { setBeat(false); setI(firstBrief); }, 1500);
    return () => clearTimeout(t);
  }, [beat]);

  const go = (d) => {
    if (beat) return;
    const next = i + d;
    if (next < 0 || next >= steps.length) return;
    setBack(d < 0);
    /* entering the briefs the first time, Recall is seen thinking */
    if (d > 0 && next === firstBrief && !beatDone.current && !reduced) {
      beatDone.current = true; setBeat(true); return;
    }
    setI(next);
  };

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);   /* swipe back re-reads; it never un-commits */
  };

  const entryCard = (
    <MCard>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 99, background: "rgba(124,228,154,.18)",
          color: "#7CE49A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon d={icons.check} size={14} sw={3} />
        </span>
        <span style={{ fontSize: 15.5, fontWeight: 700 }}>Entry written — your words</span>
      </div>
      <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,.74)", marginTop: 8 }}>
        {FINALIZE_ENTRY[period] || FINALIZE_ENTRY.week2}
      </div>
    </MCard>
  );

  /* the ring leads the closing moments — Recall's face steps aside and
     her own rhythm becomes the subject. Colours are set explicitly so
     it reads on the navy (and on the takeover's purple) without a puck. */
  const heroRing = (dark) => (
    <div key={ring} className={ring !== st.filled ? "chipPop" : ""} style={{ display: "flex" }}>
      <InsightRing filled={ring} size={dark ? 82 : 72} showCount={dark}
        on={dark ? "#fff" : "#C79BF7"} off={`rgba(255,255,255,${dark ? ".34" : ".2"})`} ink="#fff" />
    </div>
  );

  const rhythmTitle = beyond
    ? `Day ${target} this week`
    : `Day ${target} of 5`;
  const rhythmSub = beyond
    ? "Saturday's insight is already earned — extra days make it richer."
    : target === 4
    ? "Tomorrow makes five, and Saturday brings back what Recall noticed."
    : `${5 - target} more days and Saturday brings back what Recall noticed.`;

  const ground = crossing && step === "rhythm"
    ? "linear-gradient(160deg, #2A0F45 0%, #5B21A0 55%, #7A2FA3 100%)"
    : "linear-gradient(180deg, #0B1F3A 0%, #0A2C4F 60%, #093057 100%)";

  /* ---- the simple day: nothing routed, nothing moved — one screen ---- */
  if (!sequence) {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 42, background: ground,
        display: "flex", flexDirection: "column", color: "#fff" }}>
        <Moment i={0} n={0} mood="happy" title="Today is put away"
          caption="What didn't come up stays honestly blank."
          button={<BigButton tone="white" onClick={() => onDone()}>Back to Today</BigButton>}>
          {entryCard}
          <MCard>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div key={ring} className={ring !== st.filled ? "chipPop" : ""} style={{ display: "flex" }}>
                <InsightRing filled={ring} size={46} on="#C79BF7" off="rgba(255,255,255,.2)" ink="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700 }}>{rhythmTitle}</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.62)", lineHeight: 1.4, marginTop: 2 }}>
                  {rhythmSub}
                </div>
              </div>
            </div>
          </MCard>
        </Moment>
      </div>
    );
  }

  /* ------------------------- the sequence ---------------------------- */
  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position: "absolute", inset: 0, zIndex: 42, background: ground,
        transition: "background .5s ease", display: "flex", flexDirection: "column", color: "#fff" }}>

      {beat ? (
        /* the thinking beat — the router really is reading your visits,
           and showing it is the difference between magic and competence */
        <div className="fadeMsg" style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 18, padding: "0 34px", textAlign: "center" }}>
          <RecallOrb size={64} glow mood="thinking" />
          <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.45 }}>
            Checking your visits…
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,.6)", marginTop: 6 }}>
              {briefs.map((b) => `${b.when} with ${docOf(b)}`).join(" · ")}
            </div>
          </div>
        </div>
      ) : step === "entry" ? (
        <Moment i={i} n={steps.length} back={back} mood="happy" title="Today is put away"
          caption="What didn't come up stays honestly blank." onNext={() => go(1)}>
          {entryCard}
          {reminders.map((r) => (
            <MAdd key={r.t} icon={icons.scan} color="#8FC3FF">
              Waiting on Today: <b>{r.t.toLowerCase()}</b>
            </MAdd>
          ))}
        </Moment>
      ) : step === "story" ? (
        <Moment i={i} n={steps.length} back={back} mood="calm" onNext={() => go(1)}
          title={`Your health story — ${story.length} update${story.length > 1 ? "s" : ""}`}
          caption="The record changes first — everything after flows from it. Each line lives in Meds or Visits, fixable there any time.">
          <MCard>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {story.map((c) => <MAdd key={c.t}>{c.t}</MAdd>)}
            </div>
          </MCard>
        </Moment>
      ) : step === "topics" ? (
        <Moment i={i} n={steps.length} back={back} mood="calm" onNext={() => go(1)}
          title={topics.length > 1 ? `${topics.length} topics moved` : "One topic moved"}
          caption="Nothing resolves itself — tap one to open its story, or find them all in Journal › Topics.">
          {topics.map((t) => (
            /* each card is a DOOR — tapping ends the put-away on that
               topic's own page (everything was saved before moment one,
               so leaving mid-sequence loses nothing) */
            <div key={t.t} className="tap" onClick={t.id ? () => onDone("topic", t.id) : undefined}
              style={{ cursor: t.id ? "pointer" : "default" }}>
              <MCard accent={C.orange}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 15.5, fontWeight: 700 }}>{t.t}</div>
                  {t.id && (
                    <span style={{ display: "flex", color: "rgba(255,255,255,.5)" }}>
                      <Icon d={icons.chevron} size={13} sw={2.4} />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.62)", lineHeight: 1.45, marginTop: 3 }}>
                  {t.s}
                </div>
              </MCard>
            </div>
          ))}
        </Moment>
      ) : step.startsWith("brief") ? (
        (() => {
          const b = briefs[+step.slice(5)];
          return (
            <Moment i={i} n={steps.length} back={back} mood="happy" onNext={() => go(1)}
              title={`${docOf(b)}'s draft drew from today`}
              caption={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon d={icons.undo} size={14} />adjust anything inside the brief
              </span>}>
              <MCard accent={C.blue}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{b.brief}</span>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", flexShrink: 0 }}>{b.when}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {b.rows.map(([, t], ri) => <MAdd key={ri}>{t}</MAdd>)}
                  {+step.slice(5) === 0 && questions.map((q) => <MAdd key={q.t}>{q.t}</MAdd>)}
                </div>
              </MCard>
            </Moment>
          );
        })()
      ) : crossing ? (
        /* Saturday — the unlock takeover replaces the rhythm moment */
        <Moment i={i} n={steps.length} back={back}
          hero={<span style={{ position: "relative", display: "flex" }}><Burst />{heroRing(true)}</span>}
          title="That's five — Saturday's insight is earned"
          button={<>
            <BigButton tone="white" onClick={() => onDone("insight")}>Read it now</BigButton>
            <button className="tap" onClick={() => onDone()} style={{ border: "none", background: "none",
              color: "rgba(255,255,255,.85)", fontSize: 15.5, fontWeight: 650, cursor: "pointer",
              fontFamily: FONT, padding: "6px 0 2px" }}>
              On Today when you're ready
            </button>
          </>} />
      ) : (
        <Moment i={i} n={steps.length} back={back} hero={heroRing(false)}
          title={rhythmTitle} caption={rhythmSub}
          button={<BigButton tone="white" onClick={() => onDone()}>Back to Today</BigButton>} />
      )}
    </div>
  );
};

/* Guided tour — for whenever someone feels lost */
const TourOverlay = ({ step, onNext, onClose, onRead }) => {
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 58, display: "flex",
      flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,38,.55)" }} onClick={onClose} />
      <div className="sheetIn" style={{ position: "relative", margin: "0 12px 92px", background: C.card,
        borderRadius: 18, padding: 18, boxShadow: "0 14px 40px rgba(0,0,0,.3)" }}>
        <button className="tap" onClick={onClose} aria-label="Close tour"
          style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 99,
            border: "none", background: C.track, color: C.sub, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={13} sw={2.6} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <RecallOrb size={40} mood={last ? "happy" : "calm"} />
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.01em" }}>{s.title}</div>
        </div>
        <div style={{ fontSize: 15.5, lineHeight: 1.55, color: C.ink, marginBottom: 14 }}>{s.body}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="tap" onClick={onRead} style={{ display: "flex", alignItems: "center", gap: 7,
            border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "10px 15px",
            fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
            <Icon d={icons.speaker} size={16} />Read aloud
          </button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 5 }}>
            {TOUR_STEPS.map((_, d) => (
              <div key={d} style={{ width: d === step ? 16 : 6, height: 6, borderRadius: 99,
                background: d === step ? C.blue : C.line, transition: "width .25s" }} />
            ))}
          </div>
          <button className="tap" onClick={onNext} style={{ border: "none", background: C.blue, color: "#fff",
            borderRadius: 99, padding: "10px 18px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------- FAB ----------------------------------- */

const FAB_ACTIONS = {
  checkin: { id: "checkin", label: "Check in", icon: icons.mic },
  visit: { id: "visit", label: "Add or record a visit", icon: icons.visits },
  med: { id: "med", label: "Add a medication", icon: icons.meds },
  doc: { id: "doc", label: "Add a document", icon: icons.scan },
  tour: { id: "tour", label: "Show me around", icon: icons.speaker },
  /* room-scoped (caregiver) */
  carenote: { id: "carenote", label: "Tell Recall about his care", icon: icons.mic },
  roomVisit: { id: "roomVisit", label: "His visits", icon: icons.visits },
  howRoom: { id: "howRoom", label: "How this works", icon: icons.question },
  /* family-scoped */
  suggest: { id: "suggest", label: "Suggest something", icon: icons.plus },
  askUpdate: { id: "askUpdate", label: "Ask how she's doing", icon: icons.chat },
  sendDoc: { id: "sendDoc", label: "Send a document", icon: icons.docs },
  howFam: { id: "howFam", label: "How this works", icon: icons.question },
};

const FAB_ORDER = {
  today: ["checkin", "visit", "med", "doc", "tour"],
  journal: ["checkin", "doc", "visit", "med", "tour"],
  visits: ["visit", "checkin", "doc", "med", "tour"],
  meds: ["med", "checkin", "visit", "doc", "tour"],
  docs: ["doc", "checkin", "visit", "med", "tour"],
  /* rooms: the same face, role-scoped actions, "how" always last */
  room: ["carenote", "med", "roomVisit", "doc", "howRoom"],
  /* the FAB mirrors the room's verbs exactly — a document is a KIND of
     suggestion, not a second door to the same place */
  sarahHome: ["suggest", "askUpdate", "howFam"],
  famRoom: ["suggest", "askUpdate", "howFam"],
};

/* ---------------- orb motion lab — internal design page ------------- */
/* Not a phone screen: a full page. The source of truth for the orb's
   moods, modifiers, sizes and motion tokens — edit the orb, check here. */

const ORB_MOODS = [
  ["calm", "Default resting face — vertical pill eyes with a slow blink.",
    "Everywhere at rest: Today cards, buttons, idle call.", "blinkEyes · 4.6s loop"],
  ["listening", "Eyes stretch taller in a breathing loop — visibly taking you in.",
    "Your turn to speak in a call or check-in.", "eyeBreathe · 1.5s alternate"],
  ["thinking", "Eyes drift up and apart; thought dots rise beside the head.",
    "Memory lookups, writing your entry, staged processing.", "thoughtDot · 2.1s loop"],
  ["happy", "Soft squinted eyes — a smile without needing a mouth.",
    "Warm replies and good news mid-conversation.", "static face · mouth appears when talking"],
  ["delighted", "Arc eyes plus a single gold sparkle.",
    "An insight is ready; proud-of-you moments.", "sparklePop · 1.6s alternate"],
  ["celebrate", "Arc eyes, radiating rays, twin sparkles, a purple-tinted glow.",
    "Finalized day, all doses logged, insight earned.", "rayPulse 1.8s + sparklePop"],
  ["sleeping", "Eyes closed flat — present, not listening.",
    "Muted: Recall can’t hear you and says so.", "static"],
];
const ORB_SIZES = [[18, "menu rows"], [24, "inside CTA buttons"], [40, "cards & sheets"],
  [56, "default"], [86, "call screen"]];
const ORB_TOKENS = [
  ["blinkEyes", "4.6s ease-in-out · infinite", "eyes scale to .12 for a beat", "the calm resting blink"],
  ["eyeBreathe", "1.5s ease-in-out · alternate", "eyes scale up to 1.16", "listening — attention you can see"],
  ["thoughtDot", "2.1s ease-in-out · infinite", "3 dots fade in, rise, fade out", "thinking beside the head"],
  ["sideArc", "1s ease-in-out · alternate", "sound arcs pulse beside the face", "talking modifier"],
  ["sparklePop", "1.6s ease-in-out · alternate", "sparkle scales .75→1.15 with a tilt", "delighted & celebrate"],
  ["rayPulse", "1.8s ease-in-out · alternate", "8 rays breathe around the orb", "celebrate only"],
];

const OrbLabPage = ({ onBack }) => {
  const darkTile = { background: "linear-gradient(180deg, #0B1F3A, #0A2C4F)", borderRadius: 14,
    padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 };
  const labLabel = { fontSize: 12, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: C.ter };
  return (
    <div className="scroll" style={{ position: "fixed", inset: 0, zIndex: 100, overflowY: "auto",
      background: C.canvas, fontFamily: FONT, color: C.ink }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>
        <button className="tap" onClick={onBack} style={{ border: "none", background: "none", color: C.blue,
          fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, display: "flex",
          alignItems: "center", gap: 4, padding: "6px 0", marginBottom: 8 }}>
          <Icon d={icons.back} size={19} sw={2.4} />Back to the prototype
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <RecallOrb size={54} mood="happy" />
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>The Recall orb</div>
            <div style={{ fontSize: 15, color: C.sub, marginTop: 2 }}>
              Motion & personality system — the source of truth for every state the orb can be in.
            </div>
          </div>
        </div>

        <div style={{ ...labLabel, margin: "30px 2px 10px" }}>Moods — one at a time, never blended</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {ORB_MOODS.map(([mood, what, where, motion]) => (
            <div key={mood} style={{ background: C.card, borderRadius: 14, padding: 16,
              boxShadow: "0 0 0 0.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 14px" }}>
                <RecallOrb size={64} mood={mood} />
              </div>
              <div style={{ fontSize: 16.5, fontWeight: 700, textTransform: "capitalize" }}>{mood}</div>
              <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, marginTop: 4 }}>{what}</div>
              <div style={{ fontSize: 12.5, color: C.ter, lineHeight: 1.45, marginTop: 8 }}>
                <b style={{ color: C.sub }}>Used:</b> {where}
              </div>
              <div style={{ display: "inline-block", fontSize: 11.5, fontWeight: 600, color: C.blue,
                background: C.blueSoft, borderRadius: 6, padding: "3px 8px", marginTop: 9 }}>{motion}</div>
            </div>
          ))}
        </div>

        <div style={{ ...labLabel, margin: "30px 2px 10px" }}>Modifiers — compose onto any mood</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            ["talking", <RecallOrb key="t" size={64} mood="calm" talking />,
              "Sound arcs pulse beside the face; happy & delighted also gain a mouth. Recall is speaking."],
            ["talking + happy", <RecallOrb key="th" size={64} mood="happy" talking />,
              "The warmest speaking state — used for good-news lines in calls."],
            ["glow", <div key="g" style={darkTile}><RecallOrb size={64} glow mood="listening" /></div>,
              "A deeper drop shadow for dark screens — call, assembly, rewards."],
            ["glow + celebrate", <div key="gc" style={darkTile}><RecallOrb size={64} glow mood="celebrate" /></div>,
              "The biggest moment the orb has: finalize on the navy reward screen."],
          ].map(([name, node, blurb]) => (
            <div key={name} style={{ background: C.card, borderRadius: 14, padding: 16,
              boxShadow: "0 0 0 0.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 14px" }}>{node}</div>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, marginTop: 4 }}>{blurb}</div>
            </div>
          ))}
        </div>

        <div style={{ ...labLabel, margin: "30px 2px 10px" }}>Sizes — where each lives</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "22px 16px 14px",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.04)",
          display: "flex", alignItems: "flex-end", justifyContent: "space-around", flexWrap: "wrap", gap: 18 }}>
          {ORB_SIZES.map(([sz, where]) => (
            <div key={sz} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <RecallOrb size={sz} />
              <div style={{ fontSize: 13, fontWeight: 700 }}>{sz}px</div>
              <div style={{ fontSize: 12, color: C.ter }}>{where}</div>
            </div>
          ))}
        </div>

        <div style={{ ...labLabel, margin: "30px 2px 10px" }}>Motion tokens</div>
        <div style={{ background: C.card, borderRadius: 14, padding: "4px 16px",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.04)" }}>
          {ORB_TOKENS.map(([name, timing, moves, why], i) => (
            <div key={name} style={{ display: "flex", gap: 14, padding: "13px 0", alignItems: "baseline",
              flexWrap: "wrap", borderBottom: i === ORB_TOKENS.length - 1 ? "none" : `0.5px solid ${C.line}` }}>
              <code style={{ fontSize: 13.5, fontWeight: 700, color: C.blue, minWidth: 96 }}>{name}</code>
              <span style={{ fontSize: 13, color: C.sub, minWidth: 180 }}>{timing}</span>
              <span style={{ fontSize: 13.5, flex: 1, minWidth: 200 }}>{moves} — <span style={{ color: C.sub }}>{why}</span></span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.6, padding: "14px 4px 0" }}>
          Principles: one mood at a time, modifiers compose on top, transitions are cuts (the face changes,
          the orb never morphs), and <code>prefers-reduced-motion</code> stops every loop. The orb is the only
          character in the product — nothing else in the UI has a face or a pulse.
        </div>
      </div>
    </div>
  );
};

/* ------------------------- onboarding flow ------------------------- */
/* Ported from the standalone onboarding prototype and restyled to this
   app's system (C palette, BigButton, Card, Sheet, RecallOrb). Launched
   from the ••• preview menu. The prototype's closing "Today" mock is
   intentionally NOT ported — finishing lands on the real Day 1 Today. */

const OB_LANGS = [
  { code: "en", native: "English", latin: "English" },
  { code: "fr", native: "Français", latin: "French" },
  { code: "es", native: "Español", latin: "Spanish" },
  { code: "hi", native: "हिन्दी", latin: "Hindi" },
  { code: "ar", native: "العربية", latin: "Arabic" },
  { code: "de", native: "Deutsch", latin: "German" },
  { code: "pt", native: "Português", latin: "Portuguese" },
  { code: "ta", native: "தமிழ்", latin: "Tamil" },
  { code: "zh", native: "中文", latin: "Chinese" },
  { code: "ja", native: "日本語", latin: "Japanese" },
  { code: "ko", native: "한국어", latin: "Korean" },
  { code: "it", native: "Italiano", latin: "Italian" },
  { code: "nl", native: "Nederlands", latin: "Dutch" },
  { code: "ru", native: "Русский", latin: "Russian" },
  { code: "tr", native: "Türkçe", latin: "Turkish" },
  { code: "vi", native: "Tiếng Việt", latin: "Vietnamese" },
  { code: "pl", native: "Polski", latin: "Polish" },
  { code: "uk", native: "Українська", latin: "Ukrainian" },
  { code: "fa", native: "فارسی", latin: "Persian" },
  { code: "ur", native: "اردو", latin: "Urdu" },
  { code: "bn", native: "বাংলা", latin: "Bengali" },
  { code: "pa", native: "ਪੰਜਾਬੀ", latin: "Punjabi" },
  { code: "te", native: "తెలుగు", latin: "Telugu" },
  { code: "ml", native: "മലയാളം", latin: "Malayalam" },
  { code: "kn", native: "ಕನ್ನಡ", latin: "Kannada" },
  { code: "gu", native: "ગુજરાતી", latin: "Gujarati" },
  { code: "mr", native: "मराठी", latin: "Marathi" },
  { code: "el", native: "Ελληνικά", latin: "Greek" },
  { code: "sv", native: "Svenska", latin: "Swedish" },
  { code: "ro", native: "Română", latin: "Romanian" },
  { code: "th", native: "ไทย", latin: "Thai" },
  { code: "tl", native: "Filipino", latin: "Filipino" },
  { code: "sw", native: "Kiswahili", latin: "Swahili" },
  { code: "he", native: "עברית", latin: "Hebrew" },
];
/* device language + region — what a real build would put on top */
const OB_SUGGESTED = ["en", "fr", "ta", "hi", "es"];
/* native brief samples for the translation demo; languages without one
   fall back honestly (English sample, labeled as such) */
const OB_TRANS = {
  fr: "« Céphalées à prédominance matinale. Sommeil réduit à ~5 h. »",
  es: "«Cefaleas de predominio matutino. Sueño reducido a ~5 h.»",
  de: "„Kopfschmerzen vorwiegend morgens. Schlaf auf ~5 Std. reduziert.“",
  en: "“Morning-predominant headaches. Sleep reduced to ~5 h.”",
};
const OB_MED_CORPUS = ["Metformin", "Amlodipine", "Sertraline", "Atorvastatin", "Levothyroxine",
  "Ramipril", "Bisoprolol", "Omeprazole", "Paracetamol", "Aspirin"];
/* the allergy corpus feeds AUTOCOMPLETE, never preset chips — two drug
   names shown as buttons assume the answer; helping someone spell the
   name they're already saying assumes nothing */
const OB_ALLERGY_CORPUS = ["Penicillin", "Amoxicillin", "Sulfa antibiotics", "Aspirin",
  "Ibuprofen", "Codeine", "Morphine", "Latex", "Iodine contrast dye"];
/* language comes FIRST — it dictates the language of everything after it.
   (No backend in this preview, so the flow stays in English regardless.)
   Personalization (assembly) comes LAST, so entering Today feels made-for-you. */
/* one ask per screen (round 27): fit=year, sex, safety=allergies and
   region are four screens now — each fits the viewport, each carries
   one decision. A longer flow of light screens beats a short flow of
   heavy ones for this audience. */
const OB_STEPS = ["splash", "lang", "intro", "k1", "k2", "k3", "k4", "role", "promise", "carePlan",
  "careWho", "careHas", "careRole", "careWorry", "careCall", "careInvite",
  "name", "voice", "fit", "sex", "safety", "region", "medsAsk", "medsAdd", "shelf", "precall", "call",
  "receipt", "confirm", "visits", "clinicLang", "twoLang", "trial", "assembly"];
/* supporter-only track — someone here to help, not to journal.
   careWorry and careCall run only on the not-yet path: the worry is why
   she came, and the setup CALL is how their person starts — their
   ordinary phone, no app to hunt for; the app arrives already theirs. */
const OB_CARE = ["careWho", "careHas", "careRole", "careWorry", "careCall", "careInvite"];
/* the worry chips — plain family language, never clinical */
const OB_WORRIES = ["The stairs — their knees", "Whether they're eating properly",
  "Pills on time", "Sleeping badly"];
const OB_SLOTS = ["Tomorrow, 9:15 AM", "Tomorrow afternoon", "Saturday morning"];
/* the splash asks Recall's one real question, cycling through its
   languages — it's the product in a sentence, and it sets up the
   "what language do you think in?" screen that follows */
const OB_ASKS = ["How are you feeling today?", "Comment vous sentez-vous ?", "இன்று எப்படி இருக்கிறீர்கள்?",
  "¿Cómo te sientes hoy?", "आज आप कैसे हैं?", "Wie fühlen Sie sich heute?", "Como você está hoje?"];
const OB_SETUP = ["role", "promise", "name", "voice", "fit", "sex", "safety", "region", "medsAsk",
  "medsAdd", "shelf", "precall", "receipt", "confirm", "visits", "clinicLang", "twoLang", "trial"];
/* the birth-year wheel — same control as the reminder times; 1948 is the
   resting index only because the wheel must rest somewhere */
const OB_YEARS = Array.from({ length: 71 }, (_, i) => String(1930 + i));
/* the first check-in uses the SAME turn grammar as the app's CallOverlay:
   r = Recall speaks · a = you speak · think = visible thinking · note =
   captured quietly · confirm = blocking tap (names & dates are never
   saved from voice alone — exactly like the app) */
/* the first check-in reads like a real one: greet by name, keep the cabinet
   promise if a medication was added, then how-you've-been, then the catch.
   {name} is filled at render — nothing is hardcoded to the demo persona. */
const OB_CALL_TURNS = [
  { k: "r", t: "Hello, {name}. This first one is easy — how has today been?" },
  { k: "a", t: "Not bad. My head aches a little in the mornings, and I slept about five hours.", short: "Headaches in the mornings" },
  { k: "note", t: "Noted — headache · mornings ✓ sleep · 5 hrs ✓" },
  { k: "r", t: "Saved, in your own words. Anything coming up I should get ready for?" },
  { k: "a", t: "I’m seeing my heart doctor Thursday — Dr. Dubois. Oh — could the new tablet be causing my headaches?", short: "Heart doctor on Thursday" },
  { k: "think", t: "A new appointment heard — checking the name…" },
  { k: "confirm" },
  { k: "r", t: "Kept for your review — and your tablet question is pinned for Thursday. Keep going if you like, or tap Done. Even this much is a real first day." },
];
/* with a medication in the cabinet, Recall keeps its promise immediately */
const OB_CALL_TURNS_MED = [
  OB_CALL_TURNS[0],
  { k: "a", t: "Not bad. My head aches a little in the mornings, and I slept about five hours.", short: "Headaches in the mornings" },
  { k: "note", t: "Noted — headache · mornings ✓ sleep · 5 hrs ✓" },
  { k: "r", t: "And I see {med} in your cabinet — did it happen today?" },
  { k: "a", t: "Yes — with dinner, like always.", short: "Yes, with dinner" },
  { k: "note", t: "{med} · evenings, with food ✓" },
  ...OB_CALL_TURNS.slice(3),
];
const OB_CONFIRM = {
  title: "Dr. Dubois — heart — Thursday 30 July?",
  sub: "Names and dates are easy to mishear. Nothing is added until you tap yes.",
  yes: "That’s right", no: "I misspoke",
};
const OB_RESUME_TURNS = [
  { k: "r", t: "We can fix anything — just say it. What should today remember differently?" },
];
const OB_TEACH = {
  k1: { no: 1, title: "We talk for a minute a day.",
    body: "I ask, you answer out loud. No forms, no typing — I listen for what a doctor would ask about.",
    kind: "checkin", cta: "Continue" },
  k2: { no: 2, title: "I keep every word.",
    body: "Each talk becomes an entry you can read back any time.",
    kind: "list", rows: [
      ["AN ENTRY", "“Knee hurt going up the stairs”", 0, 0],
      ["ONE BEFORE THAT", "“Dizzy when I stood up too fast”", 0, 0],
      ["A WEEK EARLIER", "“Forgot the evening tablet twice”", 0, 0]], cta: "Continue" },
  k3: { no: 3, title: "Then I connect the dots.",
    body: "Things you’d never spot alone, because they build over months:",
    kind: "list", rows: [
      ["WEEK 1", "A few entries — nothing to say yet", 1, 0],
      ["WEEK 4", "Dizziness keeps landing on hot days", 3, 0],
      ["MONTH 3", "“Worse in the heat” — that’s a pattern", 6, 1]], cta: "Continue" },
  k4: { no: 4, title: "Before a visit, I write you a page.",
    body: "One page for the doctor, in their language — not yours.",
    kind: "brief", cta: "Get started" },
};
const OB_TRIAL_DAYS = 14;
const OB_TIMES = ["7:00 am", "7:30 am", "8:00 am", "8:30 am", "6:00 pm", "6:30 pm", "7:00 pm",
  "7:30 pm", "8:00 pm", "8:30 pm", "9:00 pm", "9:30 pm", "10:00 pm"];

/* pronunciation respelling — what Recall heard, written so it can be
   checked at a glance. Syllables split on vowel groups, the stressed one
   in caps, long vowels spelled out the way a dictionary respelling would. */
const obFirstName = (name) => (name || "").trim().split(/\s+/)[0] || "";
const obPhonetic = (name) => {
  const w = obFirstName(name).toLowerCase();
  if (!w) return "";
  const parts = w.match(/[^aeiou]*[aeiou]+(?:[^aeiou](?![aeiou]))?/g) || [w];
  const stress = parts.length > 1 ? 1 : 0;
  return parts.map((p, i) => (i === stress
    ? p.replace(/i/g, "ee").replace(/u/g, "oo").toUpperCase()
    : p)).join("-");
};

const ObLabel = ({ children, style }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
    color: C.ter, ...style }}>{children}</div>
);
const ObHead = ({ children, center, style, className }) => (
  <div className={className} style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.25,
    color: C.ink, textAlign: center ? "center" : "left", ...style }}>{children}</div>
);
const ObSub = ({ children, center, style, className }) => (
  <div className={className} style={{ fontSize: 15.5, color: C.sub, lineHeight: 1.5,
    textAlign: center ? "center" : "left", ...style }}>{children}</div>
);
const ObLink = ({ children, onClick, color = C.blue }) => (
  <button className="tap" onClick={onClick} style={{ border: "none", background: "none", color,
    fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT, minHeight: 48,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
    {children}
  </button>
);
const ObEditRow = ({ label, value, strong, onClick, last }) => (
  <div className="tap" role="button" onClick={onClick} style={{ display: "flex", alignItems: "center",
    gap: 12, padding: "13px 0", cursor: "pointer", borderBottom: last ? "none" : `0.5px solid ${C.line}` }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <ObLabel>{label}</ObLabel>
      <div style={{ fontSize: 16, color: C.ink, marginTop: 4, lineHeight: 1.4, fontWeight: strong ? 600 : 400 }}>
        {value}
      </div>
    </div>
    <Icon d={icons.pencil} size={16} color={C.ter} sw={2.2} />
  </div>
);
const ObDialog = ({ title, body, deny, allow, onDeny, onAllow }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(10,11,15,.42)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 34px" }}>
    <div className="sheetIn" style={{ width: "100%", background: C.card, borderRadius: 18,
      padding: "22px 20px 0", boxShadow: "0 26px 60px -14px rgba(0,0,0,.5)" }}>
      <div style={{ textAlign: "center", fontSize: 17.5, fontWeight: 700, color: C.ink, lineHeight: 1.35 }}>{title}</div>
      <div style={{ textAlign: "center", fontSize: 14.5, color: C.sub, lineHeight: 1.45,
        marginTop: 9, paddingBottom: 18 }}>{body}</div>
      <div style={{ height: 0.5, background: C.line, margin: "0 -20px" }} />
      <div style={{ display: "flex", margin: "0 -20px" }}>
        <button className="tap" onClick={onDeny} style={{ flex: 1, height: 50, border: "none", background: "none",
          fontSize: 17, color: C.blue, cursor: "pointer", fontFamily: FONT, borderRight: `0.5px solid ${C.line}` }}>
          {deny}
        </button>
        <button className="tap" onClick={onAllow} style={{ flex: 1, height: 50, border: "none", background: "none",
          fontSize: 17, fontWeight: 700, color: C.blue, cursor: "pointer", fontFamily: FONT }}>
          {allow}
        </button>
      </div>
    </div>
  </div>
);

/* an iOS-style wheel: scroll-snap column, the middle band is the value */
const ObWheel = ({ options, index, onChange }) => {
  const ref = useRef(null);
  const ROW = 44;
  useEffect(() => { if (ref.current) ref.current.scrollTop = index * ROW; }, []);
  const settle = () => {
    const i = Math.max(0, Math.min(options.length - 1, Math.round(ref.current.scrollTop / ROW)));
    if (i !== index) onChange(i);
  };
  return (
    <div style={{ position: "relative", height: ROW * 3 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: ROW, height: ROW, borderRadius: 11,
        background: C.track, pointerEvents: "none" }} />
      <div ref={ref} onScroll={settle} className="scroll" style={{ height: ROW * 3, overflowY: "auto",
        scrollSnapType: "y mandatory", position: "relative" }}>
        <div style={{ height: ROW }} />
        {options.map((o, i) => (
          <div key={o} className="tap" role="button"
            onClick={() => ref.current.scrollTo({ top: i * ROW, behavior: "smooth" })}
            style={{ height: ROW, display: "flex", alignItems: "center", justifyContent: "center",
              scrollSnapAlign: "center", fontSize: 18, cursor: "pointer",
              fontWeight: i === index ? 700 : 400, color: i === index ? C.ink : C.ter,
              fontVariantNumeric: "tabular-nums" }}>
            {o}
          </div>
        ))}
        <div style={{ height: ROW }} />
      </div>
    </div>
  );
};

const OnboardingOverlay = ({ onExit, onFinish }) => {
  const fresh = {
    step: 0, typedMode: false, name: "", playing: false, hello: 0, splash: 0, role: "mine",
    bornIdx: 18, sex: "", pron: "", allergies: [], noAllergy: false, allergyAdd: false,
    allergyDraft: "", regionOk: true, region: "Québec", regionPicking: false,
    muted: false, clinicSearch: "",
    who: "", hasProfile: null, careRole: "family", worries: [], callSlot: "",
    main: "en", langSearch: "", meds: [], medDraft: "", scanning: false,
    watching: ["Headaches", "Sleep"],
    voice: "idle", recSecs: 0, ti: 0, apptAns: null, script: "main",
    answers: {}, typedDraft: "", callSecs: 0,
    facts: { headache: "Worse in the mornings", sleep: "About 5 hours" },
    question: "Could the new tablet be causing my headaches?",
    /* clinic language arrives pre-filled from the region (Québec → French)
       — a stated default to correct, never a cold quiz */
    appt: { doctor: "Dr. Dubois", date: "Thursday 30 July", reason: "Follow-up · headaches", lang: "fr" },
    extra: [], reminder: "evening", customIdx: 11, sheet: null, editKey: null, editMeta: null,
    sheetDraft: "", addDraft: { who: "", day: 0, lang: "en", reason: "" },
    dateTarget: "appt", pickedDay: 30, ticks: 0,
  };
  const [s, setS] = useState(fresh);
  const up = (patch) => setS((p) => ({ ...p, ...(typeof patch === "function" ? patch(p) : patch) }));
  const n = OB_STEPS[s.step];

  const timers = useRef([]);
  const recIv = useRef(null);
  const clearT = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => { clearT(); if (recIv.current) clearInterval(recIv.current); }, []);

  const turns = s.script === "resume" ? OB_RESUME_TURNS
    : s.meds.length ? OB_CALL_TURNS_MED : OB_CALL_TURNS;
  const cur = n === "call" ? turns[s.ti] : null;
  /* scripts speak to THIS user — name & medication fill in at render */
  const obLine = (t) => t
    .replace("{name}", obFirstName(s.name) || "there")
    .replace("{med}", shortMedName(s.meds[0] || "your medication"));
  const waitingConfirm = !!(cur && cur.k === "confirm" && !s.apptAns);

  /* the conversation plays itself — same rules as the app's CallOverlay:
     a blocking confirm pauses it; in the chat skin your turns wait for you */
  useEffect(() => {
    if (n === "call") {
      if (!cur || waitingConfirm) return;
      /* muted = Recall can't hear you; the talk waits — same rule as the
         app's call */
      if (!s.typedMode && s.muted) return;
      if (s.typedMode && cur.k === "a" && !s.answers[s.ti]) return;
      const t = setTimeout(() => up((p) => ({ ti: p.ti + 1 })),
        cur.k === "confirm" ? 700 : cur.k === "a" && s.answers[s.ti] ? 300 : turnDur(cur));
      return () => clearTimeout(t);
    }
    if (n === "visits") {
      /* the landing is HER tap now (round 27) — a beat she triggers is a
         beat she can't miss; a timer fills the page while she's reading */
      clearT();
      up({ ticks: 0 });
      return clearT;
    }
    if (n === "assembly") {
      clearT();
      up({ ticks: 0 });
      [500, 1050, 1600, 2200, 2900].forEach((ms, i) =>
        timers.current.push(setTimeout(() => up({ ticks: i + 1 }), ms)));
      return clearT;
    }
  }, [n, s.ti, s.typedMode, s.apptAns, s.answers, s.script, s.muted]);
  useEffect(() => {
    if (n !== "call" || s.typedMode) return;
    const iv = setInterval(() => up((p) => ({ callSecs: p.callSecs + 1 })), 1000);
    return () => clearInterval(iv);
  }, [n, s.typedMode]);
  /* the splash is choreography: eyes fill the screen → the world zooms out
     to the orb → the wordmark lands → the question starts cycling → CTA */
  useEffect(() => {
    if (n !== "splash") return;
    const ts = [setTimeout(() => up({ splash: 1 }), 1150), setTimeout(() => up({ splash: 2 }), 1750),
      setTimeout(() => up({ splash: 3 }), 2400)];
    const iv = setInterval(() => up((p) => ({ hello: p.hello + 1 })), 2100);
    return () => { ts.forEach(clearTimeout); clearInterval(iv); };
  }, [n]);

  const go = (name) => up({ step: OB_STEPS.indexOf(name), sheet: null });
  const medsDone = () => (s.meds.length ? go("shelf") : go("precall"));
  const next = () => {
    if (n === "precall") return up({ sheet: "mic" });
    if (n === "receipt") return up({ sheet: "tomorrow" });
    if (n === "medsAdd") return medsDone();
    if (n === "trial") return go("assembly");
    /* the owner exit carries the session's own facts — day 1's receipt
       reads back THIS setup, not a canned one */
    if (n === "assembly") return onFinish(s.role, {
      name: obFirstName(s.name) || "you", pron: s.pron,
      born: OB_YEARS[s.bornIdx], sex: s.sex, region: s.region,
      allergies: s.allergies, noAllergy: s.noAllergy,
      meds: s.meds, lang: langName(s.main), clinicLang: clinicName,
      reminderLine: s.reminder === "none"
        ? "No reminders — you said so; change it any time"
        : `One nudge at ${reminderShort} — never more`,
    });
    if (n === "careInvite") return onFinish(s.hasProfile ? "care" : "care-call");
    /* the promise stands at the threshold for every role — after it,
       the paths part exactly where the role cards used to part them */
    if (n === "promise") return go(s.role === "mine" ? "name" : s.role === "both" ? "carePlan" : "careWho");
    /* already on Recall → the request card is the whole vehicle; the
       worry and the call belong to the not-yet path only */
    if (n === "careRole" && s.hasProfile) return go("careInvite");
    up((p) => ({ step: Math.min(OB_STEPS.length - 1, p.step + 1), sheet: null }));
  };
  const back = () => {
    if (n === "medsAdd") return go("medsAsk");
    if (n === "receipt") return go("precall");
    if (n === "promise") return go("role");
    if (n === "careWho") return go("promise");
    if (n === "careInvite" && s.hasProfile) return go("careRole");
    if (n === "name") return go(s.role === "both" ? "carePlan" : "promise");
    up((p) => ({ step: Math.max(0, p.step - 1), sheet: null, voice: n === "voice" ? "idle" : p.voice }));
  };
  /* a small toggle chip — 44pt floor, same everywhere it appears */
  const obChip = (t, on, onTap) => (
    <button key={t} className="tap" onClick={onTap} style={{ border: "none", borderRadius: 99,
      padding: "10px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
      minHeight: 44, background: on ? C.blue : C.card, color: on ? "#fff" : C.ink,
      boxShadow: on ? "none" : "0 0 0 0.5px rgba(0,0,0,.1)" }}>{t}</button>
  );
  /* a full-width answer card — for a screen that asks exactly one
     question, the answers are the screen: big, stacked, one per line */
  const obChoice = (t, on, onTap) => (
    <button key={t} className="tap" onClick={onTap} style={{ border: "none", borderRadius: 14,
      width: "100%", minHeight: 56, padding: "15px 17px", fontSize: 16.5, fontWeight: 650,
      cursor: "pointer", fontFamily: FONT, textAlign: "left", display: "flex",
      alignItems: "center", gap: 12, background: C.card, color: C.ink,
      boxShadow: on ? `0 0 0 2px ${C.blue}, 0 0 0 6px rgba(0,122,255,.12)` : "0 0 0 0.5px rgba(0,0,0,.1)" }}>
      <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
        background: on ? C.blue : "transparent", border: on ? "none" : `2px solid ${C.line}`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
      </span>
      {t}
    </button>
  );

  const startRec = () => {
    up({ voice: "rec", recSecs: 0 });
    recIv.current = setInterval(() => up((p) => {
      if (p.recSecs >= 4) { clearInterval(recIv.current); recIv.current = null; return { voice: "done" }; }
      return { recSecs: p.recSecs + 1 };
    }), 700);
  };
  const stopRec = () => {
    if (recIv.current) { clearInterval(recIv.current); recIv.current = null; }
    up({ voice: "done" });
  };
  /* Recall says the name back — the orb talks for the length of the clip */
  const playBack = () => {
    up({ playing: true });
    timers.current.push(setTimeout(() => up({ playing: false }), 1700));
  };

  const allowMic = () => { clearT(); up((p) => ({ typedMode: false, sheet: null,
    ti: p.script === "resume" ? p.ti : 0, callSecs: 0, step: OB_STEPS.indexOf("call") })); };
  const startTyped = () => { clearT(); up({ typedMode: true, sheet: null, step: OB_STEPS.indexOf("call") }); };
  const resumeCall = () => { clearT(); up({ script: "resume", ti: 0, typedMode: false, apptAns: s.apptAns,
    sheet: null, step: OB_STEPS.indexOf("call") }); };
  const sendTyped = (text) => up((p) => {
    const t = turns[p.ti];
    if (!t || t.k !== "a") return { typedDraft: "" };
    return { typedDraft: "", answers: { ...p.answers, [p.ti]: text } };
  });

  const openEdit = (key, title, value, heard, quick, removable, pickOnly) =>
    up({ sheet: "edit", editKey: key, sheetDraft: value, editMeta: { title, heard, quick, removable, pickOnly } });
  const saveSheet = () => up((p) => {
    const k = p.editKey, v = p.sheetDraft.trim();
    const st = { sheet: null, editKey: null };
    if (k === "headache" || k === "sleep") st.facts = { ...p.facts, [k]: v };
    else if (k === "question") st.question = v;
    else if (k === "who") st.appt = { ...p.appt, doctor: v };
    else if (k === "reason") st.appt = { ...p.appt, reason: v };
    else if (k === "watch") st.watching = v ? [...p.watching, v] : p.watching;
    else if (k === "date") st.appt = { ...p.appt, date: dayLabel(p.pickedDay) };
    return st;
  });
  const removeRow = () => up((p) => {
    const k = p.editKey, st = { sheet: null, editKey: null };
    if (k === "headache" || k === "sleep") st.facts = { ...p.facts, [k]: "" };
    if (k === "question") st.question = "";
    return st;
  });
  const editWho = () => openEdit("who", "Who are you seeing?", s.appt.doctor, "", [], false);

  const dayLabel = (d) => ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday"][(d - 1) % 7] + " " + d + " July";

  const langName = (c) => (OB_LANGS.find((l) => l.code === c) || OB_LANGS[0]).native;
  const medSug = s.medDraft.trim().length >= 2
    ? OB_MED_CORPUS.filter((m) => m.toLowerCase().startsWith(s.medDraft.trim().toLowerCase()) && !s.meds.includes(m)).slice(0, 3)
    : [];
  const allergySug = s.allergyDraft.trim().length >= 2
    ? OB_ALLERGY_CORPUS.filter((m) => m.toLowerCase().startsWith(s.allergyDraft.trim().toLowerCase()) && !s.allergies.includes(m)).slice(0, 3)
    : [];
  const addAllergy = (name) => {
    const v = (name || "").trim();
    if (!v) return;
    up((p) => ({ allergies: p.allergies.includes(v) ? p.allergies : [...p.allergies, v],
      noAllergy: false, allergyDraft: "" }));
  };
  const setupIdx = OB_SETUP.indexOf(n);
  const careIdx = OB_CARE.indexOf(n);
  const progPct = careIdx >= 0 ? Math.round(((careIdx + 1) / OB_CARE.length) * 100)
    : setupIdx >= 0 ? Math.round(((setupIdx + 1) / OB_SETUP.length) * 100) : 0;
  const teach = OB_TEACH[n];
  /* the clinic-language pick is skippable, so every reader of this name
     needs the same fallback the translation already uses — French, never
     a dash pretending to be a language */
  const clinicName = langName(s.appt.lang || "fr");
  const journalLine = [s.facts.headache, s.facts.sleep].filter(Boolean).join(", ").toLowerCase();
  const mm = (secs) => Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
  const shownTurns = turns.slice(0, s.ti + (cur && (cur.k !== "a" || s.answers[s.ti]) ? 1 : 0));
  const replyChip = s.typedMode && cur && cur.k === "a" && !s.answers[s.ti] ? cur : null;
  const callDone = n === "call" && s.ti >= turns.length;
  const reminderShort = s.reminder === "morning" ? "8:00 am"
    : s.reminder === "custom" ? OB_TIMES[s.customIdx] : "9:30 pm";
  const meta = s.editMeta || {};

  const weeks = (() => {
    const out = []; let row = [null, null];
    for (let d = 1; d <= 31; d++) { row.push(d); if (row.length === 7) { out.push(row); row = []; } }
    while (row.length && row.length < 7) row.push(null);
    if (row.length) out.push(row);
    return out;
  })();

  /* the primary CTA carries its own sticky footer: when a screen fits,
     it rests at the bottom like before; when content runs long, the
     button PINS to the visible edge and the content scrolls beneath a
     soft scrim — the way through is never below the fold. */
  const primary = (label, onClick, disabled) => (
    <div style={{ position: "sticky", bottom: 0, marginTop: "auto", flexShrink: 0,
      padding: "14px 0 10px", background: `linear-gradient(180deg, rgba(242,243,247,0), ${C.bg} 38%)` }}>
      <button className="tap" onClick={onClick} style={{ width: "100%", minHeight: 54, borderRadius: 13,
        border: "none", background: disabled ? "#DCE0EA" : C.blue, color: disabled ? C.ter : "#fff",
        fontSize: 17.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        {label}
      </button>
    </div>
  );

  /* ---------------- the splash — pure choreography ------------------ */
  /* The liveliest screen in the app, and the least informational: you
     start INSIDE the orb (two breathing eyes filling the screen), the
     world zooms out to reveal the face, the wordmark lands, then Recall's
     one real question cycles through its languages. Nothing to read at
     any single moment — the story arrives one beat at a time. */
  if (n === "splash") {
    const ask = OB_ASKS[s.hello % OB_ASKS.length];
    /* every beat's space is reserved from frame one — beats BREATHE into
       place with opacity + a small rise, and the layout never shifts */
    const beat = (on) => ({ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(14px) scale(.97)",
      transition: "opacity .65s ease, transform .65s cubic-bezier(.2,.7,.3,1)",
      pointerEvents: on ? "auto" : "none" });
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 60, background: C.bg, fontFamily: FONT,
        color: C.ink, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* the whole screen starts Recall-blue, then the color recedes into
            the orb as the world zooms out — blue pops to white */}
        <div className="splashBg" style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(140% 120% at 50% 40%, #2E93FF 0%, #007AFF 55%, #0058C7 100%)" }} />

        <button className="tap" onClick={onExit} aria-label="Exit onboarding preview"
          style={{ position: "absolute", top: 12, right: 14, zIndex: 5, width: 28, height: 28,
            borderRadius: 99, border: "none", background: "rgba(120,125,140,.18)", color: C.sub,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.close} size={13} sw={2.8} />
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", position: "relative" }}>
          {/* beat 1 — the zoom-out: eyes → face, blue → white behind it */}
          <div className="splashField" style={{ width: 118, height: 118, borderRadius: "50%",
            background: "radial-gradient(circle at 32% 28%, #66B2FF 0%, #007AFF 55%, #0058C7 100%)",
            boxShadow: "0 10px 34px rgba(0,122,255,.4), inset 0 -4px 10px rgba(0,0,0,.14)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 15, flexShrink: 0 }}>
            <span className="splashEye" style={{ width: 23, height: 46, borderRadius: 99, background: "#fff" }} />
            <span className="splashEye" style={{ width: 23, height: 46, borderRadius: 99, background: "#fff",
              animationDelay: ".18s" }} />
          </div>
          {/* beat 2 — name + promise together: the who and the why,
              one visual block, top of the text hierarchy */}
          <div style={{ textAlign: "center", marginTop: 22, ...beat(s.splash >= 1) }}>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-.03em",
              height: 48, lineHeight: "48px" }}>
              Recall
            </div>
            <div style={{ fontSize: 16.5, fontWeight: 500, color: C.sub, lineHeight: 1.4,
              marginTop: 6, padding: "0 34px" }}>
              Your health story, always with you.
            </div>
          </div>
          {/* beat 3 — what living with it feels like: one little question a
              day, in whichever language is yours */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
            marginTop: 40, padding: "0 30px", ...beat(s.splash >= 2) }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".09em",
              textTransform: "uppercase", color: C.ter }}>
              Every day, in your language
            </div>
            <div style={{ height: 52, display: "flex", alignItems: "center" }}>
              {s.splash >= 2 && (
                <div key={ask} className="fadeMsg" style={{ fontSize: 18, color: C.sub,
                  textAlign: "center", lineHeight: 1.4 }}>
                  “{ask}”
                </div>
              )}
            </div>
          </div>
        </div>

        {/* beat 4 — the door in */}
        <div style={{ padding: "0 20px 22px", flexShrink: 0, ...beat(s.splash >= 3) }}>
          {primary("Get started", next)}
        </div>
      </div>
    );
  }

  /* ------- dark screens: the first live check-in & assembly --------- */
  /* the call skin mirrors the app's CallOverlay: one caption at a time,
     the orb front and center, and a blocking confirm for the appointment —
     names are never saved from voice alone, here or in the app */
  if (n === "call" && !s.typedMode) {
    const mood = s.muted ? "sleeping"
      : !cur ? "calm" : cur.k === "think" ? "thinking" : cur.k === "a" ? "listening" : (cur.mood || "calm");
    const talking = !s.muted && cur && cur.k === "r";
    const status = s.muted ? "muted — Recall can’t hear you; the talk waits"
      : !cur ? "listening — tap Done to review"
      : cur.k === "r" ? "Recall is speaking" : cur.k === "a" ? "listening to you"
      : cur.k === "think" ? "thinking…" : cur.k === "confirm" ? "waiting for your tap" : "listening";
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 60,
        background: "linear-gradient(180deg, #0B1F3A 0%, #0A2C4F 55%, #093057 100%)",
        display: "flex", flexDirection: "column", color: "#fff", fontFamily: FONT }}>
        <div style={{ textAlign: "center", paddingTop: 30, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RecallOrb size={86} glow mood={mood} talking={talking} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, letterSpacing: "-.01em" }}>Recall</div>
          <div style={{ fontSize: 15, opacity: 0.75, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{mm(s.callSecs)}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8,
            background: "rgba(255,255,255,.12)", borderRadius: 99, padding: "6px 13px", fontSize: 13 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: C.green }} />
            your first check-in · captions on
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>{status}</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "8px 22px 6px", textAlign: "center", gap: 16, minHeight: 0 }}>
          {!cur ? (
            <div style={{ fontSize: 15, opacity: 0.6, lineHeight: 1.5 }}>
              {s.script === "resume"
                ? <>Recall is listening — say what to fix or add.<br />
                    Tap <b style={{ opacity: 0.85 }}>Done</b> to go back to the review.</>
                : <>That’s everything I needed for today.<br />
                    Tap <b style={{ opacity: 0.85 }}>Done</b> to see what I heard.</>}
            </div>
          ) : cur.k === "think" ? (
            <ThinkChip text={obLine(cur.t)} dark />
          ) : cur.k === "note" ? (
            <NotedChip text={obLine(cur.t)} dark />
          ) : cur.k === "confirm" ? (
            /* the card says everything — a caption here just fought it
               for space and lost (they overlapped on short screens) */
            null
          ) : (
            <div className="fadeMsg" key={"c" + s.ti} style={{ width: "100%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
                color: cur.k === "a" ? "#8FE3A8" : "#7CC0FF", marginBottom: 6 }}>
                {cur.k === "a" ? "YOU" : "RECALL"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4, letterSpacing: "-.01em" }}>
                {cur.k === "a" ? obLine(cur.t) : `“${obLine(cur.t)}”`}
              </div>
            </div>
          )}
          <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {cur && (cur.k === "r" || cur.k === "a") && (
              <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 26 }}>
                {[13, 24, 18, 30, 21, 27, 14, 24, 19].map((h, i) => (
                  <div key={i} className="wave" style={{ width: 5, height: h, borderRadius: 99,
                    background: cur.k === "a" ? "rgba(143,227,168,.9)" : "rgba(255,255,255,.85)",
                    animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {waitingConfirm && (
          <div style={{ padding: "0 20px 14px", flexShrink: 0 }}>
            <ConfirmCard cfg={OB_CONFIRM} onAnswer={(v) => up({ apptAns: v })} />
          </div>
        )}

        {/* the same three verbs as the app's call — Chat, Mute, Done —
            so the first call teaches the controls every later call has */}
        <div style={{ padding: "0 28px 34px", display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexShrink: 0 }}>
          <CallButton label="Chat" onClick={startTyped} bg="rgba(255,255,255,.16)">
            <Icon d={icons.chat} size={24} />
          </CallButton>
          <CallButton label={s.muted ? "Unmute" : "Mute"} onClick={() => up((p) => ({ muted: !p.muted }))}
            bg={s.muted ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.16)"}>
            <Icon d={s.muted ? icons.micOff : icons.mic} size={24} />
          </CallButton>
          <CallButton label="Done" onClick={() => { clearT(); go("receipt"); }} bg={C.red}>
            <Icon d={icons.phoneEnd} size={26} sw={1.6} />
          </CallButton>
        </div>
      </div>
    );
  }

  if (n === "assembly") {
    /* long lists stay one line: name up to two allergies, count the rest —
       the receipt page holds the full list, the ticker only proves it */
    const alg = s.allergies.map((a) => a.toLowerCase());
    const algLine = alg.length === 0 ? ""
      : " · " + alg.slice(0, 2).join(", ") + (alg.length > 2 ? ` +${alg.length - 2} more` : "") + " noted";
    const rows = [
      "Saying your name as " + (obPhonetic(s.name) || "you say it"),
      "Fitting questions to you — born " + OB_YEARS[s.bornIdx]
        + (s.regionOk ? ` · ${s.region}` : "") + algLine,
      "Watching " + (s.watching.join(", ") || "nothing yet"),
      (s.meds.length || "No") + (s.meds.length === 1 ? " medication" : " medications") + " in your cabinet",
      "Starting " + s.appt.doctor + "’s page — in " + clinicName,
    ];
    return (
      /* rows scroll; the header and the way out never do. This screen used
         to clip with no scroll — a tall list could push "Open your Recall"
         clean off the phone, unreachable. */
      <div style={{ position: "absolute", inset: 0, zIndex: 60,
        background: "linear-gradient(180deg, #0B1F3A 0%, #0A2C4F 55%, #093057 100%)",
        display: "flex", flexDirection: "column", color: "#fff", fontFamily: FONT, padding: "0 22px" }}>
        <div style={{ height: 34, flexShrink: 0 }} />
        <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <RecallOrb size={72} glow mood={s.ticks >= 5 ? "celebrate" : "thinking"} />
        </div>
        <div style={{ textAlign: "center", fontSize: 23, fontWeight: 700, letterSpacing: "-.01em",
          marginTop: 14, flexShrink: 0 }}>
          {s.ticks >= 5 ? "Your Recall is ready." : "Making it yours…"}
        </div>
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 9, marginTop: 18, paddingBottom: 6 }}>
          {rows.map((t, i) => {
            const done = s.ticks > i;
            return (
              <div key={i} style={{ background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "12px 15px",
                display: "flex", alignItems: "center", gap: 13, opacity: done ? 1 : 0.45,
                flexShrink: 0, transition: "opacity .32s ease" }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                  background: done ? "rgba(143,227,168,.2)" : "transparent",
                  border: done ? "none" : "2px solid rgba(255,255,255,.4)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done && <Icon d={icons.check} size={13} sw={3.2} color="#8FE3A8" />}
                </span>
                <span style={{ fontSize: 15.5, lineHeight: 1.4 }}>{t}</span>
              </div>
            );
          })}
        </div>
        <div style={{ flexShrink: 0 }}>
          {s.ticks >= 5 && <div className="stepIn"><BigButton tone="white" onClick={next}>Open your Recall</BigButton></div>}
          <div style={{ textAlign: "center", fontSize: 13.5, opacity: 0.55, lineHeight: 1.5, padding: "12px 0 22px" }}>
            All of it is yours — export or delete any time.
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- light screens share one chrome ------------------ */
  const body = (() => {
    /* language comes first — everything after renders in it, so the whole
       flow is understood. The proven picker pattern: search on top (assume
       hundreds of languages), a Suggested section from device & region,
       the full alphabetical list below, and a sticky CTA that always
       carries the current choice — never buried under the list. */
    if (n === "lang") {
      const q = s.langSearch.trim().toLowerCase();
      const match = (l) => !q || l.native.toLowerCase().includes(q) || l.latin.toLowerCase().includes(q);
      const suggested = OB_SUGGESTED.map((c) => OB_LANGS.find((l) => l.code === c)).filter(match);
      const all = [...OB_LANGS].sort((a, b) => a.latin.localeCompare(b.latin)).filter(match);
      const row = (l, i, len) => {
        const on = s.main === l.code;
        return (
          <div key={l.code} className="tap" role="button" onClick={() => up({ main: l.code })}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", cursor: "pointer",
              borderBottom: i === len - 1 ? "none" : `0.5px solid ${C.line}` }}>
            <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
              background: on ? C.blue : "transparent", border: on ? "none" : `2px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
            </span>
            <span style={{ flex: 1, fontSize: 16.5, fontWeight: on ? 700 : 600 }}>{l.native}</span>
            <span style={{ fontSize: 14, color: C.ter }}>{l.latin}</span>
          </div>
        );
      };
      return (
        <>
          <ObHead style={{ marginTop: 8 }}>What language do you think in?</ObHead>
          <ObSub style={{ marginTop: 6, fontSize: 14.5 }}>
            We’ll talk in it, and I’ll write in it.
          </ObSub>
          <div style={{ background: C.card, borderRadius: 12, height: 46, display: "flex", alignItems: "center",
            gap: 10, padding: "0 14px", marginTop: 14, flexShrink: 0, boxShadow: "0 0 0 0.5px rgba(0,0,0,.08)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ter} strokeWidth="2.4"
              strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input value={s.langSearch} onChange={(e) => up({ langSearch: e.target.value })}
              placeholder="Search languages" style={{ flex: 1, fontSize: 16, color: C.ink, border: "none",
                outline: "none", background: "none", fontFamily: FONT, minWidth: 0 }} />
            {!!q && (
              <button className="tap" onClick={() => up({ langSearch: "" })} aria-label="Clear search"
                style={{ border: "none", background: C.track, color: C.sub, width: 24, height: 24,
                  borderRadius: 99, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.close} size={11} sw={3} />
              </button>
            )}
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, marginTop: 12,
            paddingBottom: 6 }}>
            {!q && suggested.length > 0 && (
              <>
                <ObLabel>Suggested — from your device & region</ObLabel>
                <Card style={{ margin: "8px 0 14px", padding: "2px 16px" }}>
                  {suggested.map((l, i) => row(l, i, suggested.length))}
                </Card>
              </>
            )}
            <ObLabel>{q ? "Matches" : "All languages"}</ObLabel>
            {all.length > 0 ? (
              <Card style={{ marginTop: 8, padding: "2px 16px" }}>
                {all.map((l, i) => row(l, i, all.length))}
              </Card>
            ) : (
              <div style={{ fontSize: 14.5, color: C.ter, padding: "14px 4px" }}>
                No matches — try the English name of the language.
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, padding: "10px 0 6px", boxShadow: `0 -12px 12px -12px rgba(0,0,0,.12)` }}>
            {primary(`Continue in ${langName(s.main)}`, next)}
            <div style={{ fontSize: 12.5, color: C.ter, textAlign: "center", paddingTop: 8 }}>
              This preview stays in English
            </div>
          </div>
        </>
      );
    }

    if (n === "intro") return (
      <>
        <div style={{ height: 40 }} />
        <div className="stepIn" style={{ display: "flex", justifyContent: "center" }}>
          <RecallOrb size={96} mood="listening" />
        </div>
        <ObHead center className="stepIn" style={{ fontSize: 28, marginTop: 28 }}>
          Make the most of your next appointment.
        </ObHead>
        <ObSub center style={{ fontSize: 16.5, marginTop: 14 }}>
          Between visits, I keep your health story — so when you see the doctor, nothing is missing.
        </ObSub>
        <div style={{ flex: 1 }} />
        {primary("Show me how it works", next)}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0 10px" }}>
          <Icon d={icons.lock} size={13} color={C.ter} sw={2.2} />
          <span style={{ fontSize: 12.5, color: C.ter }}>Your words stay yours — never sold, never shared without you.</span>
        </div>
      </>
    );

    if (teach) return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
          <button className="tap" onClick={back} aria-label="Back" style={{ border: "none", background: "none",
            color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", padding: "6px 6px 6px 0" }}>
            <Icon d={icons.back} size={22} sw={2.4} />
          </button>
          <ObLabel>Step {teach.no} of 4</ObLabel>
          <div style={{ width: 30 }} />
        </div>
        <ObHead style={{ marginTop: 12 }}>{teach.title}</ObHead>
        <ObSub style={{ marginTop: 6 }}>{teach.body}</ObSub>

        {teach.kind === "checkin" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 15, marginTop: 24 }}>
            <div className="stepIn" style={{ animationDelay: ".1s" }}><RecallOrb size={80} mood="calm" talking /></div>
            <div className="stepIn" style={{ animationDelay: ".55s", background: C.card,
              borderRadius: "18px 18px 18px 7px", padding: "14px 16px",
              boxShadow: "0 8px 22px -10px rgba(0,0,0,.16)" }}>
              <ObLabel>I ask</ObLabel>
              <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.45, marginTop: 5 }}>“How have you been this week?”</div>
            </div>
            <div className="stepIn" style={{ animationDelay: "1.1s", display: "flex",
              alignItems: "flex-end", gap: 5, height: 36 }}>
              {[36, 22, 30, 38, 26, 34, 20].map((h, i) => (
                <div key={i} className="wave" style={{ width: 5, height: h, borderRadius: 99,
                  background: i % 2 ? "#69ABFF" : C.blue, animationDelay: `${i * 0.11}s` }} />
              ))}
            </div>
            <span className="stepIn" style={{ animationDelay: "1.35s", fontSize: 14, color: C.ter }}>
              you answer · about a minute
            </span>
          </div>
        )}

        {teach.kind === "list" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", color: C.sub,
                background: C.track, borderRadius: 6, padding: "4px 8px" }}>EXAMPLE</span>
            </div>
            {/* the story ARRIVES, row by row — entries stack, the count grows,
                the trail fills, and only then does the pattern turn green */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 7 }}>
              {teach.rows.map(([label, text, count, hot], ri) => (
                <div key={label} className="stepIn" style={{ animationDelay: `${0.25 + ri * 0.55}s` }}>
                <Card style={hot ? { boxShadow: `0 0 0 1.5px ${C.green}` } : undefined}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ObLabel style={{ color: hot ? C.greenInk : C.ter, flex: 1 }}>{label}</ObLabel>
                    {count > 0 && (
                      <span className="chipPop" style={{ animationDelay: `${0.65 + ri * 0.55}s`,
                        fontSize: 12, fontWeight: 700, borderRadius: 99, padding: "3px 9px",
                        background: hot ? C.greenSoft : C.bg, color: hot ? C.greenInk : C.sub }}>
                        seen ×{count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 16, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>{text}</div>
                  {count > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 9 }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={i < count ? "chipPop" : ""}
                          style={{ width: 16, height: 5, borderRadius: 99,
                            animationDelay: `${0.55 + ri * 0.55 + i * 0.09}s`,
                            background: i < count ? (hot ? C.green : "#B9C4F2") : C.track }} />
                      ))}
                    </div>
                  )}
                </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {teach.kind === "brief" && (
          <Card style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Icon d={icons.docs} size={17} color={C.blue} sw={2} />
              <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>For your heart doctor · next Thursday</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", color: C.sub,
                background: C.bg, borderRadius: 6, padding: "4px 8px" }}>EXAMPLE</span>
            </div>
            <FullDivider />
            {/* the sketch mirrors the REAL brief's anatomy and order —
                reason first (SOAP's chief complaint), questions kept,
                never "pinned on top" of a document that leads with why
                you're there. Teaching one order and shipping another
                would be a small lie the user meets on visit day. */}
            {[["The reason for the visit — first", true],
              ["What changed since last time", false],
              ["The patterns I found", false],
              ["Medications, as actually taken", false],
              ["Your questions — never forgotten", false]].map(([t, hot], ri) => (
              <div key={t} className="stepIn" style={{ animationDelay: `${0.35 + ri * 0.3}s`,
                display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0" }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, marginTop: 7, flexShrink: 0,
                  background: hot ? C.blue : C.line }} />
                <span style={{ fontSize: 15, lineHeight: 1.45, color: hot ? C.ink : C.sub, fontWeight: hot ? 600 : 400 }}>{t}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.greenInk, background: C.greenSoft,
                borderRadius: 99, padding: "6px 11px" }}>reads in 90 seconds</span>
            </div>
          </Card>
        )}
        <div style={{ flex: 1 }} />
        {primary(teach.cta, next)}
      </>
    );

    /* every setup screen: back + progress + optional skip */
    const setupBar = (
      <div style={{ display: "flex", alignItems: "center", gap: 14, height: 44 }}>
        <button className="tap" onClick={back} aria-label="Back" style={{ border: "none", background: "none",
          color: C.blue, cursor: "pointer", display: "flex", alignItems: "center", padding: "6px 6px 6px 0" }}>
          <Icon d={icons.back} size={22} sw={2.4} />
        </button>
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: C.line, overflow: "hidden" }}>
          <div style={{ height: 4, borderRadius: 99, background: C.blue, width: `${progPct}%`,
            transition: "width .32s ease" }} />
        </div>
        <div style={{ width: 30 }} />
      </div>
    );

    if (n === "role") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>Whose health should I look after?</ObHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
          {[["Mine", "Just my own health.", C.blueSoft, C.blue, "Y", "mine"],
            ["Someone I care for", "A parent, a partner — with their say-so.", C.purpleSoft, C.purple, "A", "care"],
            ["Both of ours", "Mine and theirs, side by side.", C.greenSoft, C.greenInk, "+", "both"]].map(([t, b, bg, ink, ch, id]) => (
            <Card key={t} onClick={() => { up({ role: id }); go("promise"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 99, background: bg, color: ink, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>{ch}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17.5, fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.4, marginTop: 2 }}>{b}</div>
                </div>
                <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
              </div>
            </Card>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 6px 12px" }}>
          You can change this later.
        </div>
      </>
    );

    /* caregiving is consent-first — the same room model the app runs on.
       No pretending we can set up someone else's memory from here. */
    if (n === "carePlan") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>
          {s.role === "both" ? "Two Recalls, side by side." : "Their Recall stays theirs."}
        </ObHead>
        <ObSub style={{ marginTop: 8 }}>
          Nobody can set up someone else’s memory — that’s the point. Helping works in three steps:
        </ObSub>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
          {[["Set up your side today", "Everything you’re about to do is yours."],
            ["Invite them, from your profile", "The invite says exactly what you could see."],
            ["Their yes opens a room", "Their meds, visits and updates — only what they allow. Never their journal."]].map(([t, b], ri) => (
            <div key={t} className="stepIn" style={{ animationDelay: `${0.2 + ri * 0.28}s` }}>
            <Card style={{ padding: "13px 15px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 26, height: 26, borderRadius: 99, background: C.blueSoft, color: C.blue,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13.5, fontWeight: 700 }}>{ri + 1}</span>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.45, marginTop: 2 }}>{b}</div>
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {primary("Got it — set up mine first", () => go("name"))}
      </>
    );

    /* ---------- supporter-only track: here to help, not to journal ----
       Picking "Someone I care for" never forces a personal setup — that
       stays available later, from the supporter home. Two real cases:
       they already use Recall (send a request into their circle) or they
       don't yet (set it up together, on THEIR phone — it must be their
       voice). Role decides authority: family suggests, caregiver acts. */
    if (n === "careWho") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>Who are you helping?</ObHead>
        <ObSub style={{ marginTop: 8 }}>You won’t need a journal of your own — this stays about them.</ObSub>
        <ObLabel style={{ marginTop: 20 }}>Their name</ObLabel>
        <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, height: 56,
          display: "flex", alignItems: "center", padding: "0 16px", marginTop: 7,
          boxShadow: "0 0 0 4px rgba(0,122,255,.12)" }}>
          <input value={s.who} onChange={(e) => up({ who: e.target.value })} placeholder="Appa, Mum, Mr. Osei…"
            style={{ flex: 1, fontSize: 19, fontWeight: 600, color: C.ink, border: "none", outline: "none",
              background: "none", fontFamily: FONT, minWidth: 0 }} />
        </div>
        <ObLabel style={{ marginTop: 16 }}>Your name — how they’ll see you</ObLabel>
        <div style={{ background: C.card, borderRadius: 14, height: 52, display: "flex", alignItems: "center",
          padding: "0 16px", marginTop: 7, boxShadow: "0 0 0 0.5px rgba(0,0,0,.1)" }}>
          <input value={s.name} onChange={(e) => up({ name: e.target.value })} placeholder="Your name"
            style={{ flex: 1, fontSize: 17, fontWeight: 600, color: C.ink, border: "none", outline: "none",
              background: "none", fontFamily: FONT, minWidth: 0 }} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 10px" }}>
          Want your own Recall someday? It’s one tap from your profile — whenever, or never.
        </div>
        <div style={{ paddingBottom: 10 }}>
          {primary("Continue", () => s.who.trim() && s.name.trim() && next(), !(s.who.trim() && s.name.trim()))}
        </div>
      </>
    );

    if (n === "careHas") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>Does {obFirstName(s.who) || "your person"} use Recall?</ObHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
          {[[true, "Yes — they already have it", "You’ll send a request into their circle. They approve it from their phone."],
            [false, "Not yet", "You’ll set it up together, on their phone — Recall has to learn their voice, not yours."]].map(([v, t, b]) => {
            const on = s.hasProfile === v;
            return (
              <Card key={t} onClick={() => { up({ hasProfile: v }); next(); }}
                style={on ? { boxShadow: `0 0 0 2px ${C.blue}` } : undefined}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.45, marginTop: 3 }}>{b}</div>
                  </div>
                  <Icon d={icons.chevron} size={16} color={C.ter} sw={2.2} />
                </div>
              </Card>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
      </>
    );

    if (n === "careRole") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>How much should you be able to do?</ObHead>
        <ObSub style={{ marginTop: 8 }}>{obFirstName(s.who) || "They"} can change this later — it’s their circle.</ObSub>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {[["family", "Family member", "You suggest, they decide.",
              ["Send requests and ideas — each one waits for their yes", "See what they choose to share with you"]],
            ["caregiver", "Caregiver", "You act, they can undo.",
              ["Log doses, move med times, file papers for them", "Every change is marked as yours — and reversible by them"]]].map(([id, t, tag, rows]) => {
            const on = s.careRole === id;
            return (
              <Card key={id} onClick={() => up({ careRole: id })}
                style={on ? { boxShadow: `0 0 0 2px ${C.blue}` } : undefined}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                    background: on ? C.blue : "transparent", border: on ? "none" : `2px solid ${C.line}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{t}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, background: C.blueSoft,
                    borderRadius: 99, padding: "4px 10px", marginLeft: "auto", whiteSpace: "nowrap" }}>{tag}</span>
                </div>
                {rows.map((r) => (
                  <div key={r} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 8, paddingLeft: 2 }}>
                    <span style={{ color: C.green, flexShrink: 0, marginTop: 2 }}><Icon d={icons.check} size={14} sw={2.8} /></span>
                    <span style={{ fontSize: 14, color: C.sub, lineHeight: 1.45 }}>{r}</span>
                  </div>
                ))}
              </Card>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 10px" }}>
          Either way, their journal is never visible to you.
        </div>
        {primary("Continue", next)}
      </>
    );

    /* the worry is WHY she's here — every caregiving signup starts with a
       specific fear, not a feature list. It's asked in her words, and
       answered with the product's one promise: it reaches their person
       AS HERS, out loud, on the call — never behind their back, never a
       report card. Nothing here touches the other record. */
    if (n === "careWorry") {
      const who = obFirstName(s.who) || "them";
      const flip = (w) => up({ worries: s.worries.includes(w)
        ? s.worries.filter((x) => x !== w) : [...s.worries, w] });
      return (
        <>
          {setupBar}
          <ObHead style={{ marginTop: 16 }}>What's been on your mind about {who}?</ObHead>
          <ObSub style={{ marginTop: 8 }}>
            Pick what's close — Recall raises it gently on the setup call, as coming from you.
            Out loud, with {who} there. Never behind their back.
          </ObSub>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            {OB_WORRIES.map((w) => {
              const on = s.worries.includes(w);
              return (
                <button key={w} className="tap" onClick={() => flip(w)} style={{
                  border: "none", cursor: "pointer", fontFamily: FONT, minHeight: 48,
                  padding: "12px 16px", borderRadius: 13, fontSize: 15.5, fontWeight: 600,
                  background: on ? C.blueSoft : C.card, color: on ? C.blue : C.ink,
                  boxShadow: on ? `0 0 0 2px ${C.blue}` : "0 0 0 0.5px rgba(0,0,0,.1)" }}>
                  {w}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 10px" }}>
            Nothing you pick enters {who}'s record — they'll hear it and answer in their own
            words. You'll see what they share, never a report card.
          </div>
          <div style={{ paddingBottom: 10 }}>
            {primary(s.worries.length ? "Continue" : "Nothing specific — just closer", next)}
          </div>
        </>
      );
    }

    /* the setup call is the product's answer to "how does my mother get
       an app?" — she doesn't, today. Recall calls BOTH of them; an
       ordinary phone is enough; the app arrives afterwards, already
       hers. Sarah's job shrinks to picking a time. */
    if (n === "careCall") {
      const who = obFirstName(s.who) || "them";
      return (
        <>
          {setupBar}
          <ObHead style={{ marginTop: 16 }}>One call sets it all up.</ObHead>
          <ObSub style={{ marginTop: 8 }}>
            Recall calls you and {who} together. Their regular phone is enough — nothing to
            install, no account, no passwords. About twenty minutes, out loud: {who} talks,
            Recall listens, you check the spellings.
          </ObSub>
          <ObLabel style={{ marginTop: 20 }}>A time that suits you both</ObLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {OB_SLOTS.map((slot) => {
              const on = s.callSlot === slot;
              return (
                <Card key={slot} onClick={() => up({ callSlot: slot })}
                  style={on ? { boxShadow: `0 0 0 2px ${C.blue}` } : undefined}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 28 }}>
                    <span style={{ fontSize: 16.5, fontWeight: 700, flex: 1 }}>{slot}</span>
                    {on && <Icon d={icons.check} size={17} sw={2.8} color={C.blue} />}
                  </div>
                </Card>
              );
            })}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 10px" }}>
            In the same room instead? The call runs on speaker between you — same twenty minutes.
            Everything is read back to {who} before it's kept, and their app arrives already theirs.
          </div>
          {primary("Continue", () => s.callSlot && next(), !s.callSlot)}
        </>
      );
    }

    if (n === "careInvite") {
      const who = obFirstName(s.who) || "them";
      const roleName = s.careRole === "caregiver" ? "caregiver" : "family member";
      return (
        <>
          {setupBar}
          {s.hasProfile ? (
            <>
              <ObHead style={{ marginTop: 16 }}>Ask to join {who}’s circle.</ObHead>
              <ObSub style={{ marginTop: 8 }}>They see exactly this card — nothing happens until they tap yes.</ObSub>
              <div style={{ border: `1.5px dashed ${C.dash}`, borderRadius: 16, padding: 14,
                background: C.bg, marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ter }}>
                  REQUEST · FROM {(s.name.trim() || "you").toUpperCase()}
                </div>
                <div style={{ fontSize: 17.5, fontWeight: 700, letterSpacing: "-.01em", marginTop: 7, lineHeight: 1.35 }}>
                  {s.name.trim() || "Someone"} asks to help as your {roleName}
                </div>
                <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginTop: 6 }}>
                  {s.careRole === "caregiver"
                    ? "Could log doses, adjust medication times and file papers — every change marked and undoable by you."
                    : "Could send you requests and ideas — each one waits for your yes."}
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 12, opacity: 0.55, pointerEvents: "none" }}>
                  <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.blue, color: "#fff",
                    fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Approve</div>
                  <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.track, color: C.ink,
                    fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Not now</div>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              {primary("Send the request", next)}
            </>
          ) : (
            <>
              <ObHead style={{ marginTop: 16 }}>{who} gets a text — not a task.</ObHead>
              <ObSub style={{ marginTop: 8 }}>
                Exactly this, nothing else. The time can move if it's wrong — nothing about
                {" "}{who} is stored until they say things themselves, on the call.
              </ObSub>
              {/* trust through symmetry — the same dashed-preview grammar as
                  requests: the sender sees exactly what the receiver gets */}
              <div style={{ border: `1.5px dashed ${C.dash}`, borderRadius: 16, padding: 14,
                background: C.bg, marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", color: C.ter }}>
                  TEXT MESSAGE · FROM {(s.name.trim() || "you").toUpperCase()}
                </div>
                <div style={{ fontSize: 17.5, fontWeight: 700, letterSpacing: "-.01em", marginTop: 7, lineHeight: 1.35 }}>
                  {s.name.trim() || "Someone"} set aside {s.callSlot || "a time"} for the two of
                  you and Recall
                </div>
                <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, marginTop: 6 }}>
                  One phone call sets up your Recall — your own phone, nothing to install,
                  and everything read back to you before it's kept. {s.name.trim() || "They"}'ll
                  be on the line too.
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 12, opacity: 0.55, pointerEvents: "none" }}>
                  <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.blue, color: "#fff",
                    fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Sounds good</div>
                  <div style={{ flex: 1, minHeight: 42, borderRadius: 12, background: C.track, color: C.ink,
                    fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Another time</div>
                </div>
              </div>
              {s.worries.length > 0 && (
                <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, padding: "12px 4px 0" }}>
                  Riding along, in your words: <b>“{s.worries[0]}”</b>
                  {s.worries.length > 1 && <> and {s.worries.length - 1} more</>} — raised on the
                  call as yours, kept only if {who} says so.
                </div>
              )}
              <div style={{ flex: 1 }} />
              {primary("Send the invitation", next)}
            </>
          )}
        </>
      );
    }

    /* the threshold promise — BEFORE anything personal is asked. Not a
       consent wall to scroll past: three walls in plain words, the same
       ones the app's "Who can see what" page keeps standing. Explain
       before you ask — the one privacy pattern that survives being read. */
    if (n === "promise") return (
      <>
        {setupBar}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: C.blueSoft, color: C.blue,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.lock} size={26} sw={1.8} />
          </div>
        </div>
        <ObHead center style={{ marginTop: 12 }}>Before you tell me anything.</ObHead>
        {/* three walls, one short line each — a promise read in a breath
            beats a promise skimmed. The full text lives in the app. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {[["Your words stay yours", "Locked on your phone like a banking app — never sold.", icons.lock],
            ["Nothing is shared unless you say so", "Every share is checked with you first. “No one” is a fine answer.", icons.person],
            ["You can leave whole", "Export or delete everything, any day.", icons.docs]].map(([t, b, ic], ri) => (
            <div key={t} className="stepIn" style={{ animationDelay: `${0.15 + ri * 0.22}s` }}>
              <Card style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, color: C.blue,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon d={ic} size={16} sw={2} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.35 }}>{t}</div>
                    <div style={{ fontSize: 13.5, color: C.sub, marginTop: 3, lineHeight: 1.45 }}>{b}</div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, textAlign: "center", padding: "0 8px 12px" }}>
          The whole promise lives in the app — “Who can see what,” always.
        </div>
        {primary("That works for me", next)}
      </>
    );

    if (n === "name") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 16 }}>What should I call you?</ObHead>
        <ObSub style={{ marginTop: 8 }}>The name your doctor’s office uses.</ObSub>
        <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, height: 58,
          display: "flex", alignItems: "center", padding: "0 16px", marginTop: 20,
          boxShadow: "0 0 0 4px rgba(0,122,255,.12)" }}>
          <input value={s.name} onChange={(e) => up({ name: e.target.value })} placeholder="Your name"
            style={{ flex: 1, fontSize: 20, fontWeight: 600, color: C.ink, border: "none", outline: "none",
              background: "none", fontFamily: FONT, minWidth: 0 }} />
        </div>
        {/* pronouns ride with the name — the respect axis, never required.
            Tap again to clear; medicine's facts live two screens later. */}
        <ObLabel style={{ marginTop: 18 }}>How I speak of you — optional</ObLabel>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {["she/her", "he/him", "they/them"].map((p) =>
            obChip(p, s.pron === p, () => up({ pron: s.pron === p ? "" : p })))}
        </div>
        <div style={{ fontSize: 13, color: C.ter, marginTop: 7, lineHeight: 1.45 }}>
          Only for how I speak of you to others — skip freely, change any time.
        </div>
        <div style={{ flex: 1 }} />
        {primary("Continue", () => s.name.trim() && next(), !s.name.trim())}
      </>
    );

    /* the safety floor, one breath per screen (round 27): year, sex,
       allergies, region — each its own page, each fitting the viewport.
       The wheel over typing: it's the control this audience already
       knows from every iOS alarm and birthday field, it can't be
       mistyped, and four digits on a keyboard is the worse trade. */
    if (n === "fit") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14 }}>The year you were born.</ObHead>
        <ObSub style={{ marginTop: 7 }}>
          A knee at 78 is a different question than a knee at 40.
        </ObSub>
        <Card style={{ marginTop: 18 }}>
          <ObWheel options={OB_YEARS} index={s.bornIdx} onChange={(i) => up({ bornIdx: i })} />
        </Card>
        <div style={{ flex: 1 }} />
        {primary("Continue", next)}
      </>
    );

    /* one question, two big answers, and the out below them — a link,
       never a third option. The boundary line lives here because this
       is the screen it protects. */
    if (n === "sex") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14 }}>Sex — for medicine only.</ObHead>
        <ObSub style={{ marginTop: 7 }}>
          Some symptoms wear a different face in women than in men.
        </ObSub>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {["Female", "Male"].map((t) => obChoice(t, s.sex === t, () => up({ sex: t })))}
        </div>
        <ObLink color={C.sub} onClick={() => { up({ sex: "unsaid" }); go("safety"); }}>
          Prefer not to say
        </ObLink>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "0 4px 12px" }}>
          Only you ever see this — it lives in “About your health.”
        </div>
        {primary("Continue", () => s.sex && next(), !s.sex)}
      </>
    );

    /* the allergy ask — the one answer no brief should ever guess.
       Progressive disclosure (round 27): the question shows exactly two
       answers; the add-loop (input, autocomplete, removable rows)
       appears only after "I have some" — never beside "None" as a
       second thing to parse. One question on screen at a time. */
    if (n === "safety") {
      const adding = s.allergyAdd || s.allergies.length > 0;
      return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14 }}>Any medication allergies?</ObHead>
        <ObSub style={{ marginTop: 7 }}>
          This rides every visit brief — never left to memory.
        </ObSub>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {obChoice("None I know of", s.noAllergy && !s.allergies.length,
            () => up({ noAllergy: true, allergyAdd: false, allergies: [], allergyDraft: "" }))}
          {obChoice("I have some — let me add them", adding,
            () => up({ allergyAdd: true, noAllergy: false }))}
        </div>
        {adding && (
          <div className="stepIn">
            {s.allergies.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
                {s.allergies.map((m, i) => (
                  <Card key={m} style={{ padding: "13px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.orangeSoft, color: C.orange,
                        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon d={icons.docs} size={17} />
                      </div>
                      <span style={{ flex: 1, fontSize: 16.5, fontWeight: 600 }}>{m}</span>
                      <button className="tap" onClick={() => up((p) => ({ allergies: p.allergies.filter((_, k) => k !== i) }))}
                        aria-label="Remove" style={{ border: "none", background: "none", color: C.ter,
                          cursor: "pointer", padding: 4, display: "flex" }}>
                        <Icon d={icons.close} size={16} sw={2.4} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, height: 54,
              display: "flex", alignItems: "center", padding: "0 15px", marginTop: 12,
              boxShadow: "0 0 0 4px rgba(0,122,255,.10)" }}>
              <input value={s.allergyDraft}
                onChange={(e) => up({ allergyDraft: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && s.allergyDraft.trim()) addAllergy(s.allergyDraft); }}
                placeholder={s.allergies.length ? "Another? Type it" : "Type it — Penicillin, Sulfa…"}
                style={{ flex: 1, fontSize: 16.5, fontWeight: 600, color: C.ink, border: "none", outline: "none",
                  background: "none", fontFamily: FONT, minWidth: 0 }} />
              {!!s.allergyDraft.trim() && (
                <button className="tap" onClick={() => addAllergy(s.allergyDraft)}
                  style={{ border: "none", background: "none", color: C.blue, fontSize: 14.5, fontWeight: 700,
                    cursor: "pointer", fontFamily: FONT, paddingLeft: 10 }}>ADD</button>
              )}
            </div>
            {allergySug.length > 0 && (
              <Card style={{ marginTop: 9, padding: "2px 16px" }}>
                {allergySug.map((m, i) => (
                  <div key={m} className="tap chipPop" onClick={() => addAllergy(m)}
                    role="button" style={{ padding: "13px 0", fontSize: 16.5, cursor: "pointer",
                      borderBottom: i === allergySug.length - 1 ? "none" : `0.5px solid ${C.line}` }}>{m}</div>
                ))}
              </Card>
            )}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 10 }}>
          {primary("Continue", () => (s.noAllergy || s.allergies.length > 0) && next(),
            !s.noAllergy && !s.allergies.length)}
        </div>
      </>
      );
    }

    /* region: not a question — a stated default with provenance and one
       objection. The objection opens a real PICK (the same progressive
       grammar as the allergy yes): a region is a finite list, so "we'll
       sort it out later" would defer what one tap can answer — deferral
       is for the machine, people get an answer. */
    if (n === "region") {
      const PROVINCES = ["Alberta", "British Columbia", "Manitoba", "New Brunswick",
        "Newfoundland & Labrador", "Northwest Territories", "Nova Scotia", "Nunavut",
        "Ontario", "Prince Edward Island", "Québec", "Saskatchewan", "Yukon"];
      const picked = s.region !== "Québec";
      return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14 }}>Your health region.</ObHead>
        <ObSub style={{ marginTop: 7 }}>
          It sets the urgent numbers, so a hard moment never starts with a guess.
        </ObSub>
        <Card tone={C.tealSoft} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ color: C.teal, flexShrink: 0, marginTop: 2 }}>
              <Icon d={icons.check} size={17} sw={2.6} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.tealInk }}>
                {picked ? `${s.region} — set by you` : "Québec — from your phone"}
              </div>
              <div style={{ fontSize: 13.5, color: C.tealInk, opacity: 0.85, lineHeight: 1.45, marginTop: 3 }}>
                8‑1‑1 reaches a nurse any hour; 9‑1‑1 is for right now.
              </div>
              {!s.regionPicking && (
                <button className="tap" onClick={() => up({ regionPicking: true })}
                  style={{ border: "none", background: "none", color: C.tealInk, fontSize: 13.5,
                    fontWeight: 700, cursor: "pointer", fontFamily: FONT, padding: "8px 0 0",
                    minHeight: 32, display: "inline-flex", alignItems: "center" }}>
                  {picked ? "Change it" : `Not ${s.region}?`}
                </button>
              )}
            </div>
          </div>
        </Card>
        {s.regionPicking && (
          <Card style={{ marginTop: 10, padding: "2px 16px", maxHeight: 262, overflowY: "auto" }}>
            {PROVINCES.map((r, i) => {
              const on = s.region === r;
              return (
                <div key={r} className="tap" role="button"
                  onClick={() => up({ region: r, regionOk: true, regionPicking: false })}
                  style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", cursor: "pointer",
                    borderBottom: i === PROVINCES.length - 1 ? "none" : `0.5px solid ${C.line}` }}>
                  <span style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                    background: on ? C.teal : "transparent", border: on ? "none" : `2px solid ${C.line}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <Icon d={icons.check} size={12} sw={3.2} color="#fff" />}
                  </span>
                  <span style={{ flex: 1, fontSize: 16, fontWeight: on ? 700 : 500 }}>{r}</span>
                </div>
              );
            })}
          </Card>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "0 4px 2px" }}>
          Change any of this later by simply saying so in a talk.
        </div>
        {primary("Continue", next)}
      </>
      );
    }

    if (n === "voice") {
      if (s.voice === "rec") return (
        <>
          {setupBar}
          <ObHead style={{ marginTop: 16 }}>Listening…</ObHead>
          <ObSub style={{ marginTop: 8 }}>Take your time.</ObSub>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
              {[64, 44, 70, 52, 66, 40].map((h, i) => (
                <div key={i} className="wave" style={{ width: 6, height: h, borderRadius: 99,
                  background: i % 2 ? "#FF8A80" : C.red, animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: C.red }}>
              Recording · 0:0{Math.min(9, s.recSecs + 1)}
            </span>
          </div>
          <div style={{ paddingBottom: 10 }}>
            <button className="tap" onClick={stopRec} style={{ width: "100%", minHeight: 54, borderRadius: 13,
              border: "none", background: C.red, color: "#fff", fontSize: 17.5, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT }}>Stop</button>
          </div>
        </>
      );
      /* the point of this step is PRONUNCIATION: you say it, Recall says it
         back, and the respelling shows how it will say it from now on */
      if (s.voice === "done") {
        const first = obFirstName(s.name) || "Amritha";
        return (
          <>
            {setupBar}
            <ObHead style={{ marginTop: 14 }}>Here’s how I’ll say it.</ObHead>
            <ObSub style={{ marginTop: 7 }}>Listen — did I get it right?</ObSub>
            <Card style={{ marginTop: 18, textAlign: "center", padding: "22px 16px 18px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{first}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.blue, letterSpacing: ".01em", marginTop: 6 }}>
                {obPhonetic(s.name) || "am-REET-ha"}
              </div>
              <div style={{ fontSize: 13, color: C.ter, marginTop: 5 }}>stress on the middle part</div>
              <button className="tap" onClick={playBack} style={{ margin: "16px auto 0", border: "none",
                background: C.blueSoft, color: C.blue, borderRadius: 99, padding: "12px 20px",
                fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                display: "flex", alignItems: "center", gap: 9 }}>
                {s.playing ? (
                  <>
                    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 3, height: 16 }}>
                      {[10, 16, 12].map((h, i) => (
                        <span key={i} className="wavebar" style={{ height: h, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                    Saying it…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    Hear it
                  </>
                )}
              </button>
            </Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
              <Icon d={icons.mic} size={13} color={C.ter} sw={2.2} />
              <span style={{ fontSize: 13, color: C.ter }}>your recording · 0:0{Math.min(9, s.recSecs + 1)}</span>
            </div>
            <div style={{ flex: 1 }} />
            {primary("That’s right", next)}
            <div style={{ paddingBottom: 6 }}>
              <ObLink onClick={() => up({ voice: "idle", recSecs: 0 })}>Not quite — say it again</ObLink>
            </div>
          </>
        );
      }
      return (
        <>
          {setupBar}
          <ObHead style={{ marginTop: 16 }}>Now say it out loud.</ObHead>
          <ObSub style={{ marginTop: 8 }}>So I learn how {obFirstName(s.name) || "your name"} is pronounced.</ObSub>
          <Card style={{ marginTop: 20 }}>
            <ObLabel>Try saying</ObLabel>
            <div style={{ fontSize: 17, color: C.ink, lineHeight: 1.5, marginTop: 6, fontWeight: 600 }}>
              “My name is {obFirstName(s.name) || "Amritha"}.”
            </div>
          </Card>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <button className="tap" onClick={startRec} aria-label="Record" style={{ width: 88, height: 88,
              borderRadius: 99, border: "none", background: C.red, color: "#fff", cursor: "pointer",
              boxShadow: "0 0 0 10px rgba(255,59,48,.14), 0 10px 26px rgba(255,59,48,.3)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.mic} size={32} sw={2} />
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 14, color: C.ter, lineHeight: 1.45, paddingBottom: 18 }}>
            Tap to record — you’ll hear it back first
          </div>
        </>
      );
    }

    if (n === "medsAsk") return (
      <>
        {setupBar}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
          <div style={{ width: 88, height: 88, borderRadius: 24, background: C.orangeSoft, color: C.orange,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.meds} size={42} sw={1.6} />
          </div>
        </div>
        <ObHead center style={{ marginTop: 24 }}>Any medications you take?</ObHead>
        <ObSub center style={{ marginTop: 10 }}>
          Point your camera at a bottle — I’ll read the label. One is plenty for today;
          the rest can wait for the app.
        </ObSub>
        <div style={{ flex: 1 }} />
        {primary(<><Icon d={icons.camera} size={19} />Scan a bottle</>, () => up({ scanning: true }))}
        <div style={{ paddingTop: 10 }}>
          <BigButton tone="tinted" icon={<Icon d={icons.plus} size={18} sw={2.6} />} onClick={() => go("medsAdd")}>
            Type the name instead
          </BigButton>
        </div>
        <div style={{ paddingBottom: 8 }}><ObLink onClick={() => go("precall")}>Skip for now</ObLink></div>
      </>
    );

    if (n === "medsAdd") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14, fontSize: 23 }}>Your medications</ObHead>
        <ObSub style={{ marginTop: 6, fontSize: 14.5 }}>
          {s.meds.length ? "That’s your one for today." : "Type a name, tap Add — just one for now."}
        </ObSub>
        {!s.meds.length && (
        <button className="tap" onClick={() => up({ scanning: true })} style={{ display: "flex",
          alignItems: "center", gap: 11, width: "100%", marginTop: 12, background: C.card, border: "none",
          borderRadius: 14, padding: "13px 15px", cursor: "pointer", fontFamily: FONT, textAlign: "left",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, color: C.blue,
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.camera} size={17} />
          </span>
          <span style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: C.blue }}>Scan a bottle instead</span>
          <Icon d={icons.chevron} size={15} color={C.ter} sw={2.2} />
        </button>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
          {s.meds.map((m, i) => (
            <Card key={m + i} style={{ padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.orangeSoft, color: C.orange,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={icons.meds} size={17} />
                </div>
                <span style={{ flex: 1, fontSize: 16.5, fontWeight: 600 }}>{m}</span>
                <button className="tap" onClick={() => up((p) => ({ meds: p.meds.filter((_, k) => k !== i) }))}
                  aria-label="Remove" style={{ border: "none", background: "none", color: C.ter,
                    cursor: "pointer", padding: 4, display: "flex" }}>
                  <Icon d={icons.close} size={16} sw={2.4} />
                </button>
              </div>
            </Card>
          ))}
        </div>
        {!s.meds.length && (
        <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, height: 56,
          display: "flex", alignItems: "center", padding: "0 16px", marginTop: 11,
          boxShadow: "0 0 0 4px rgba(0,122,255,.12)" }}>
          <input value={s.medDraft} onChange={(e) => up({ medDraft: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && s.medDraft.trim())
              up((p) => ({ meds: [...p.meds, p.medDraft.trim()], medDraft: "" })); }}
            placeholder="Start typing a name" style={{ flex: 1, fontSize: 18, fontWeight: 600, color: C.ink,
              border: "none", outline: "none", background: "none", fontFamily: FONT, minWidth: 0 }} />
          {!!s.medDraft.trim() && (
            <button className="tap" onClick={() => up((p) => ({ meds: [...p.meds, p.medDraft.trim()], medDraft: "" }))}
              style={{ border: "none", background: "none", color: C.blue, fontSize: 14.5, fontWeight: 700,
                cursor: "pointer", fontFamily: FONT, paddingLeft: 10 }}>ADD</button>
          )}
        </div>
        )}
        {!s.meds.length && medSug.length > 0 && (
          <Card style={{ marginTop: 9, padding: "2px 16px" }}>
            {medSug.map((m, i) => (
              <div key={m} className="tap chipPop" onClick={() => up((p) => ({ meds: [...p.meds, m], medDraft: "" }))}
                role="button" style={{ padding: "13px 0", fontSize: 16.5, cursor: "pointer",
                  borderBottom: i === medSug.length - 1 ? "none" : `0.5px solid ${C.line}` }}>{m}</div>
            ))}
          </Card>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "0 4px 12px" }}>
          {s.meds.length
            ? "The rest go in later — Meds → Add a medication, typed or scanned."
            : "Doses come up when we talk — no need for them here."}
        </div>
        <div style={{ paddingBottom: 10 }}>
          {primary(s.meds.length ? `Done — ${s.meds.length} added` : "Skip for now", medsDone, !s.meds.length)}
        </div>
      </>
    );

    if (n === "shelf") return (
      <>
        {setupBar}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
          <div style={{ width: 60, height: 60, borderRadius: 99, background: C.greenSoft, color: C.green,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.check} size={28} sw={2.8} />
          </div>
        </div>
        <ObHead center style={{ marginTop: 18 }}>
          Your cabinet holds {s.meds.length} {s.meds.length === 1 ? "thing" : "things"}.
        </ObHead>
        <Card style={{ marginTop: 20, padding: "4px 16px" }}>
          {s.meds.map((m, i) => (
            <div key={m + i} className="stepIn" style={{ animationDelay: `${0.2 + i * 0.18}s`,
              display: "flex", alignItems: "center", gap: 13, padding: "13px 0",
              borderBottom: i === s.meds.length - 1 ? "none" : `0.5px solid ${C.line}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.orangeSoft, color: C.orange,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={icons.meds} size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16.5, fontWeight: 600 }}>{m}</div>
                <div style={{ fontSize: 13.5, color: C.ter, marginTop: 1 }}>dose to be confirmed</div>
              </div>
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, textAlign: "center", padding: "14px 12px 0" }}>
          Next time we talk, I’ll ask when you take it. The rest of your cabinet fills in the app.
        </div>
        <div style={{ flex: 1 }} />
        {primary("Continue", next)}
      </>
    );

    if (n === "precall") return (
      <>
        {setupBar}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <RecallOrb size={72} mood="listening" />
        </div>
        <ObHead center style={{ marginTop: 14 }}>
          Let’s do your first check-in{obFirstName(s.name) ? `, ${obFirstName(s.name)}` : ""}.
        </ObHead>
        {/* the lens moment, just-in-time (design canvas, round 3): the six are
            HOW RECALL LISTENS, never a menu the user picks from — shown in
            plain words right before the first talk, one screen, no quiz.
            "About 90 seconds" is the same number the day-1 receipt will
            use — one name, one length, both ends of the seam. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {[["A first short talk — about 90 seconds", null, icons.today],
            ["You just talk — I listen for what a doctor would ask about",
              "Medications · symptoms · sleep · movement · meals · mood", icons.chat],
            ["In the app, talk as long as you like", null, icons.mic]].map(([t, sub, ic], ri) => (
            <div key={t} className="stepIn" style={{ animationDelay: `${0.2 + ri * 0.22}s` }}>
            <Card style={{ padding: "11px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, color: C.blue,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={ic} size={16} sw={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, lineHeight: 1.35 }}>{t}</div>
                  {sub && (
                    <div style={{ fontSize: 13, color: C.sub, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>
                  )}
                </div>
              </div>
            </Card>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {primary(<><Icon d={icons.mic} size={18} />Start talking</>, () => up({ sheet: "mic" }))}
        <div style={{ paddingBottom: 8 }}><ObLink onClick={startTyped}>I’d rather type</ObLink></div>
      </>
    );

    if (n === "call" && s.typedMode) return (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Check-in</span>
          <button className="tap" onClick={allowMic} style={{ border: "none", background: "none",
            color: C.blue, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 6 }}>
            <Icon d={icons.mic} size={15} />Talk instead
          </button>
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
          gap: 10, paddingTop: 8, minHeight: 0 }}>
          {shownTurns.map((l, i) => {
            if (l.k === "note") return <div key={i} style={{ display: "flex", justifyContent: "center" }}><NotedChip text={obLine(l.t)} /></div>;
            if (l.k === "think") return <ThinkChip key={i} text={obLine(l.t)} />;
            if (l.k === "confirm")
              return s.apptAns ? (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                  <ChatBubble who="recall">
                    {s.apptAns === "yes" ? "Set aside for your review ✓" : "Okay — nothing was kept."}
                  </ChatBubble>
                </div>
              ) : null;
            return (
              <div key={i} className="fadeMsg" style={{ display: "flex",
                justifyContent: l.k === "a" ? "flex-end" : "flex-start" }}>
                <ChatBubble who={l.k === "a" ? "me" : "recall"}>
                  {l.k === "a" && s.answers[i] ? s.answers[i] : obLine(l.t)}
                </ChatBubble>
              </div>
            );
          })}
          {waitingConfirm && (
            <div style={{ maxWidth: "90%", width: "100%" }}>
              <ConfirmCard cfg={OB_CONFIRM} onAnswer={(v) => up({ apptAns: v })} />
            </div>
          )}
          {callDone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <RecallOrb size={26} mood="calm" />
              <span style={{ fontSize: 13.5, color: C.ter }}>That’s everything — see what I heard below.</span>
            </div>
          )}
        </div>
        {replyChip && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 9 }}>
            <button className="tap chipPop" onClick={() => sendTyped(replyChip.t)}
              style={{ border: "none", background: C.blueSoft, color: C.blue, borderRadius: 99,
                padding: "9px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
              {replyChip.short}
            </button>
          </div>
        )}
        {!callDone && (
          <div style={{ display: "flex", gap: 9, alignItems: "center", paddingBottom: 10 }}>
            <div style={{ flex: 1, background: C.card, borderRadius: 99, height: 48, display: "flex",
              alignItems: "center", padding: "0 16px", boxShadow: "0 0 0 0.5px rgba(0,0,0,.08)" }}>
              <input value={s.typedDraft} onChange={(e) => up({ typedDraft: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && s.typedDraft.trim()) sendTyped(s.typedDraft.trim()); }}
                placeholder="Type your answer" style={{ flex: 1, fontSize: 15.5, color: C.ink, border: "none",
                  outline: "none", background: "none", fontFamily: FONT, minWidth: 0 }} />
            </div>
            <button className="tap" onClick={() => s.typedDraft.trim() && sendTyped(s.typedDraft.trim())}
              aria-label="Send" style={{ width: 48, height: 48, borderRadius: 99, border: "none",
                background: C.blue, color: "#fff", cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z" /></svg>
            </button>
          </div>
        )}
        {callDone && (
          <div className="stepIn" style={{ paddingBottom: 10 }}>{primary("See what I heard", () => go("receipt"))}</div>
        )}
      </>
    );

    if (n === "receipt") {
      /* the record is spoken, not typed: health facts can only be changed by
         TALKING again — manual edits would defeat the point of Recall. The
         one exception is the doctor's NAME, which voice can't spell. */
      /* the receipt is a CHECK-IN review, not a visit page — but its
         rows sort by DESTINATION, so the first thing Recall ever shows
         is the routing doctrine made visible: journal things to the
         journal, visit things to the visit's page. Two screens later
         the anatomy screen shows them landed — one storyline. */
      const journalFacts = [];
      if (s.facts.headache) journalFacts.push(["HEADACHE", s.facts.headache]);
      if (s.facts.sleep) journalFacts.push(["SLEEP", s.facts.sleep]);
      const groupHead = (icon, color, text, delay) => (
        <div className="stepIn" style={{ animationDelay: delay, display: "flex",
          alignItems: "center", gap: 7, padding: "12px 0 0" }}>
          <Icon d={icons[icon]} size={13} color={color} sw={2.2} />
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".07em",
            textTransform: "uppercase", color }}>{text}</span>
        </div>
      );
      const dayWord = s.appt.date.split(" ")[0];
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <span style={{ width: 32, height: 32, borderRadius: 99, background: C.greenSoft, color: C.green,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.check} size={17} sw={3} />
            </span>
            <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-.01em" }}>Saved — 1 min 04</span>
          </div>
          <ObSub style={{ marginTop: 6 }}>In your words — each already headed where it belongs.</ObSub>
          <Card style={{ marginTop: 12, padding: "2px 16px 6px" }}>
            {groupHead("journal", C.sub, "For your journal — private", "0.1s")}
            {journalFacts.map(([label, value], ri) => (
              <div key={label} className="stepIn" style={{ animationDelay: `${0.2 + ri * 0.18}s`,
                padding: "10px 0 12px", borderBottom: ri === journalFacts.length - 1 ? "none" : `0.5px solid ${C.line}` }}>
                <ObLabel>{label}</ObLabel>
                <div style={{ fontSize: 16, marginTop: 3, lineHeight: 1.4 }}>{value}</div>
              </div>
            ))}
            <div style={{ height: 0.5, background: C.line }} />
            {groupHead("visits", C.blue, `For ${dayWord}’s visit page`, "0.55s")}
            {s.question && (
              <div className="stepIn" style={{ animationDelay: "0.65s",
                padding: "10px 0 12px", borderBottom: `0.5px solid ${C.line}` }}>
                <ObLabel>{`QUESTION FOR ${s.appt.doctor.toUpperCase()}`}</ObLabel>
                <div style={{ fontSize: 16, marginTop: 3, lineHeight: 1.4 }}>{`“${s.question}”`}</div>
              </div>
            )}
            <div className="stepIn" style={{ animationDelay: "0.8s", padding: "10px 0 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ObLabel>Appointment</ObLabel>
                {s.apptAns === "yes" && (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.greenInk, background: C.greenSoft,
                    borderRadius: 99, padding: "3px 8px" }}>confirmed ✓</span>
                )}
              </div>
              <div style={{ fontSize: 16, marginTop: 3, lineHeight: 1.4, fontWeight: 600 }}>
                {s.appt.doctor} · heart · {s.appt.date}
              </div>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 2 }}>
                Reason for visit: {s.appt.reason}
              </div>
              <div style={{ fontSize: 13, color: C.ter, marginTop: 2 }}>you’ll check the details next</div>
            </div>
          </Card>
          <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "9px 6px 0" }}>
            I listen for what doctors ask about — sleep, symptoms, medications, mood. No forms;
            anything wrong here, just tell me.
          </div>
          <div style={{ flex: 1 }} />
          {/* one sticky footer, both ways out — the big fix button used to
              hide below the fold, which is the one place an exit can't be */}
          <div style={{ position: "sticky", bottom: 0, marginTop: "auto", flexShrink: 0,
            padding: "12px 0 6px", background: `linear-gradient(180deg, rgba(242,243,247,0), ${C.bg} 34%)` }}>
            <button className="tap" onClick={next} style={{ width: "100%", minHeight: 54, borderRadius: 13,
              border: "none", background: C.blue, color: "#fff", fontSize: 17.5, fontWeight: 600,
              cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 9 }}>
              Looks right
            </button>
            <ObLink onClick={resumeCall}>
              <Icon d={icons.mic} size={15} />Fix something — by talking
            </ObLink>
          </div>
        </>
      );
    }

    if (n === "confirm") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 14 }}>Your visit with {s.appt.doctor}.</ObHead>
        <ObSub style={{ marginTop: 7 }}>Nothing to fill in — just check it’s right.</ObSub>
        <Card style={{ marginTop: 14, padding: "2px 16px 12px" }}>
          <ObEditRow label="WHO" value={`${s.appt.doctor} · Cardiology`} strong onClick={editWho} />
          <ObEditRow label="WHEN" value={`${s.appt.date} · in 3 days`} strong
            onClick={() => up({ sheet: "date", dateTarget: "appt", pickedDay: 30 })} />
          <ObEditRow label="REASON FOR VISIT" value={s.appt.reason} strong last
            onClick={() => openEdit("reason", "What’s this visit about?", s.appt.reason, "",
              ["Follow-up", "New problem", "Test results"], false, true)} />
        </Card>
        <Card tone={C.greenSoft} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ color: C.green, flexShrink: 0, marginTop: 2 }}><Icon d={icons.check} size={17} sw={2.8} /></span>
            <span style={{ fontSize: 14.5, color: C.greenInk, lineHeight: 1.5 }}>
              Your question is pinned here: <b>“{s.question}”</b>
            </span>
          </div>
        </Card>
        {/* the pencil's honest scope, plus the whole-thing-wrong escape:
            pencils fix SPELLING (the part voice can't check); if the fact
            itself is wrong, the talk is the editor — say it again */}
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "10px 4px 0" }}>
          The pencils fix a spelling. If something here just isn’t what happened, say it again —
        </div>
        <ObLink onClick={resumeCall}>
          <Icon d={icons.mic} size={15} />Wrong? Fix it by talking
        </ObLink>
        <div style={{ flex: 1 }} />
        {primary("That’s right", next)}
      </>
    );

    /* the clinic's language — the SAME picker the flow opened with
       (search, a Suggested section, the full list), because a pattern
       learned once should never come back smaller. Suggested comes from
       her region — Québec clinics run in French and English — and the
       default is already French for the same reason: a stated default
       to correct, never a cold list of four. */
    if (n === "clinicLang") {
      const q = s.clinicSearch.trim().toLowerCase();
      const match = (l) => !q || l.native.toLowerCase().includes(q) || l.latin.toLowerCase().includes(q);
      const regionSug = ["fr", "en"].map((c) => OB_LANGS.find((l) => l.code === c)).filter(match);
      const allClinic = [...OB_LANGS].sort((a, b) => a.latin.localeCompare(b.latin)).filter(match);
      const clinicRow = (l, i, len) => {
        const on = s.appt.lang === l.code;
        return (
          <div key={l.code} className="tap" role="button"
            onClick={() => up((p) => ({ appt: { ...p.appt, lang: l.code } }))}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", cursor: "pointer",
              borderBottom: i === len - 1 ? "none" : `0.5px solid ${C.line}` }}>
            <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
              background: on ? C.teal : "transparent", border: on ? "none" : `2px solid ${C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
            </span>
            <span style={{ flex: 1, fontSize: 16.5, fontWeight: on ? 700 : 600 }}>{l.native}</span>
            <span style={{ fontSize: 14, color: C.ter }}>{l.latin}</span>
          </div>
        );
      };
      return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 10 }}>What language is {s.appt.doctor}’s clinic in?</ObHead>
        <ObSub style={{ marginTop: 6, fontSize: 14.5 }}>
          Their page arrives in it. Yours stays in {langName(s.main)}.
        </ObSub>
        <div style={{ background: C.card, borderRadius: 12, height: 46, display: "flex", alignItems: "center",
          gap: 10, padding: "0 14px", marginTop: 12, flexShrink: 0, boxShadow: "0 0 0 0.5px rgba(0,0,0,.08)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.ter} strokeWidth="2.4"
            strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input value={s.clinicSearch} onChange={(e) => up({ clinicSearch: e.target.value })}
            placeholder="Search languages" style={{ flex: 1, fontSize: 16, color: C.ink, border: "none",
              outline: "none", background: "none", fontFamily: FONT, minWidth: 0 }} />
          {!!q && (
            <button className="tap" onClick={() => up({ clinicSearch: "" })} aria-label="Clear search"
              style={{ border: "none", background: C.track, color: C.sub, width: 24, height: 24,
                borderRadius: 99, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0 }}>
              <Icon d={icons.close} size={11} sw={3} />
            </button>
          )}
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, marginTop: 12,
          paddingBottom: 6 }}>
          {!q && regionSug.length > 0 && (
            <>
              <ObLabel>Suggested — clinics in Québec</ObLabel>
              <Card style={{ margin: "8px 0 14px", padding: "2px 16px" }}>
                {regionSug.map((l, i) => clinicRow(l, i, regionSug.length))}
              </Card>
            </>
          )}
          <ObLabel>{q ? "Matches" : "All languages"}</ObLabel>
          {allClinic.length > 0 ? (
            <Card style={{ marginTop: 8, padding: "2px 16px" }}>
              {allClinic.map((l, i) => clinicRow(l, i, allClinic.length))}
            </Card>
          ) : (
            <div style={{ fontSize: 14.5, color: C.ter, padding: "14px 4px" }}>
              No matches — try the English name of the language.
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: "10px 0 6px", boxShadow: `0 -12px 12px -12px rgba(0,0,0,.12)` }}>
          <Card tone={C.tealSoft} style={{ marginBottom: 10, padding: "11px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.tealInk }}>You: {langName(s.main)}</span>
              <Icon d={icons.chevron} size={15} color={C.teal} sw={2.6} />
              <span style={{ fontSize: 15, fontWeight: 700, color: C.tealInk }}>Brief: {clinicName}</span>
            </div>
          </Card>
          {primary("Continue", next)}
        </div>
      </>
      );
    }

    if (n === "twoLang") return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 10 }}>
          {s.appt.lang && s.appt.lang !== s.main
            ? `You’ll never write a word of ${clinicName}.` : "One memory, one page."}
        </ObHead>
        <ObSub style={{ marginTop: 6 }}>
          Talk the way you always talk. I rewrite it for {s.appt.doctor}.
        </ObSub>
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ObLabel style={{ color: C.blue }}>Your check-in · tonight</ObLabel>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.ter, background: C.bg,
              borderRadius: 5, padding: "3px 7px" }}>{s.main.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 15.5, lineHeight: 1.5, marginTop: 8 }}>“{journalLine || "nothing noted yet"}”</div>
        </Card>
        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
          <span style={{ width: 30, height: 30, borderRadius: 99, background: C.blueSoft, color: C.blue,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </span>
        </div>
        <Card style={{ boxShadow: `0 0 0 1.5px #B7DEE5, 0 8px 22px -10px rgba(48,176,199,.3)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ObLabel style={{ color: C.teal }}>For {s.appt.doctor}</ObLabel>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.tealInk, background: C.tealSoft,
              borderRadius: 5, padding: "3px 7px" }}>{(s.appt.lang || "fr").toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 15.5, lineHeight: 1.5, marginTop: 8 }}>
            {OB_TRANS[s.appt.lang || "fr"] || OB_TRANS.en}
          </div>
          {!OB_TRANS[s.appt.lang || "fr"] && (
            <div style={{ fontSize: 12.5, color: C.ter, lineHeight: 1.4, marginTop: 6 }}>
              Sample shown in English — the real page arrives in {clinicName}.
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 11, flexWrap: "wrap" }}>
            {["clinical wording", "reads in 90 s"].map((t) => (
              <span key={t} style={{ background: C.bg, borderRadius: 99, padding: "5px 10px", fontSize: 12.5,
                fontWeight: 600, color: C.sub }}>{t}</span>
            ))}
          </div>
        </Card>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 2px 2px" }}>
          <span style={{ color: C.green, flexShrink: 0, marginTop: 3 }}><Icon d={icons.check} size={15} sw={2.8} /></span>
          <span style={{ fontSize: 14, color: C.sub, lineHeight: 1.55 }}>
            Your words are kept exactly as you said them.
          </span>
        </div>
        {primary("Got it", next)}
      </>
    );

    /* the visit page teaches by SEQUENCE, not description: first beat is
       the page EMPTY (the concept — every visit gets one), then the
       question from the call visibly lands in it (the mechanism — your
       words fill it). Translation is taught two steps later, on the
       screen built for it. */
    if (n === "visits") {
      const landed = s.ticks >= 1;
      /* the reason-for-visit slot is FILLED from the start — the call
         already captured it — so the anatomy teaches the same structure
         the app's visit page shows: reason first, then the sockets
         that fill over days */
      const slots = [
        ["spark", C.purple, "Reason for visit · set", s.appt.reason, true],
        ["question", C.purple,
          landed ? "Questions · 1" : "Questions · none yet",
          landed ? `“${s.question}”` : "Anything you want to ask, said in any check-in",
          landed],
        ["pattern", C.orange, "Patterns · none yet", "They build from your check-ins, over days", false],
        ["docs", C.teal, "Documents · none yet", "Scan or add any time, in the app", false],
      ];
      return (
        <>
          {setupBar}
          <ObHead style={{ marginTop: 10, fontSize: 23 }}>{s.appt.doctor}’s visit has a page.</ObHead>
          <ObSub key={landed ? "b" : "a"} className="fadeMsg" style={{ marginTop: 5, fontSize: 14.5 }}>
            {landed
              ? "And your question from our talk just landed on it."
              : "Every visit gets one — yours already opens with your reason."}
          </ObSub>
          <Card style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueSoft, color: C.blue,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={icons.visits} size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{s.appt.doctor} · Cardiology</div>
                <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{s.appt.date}</div>
              </div>
            </div>
            <div style={{ height: 0.5, background: C.line, margin: "12px 0 6px" }} />
            {slots.map(([ic, col, label, sub, filled], ri) => (
              <div key={`${ic}-${filled}`} className={filled ? "chipPop" : "stepIn"}
                style={{ animationDelay: filled ? "0s" : `${0.25 + ri * 0.3}s`,
                  display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 0" }}>
                <span style={{ color: filled ? col : C.ter, flexShrink: 0, marginTop: 2,
                  opacity: filled ? 1 : 0.55 }}>
                  <Icon d={icons[ic]} size={17} sw={2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: filled ? C.ink : C.sub }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: filled ? C.ink : C.ter, lineHeight: 1.45, marginTop: 2,
                    fontStyle: filled ? "italic" : "normal" }}>{sub}</div>
                </div>
                {filled && <Icon d={icons.check} size={15} sw={2.8} color={C.green} />}
              </div>
            ))}
          </Card>
          <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0" }}>
            By {s.appt.date.split(" ")[0]}, this becomes a one-page brief for the clinic.
          </div>
          <div style={{ flex: 1 }} />
          {/* two beats, hers: first tap lands the question, second moves on */}
          {landed
              ? primary("Continue", next)
              : primary("See your question land", () => up({ ticks: 1 }))}
        </>
      );
    }

    /* the paywall pattern users already know: a two-column plan table.
       Rows are FEATURES in plain words; the columns answer the only real
       question — what stays when the trial ends. Fixed 64px value
       columns, so labels wrap and nothing squishes at any text size. */
    if (n === "trial") {
      const cell = (v) => (
        <span style={{ width: 64, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          {v === true ? <Icon d={icons.check} size={16} sw={2.8} color={C.green} />
            : v === false ? <span style={{ color: C.ter, fontWeight: 700 }}>—</span>
            : <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textAlign: "center",
                lineHeight: 1.25 }}>{v}</span>}
        </span>
      );
      const rows = [
        ["Typed check-ins & journal", true, true],
        ["Visit pages & briefs", true, true],
        ["Document scans", true, true],
        ["Talking check-ins", "5 / month", "Unlimited"],
        ["Recall calls you", false, true],
      ];
      return (
      <>
        {setupBar}
        <ObHead style={{ marginTop: 10 }}>Talking is free for {OB_TRIAL_DAYS} days.</ObHead>
        <ObSub style={{ marginTop: 8 }}>No card now. Everything else stays free, always.</ObSub>
        <Card style={{ marginTop: 16, padding: "12px 14px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 9 }}>
            <span style={{ flex: 1 }} />
            <span style={{ width: 64, flexShrink: 0, textAlign: "center", fontSize: 12,
              fontWeight: 700, letterSpacing: ".04em", color: C.sub }}>FREE</span>
            <span style={{ width: 64, flexShrink: 0, display: "flex", justifyContent: "center" }}>
              <span style={{ background: C.blueSoft, color: C.blue, borderRadius: 99,
                padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>VOICE</span>
            </span>
          </div>
          {rows.map(([label, free, voice], i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", padding: "9px 0",
              borderTop: `0.5px solid ${C.line}` }}>
              <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.35, paddingRight: 6 }}>{label}</span>
              {cell(free)}
              {cell(voice)}
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "10px 6px 0" }}>
          Voice is yours for {OB_TRIAL_DAYS} days, then it's your choice — I'll remind you on
          day {OB_TRIAL_DAYS - 2}, and nothing you've saved is ever locked away.
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ paddingBottom: 4 }}>{primary(`Start my ${OB_TRIAL_DAYS} free days`, () => up({ sheet: "save" }))}</div>
        <div style={{ fontSize: 12.5, color: C.ter, textAlign: "center", paddingBottom: 10 }}>
          No card · cancel anytime
        </div>
      </>
      );
    }

    return null;
  })();

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, background: C.bg, fontFamily: FONT,
      color: C.ink, display: "flex", flexDirection: "column" }}>
      {/* the exit X is TESTER chrome — a real user can only go back, not
          close setup. It floats at the bar's own level (the progress bar
          already leaves a right-side gap for it) instead of owning a row:
          one less level of chrome, more room for every screen. */}
      <button className="tap" onClick={onExit} aria-label="Exit onboarding preview"
        style={{ position: "absolute", top: 16, right: 16, zIndex: 20,
          width: 28, height: 28, borderRadius: 99, border: "none", background: C.track,
          color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon d={icons.close} size={13} sw={2.8} />
      </button>
      {/* every screen scrolls when it needs to: short screens bottom-anchor
          their CTA with a flex spacer, tall ones overflow into this scroller
          instead of clipping the button off the bottom of the phone */}
      <div key={n + (s.voice || "") + (s.typedMode ? "t" : "")} className="pageIn scroll"
        style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 20px 4px",
          minHeight: 0, overflowY: "auto" }}>
        {body}
      </div>

      {/* literally the Meds tab's scanner — same viewfinder, same label lock,
          same confirm card, so the two flows can never drift apart */}
      {s.scanning && (
        <MedScanOverlay onCancel={() => up({ scanning: false })}
          onConfirm={() => up((p) => ({ scanning: false, medDraft: "",
            meds: p.meds.includes("Atorvastatin 20 mg") ? p.meds : [...p.meds, "Atorvastatin 20 mg"],
            step: OB_STEPS.indexOf("medsAdd") }))} />
      )}

      {s.sheet === "mic" && (
        <ObDialog title="“Recall” would like to access the microphone"
          body="So you can talk instead of type. Recordings stay on your account and are never shared without you."
          deny="Don’t Allow" allow="Allow" onDeny={startTyped} onAllow={allowMic} />
      )}
      {s.sheet === "notif" && (
        <ObDialog title="“Recall” would like to send you notifications"
          body={`One gentle nudge at ${reminderShort}. Never more than that.`}
          deny="Don’t Allow" allow="Allow"
          onDeny={() => { up({ sheet: null, reminder: "none" }); go("confirm"); }}
          onAllow={() => { up({ sheet: null }); go("confirm"); }} />
      )}

      {/* account creation the standard way: full-width stacked options in a
          sheet AFTER the decision to start — never three mystery buttons */}
      {s.sheet === "save" && (
        <Sheet title="Save your setup" onClose={() => up({ sheet: null })}>
          <div style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.5, padding: "0 2px 14px" }}>
            So your memory is safe if you ever change phones.
          </div>
          {["Continue with Apple", "Continue with Google", "Continue with a phone number"].map((label, i) => (
            <button key={label} className="tap stepIn" onClick={() => go("assembly")}
              style={{ animationDelay: `${i * 0.08}s`, display: "flex", alignItems: "center",
                justifyContent: "center", width: "100%", minHeight: 52, marginBottom: 10, background: C.card,
                border: "none", borderRadius: 13, fontSize: 16.5, fontWeight: 600, color: C.ink,
                cursor: "pointer", fontFamily: FONT, boxShadow: "0 0 0 0.5px rgba(0,0,0,.1)" }}>
              {label}
            </button>
          ))}
          <div style={{ fontSize: 12.5, color: C.ter, textAlign: "center", padding: "6px 0 2px" }}>
            Nothing is shared with anyone — this is only your key.
          </div>
        </Sheet>
      )}

      {s.sheet === "tomorrow" && (
        <Sheet title="Same time tomorrow?" onClose={() => up({ sheet: null })}>
          <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.5, padding: "0 2px 14px" }}>
            One gentle nudge a day — never more.
          </div>
          {[["evening", "Evenings, 9:30 pm", "Same as tonight"], ["morning", "Mornings, 8:00 am", "With the first tablet"],
            ["custom", "A time you pick", "Any half hour that suits you"]].map(([key, t, b]) => {
            const on = s.reminder === key;
            return (
              <Card key={key} onClick={() => up({ reminder: key })}
                style={{ marginBottom: 10, boxShadow: on ? `0 0 0 2px ${C.blue}` : undefined }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                    background: on ? C.blue : "transparent", border: on ? "none" : `2px solid ${C.line}`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                      {key === "custom" && on ? `Every day, ${OB_TIMES[s.customIdx]}` : t}
                    </div>
                    <div style={{ fontSize: 13.5, color: C.sub, marginTop: 1 }}>{b}</div>
                  </div>
                </div>
                {/* the familiar wheel — slide to the half hour you want */}
                {key === "custom" && on && (
                  <div className="stepIn" onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: 12, paddingTop: 10, borderTop: `0.5px solid ${C.line}` }}>
                    <ObWheel options={OB_TIMES} index={s.customIdx}
                      onChange={(i) => up({ customIdx: i })} />
                  </div>
                )}
              </Card>
            );
          })}
          <div style={{ marginTop: 6 }}><BigButton onClick={() => up({ sheet: "notif" })}>Remind me then</BigButton></div>
          <ObLink color={C.sub} onClick={() => { up({ sheet: null, reminder: "none" }); go("confirm"); }}>
            No reminders, thanks
          </ObLink>
        </Sheet>
      )}

      {s.sheet === "edit" && (
        <Sheet title={meta.title || "Edit"} onClose={() => up({ sheet: null, editKey: null })}>
          {meta.heard && (
            <div style={{ fontSize: 14, color: C.sub, padding: "0 2px 10px" }}>You said: “{meta.heard}”</div>
          )}
          {meta.pickOnly ? (
            /* auto-tagged from the conversation — pick, never free-type */
            <>
              {meta.quick.map((t) => {
                const on = s.sheetDraft === t || s.sheetDraft.startsWith(t);
                return (
                  <Card key={t} onClick={() => up({ sheetDraft: t })}
                    style={{ marginBottom: 10, boxShadow: on ? `0 0 0 2px ${C.blue}` : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <span style={{ width: 24, height: 24, borderRadius: 99, flexShrink: 0,
                        background: on ? C.blue : "transparent", border: on ? "none" : `2px solid ${C.line}`,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {on && <Icon d={icons.check} size={13} sw={3.2} color="#fff" />}
                      </span>
                      <span style={{ fontSize: 16.5, fontWeight: 600 }}>{t}</span>
                    </div>
                  </Card>
                );
              })}
              <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "2px 4px 10px" }}>
                The details underneath come from our talks — to change those, just tell me.
              </div>
            </>
          ) : (
            <div style={{ background: C.card, border: `2px solid ${C.blue}`, borderRadius: 14, height: 54,
              display: "flex", alignItems: "center", padding: "0 15px",
              boxShadow: "0 0 0 4px rgba(0,122,255,.12)" }}>
              <input value={s.sheetDraft} onChange={(e) => up({ sheetDraft: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") saveSheet(); }}
                style={{ flex: 1, fontSize: 18, fontWeight: 600, color: C.ink, border: "none", outline: "none",
                  background: "none", fontFamily: FONT, minWidth: 0 }} />
            </div>
          )}
          <div style={{ marginTop: 14 }}><BigButton onClick={saveSheet}>Save</BigButton></div>
        </Sheet>
      )}

      {s.sheet === "date" && (
        <Sheet title="When is it?" onClose={() => up({ sheet: null })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <Icon d={icons.back} size={18} color={C.blue} sw={2.6} />
            <span style={{ fontSize: 16.5, fontWeight: 700 }}>July 2026</span>
            <span style={{ transform: "scaleX(-1)", display: "flex" }}>
              <Icon d={icons.back} size={18} color={C.blue} sw={2.6} />
            </span>
          </div>
          <div style={{ display: "flex", gap: 2, marginTop: 12 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 700, color: C.ter }}>{l}</div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
            {weeks.map((w, wi) => (
              <div key={wi} style={{ display: "flex", gap: 2 }}>
                {w.map((d, di) => (
                  <button key={di} className={d ? "tap" : ""} disabled={!d}
                    onClick={() => d && (s.dateTarget === "add"
                      ? up((p) => ({ pickedDay: d, addDraft: { ...p.addDraft, day: d }, sheet: "add" }))
                      : up({ pickedDay: d }))}
                    style={{ flex: 1, height: 38, border: "none", borderRadius: 11, fontFamily: FONT,
                      fontSize: 15.5, cursor: d ? "pointer" : "default",
                      background: d && s.pickedDay === d ? C.blue : "transparent",
                      color: d ? (s.pickedDay === d ? "#fff" : C.ink) : "transparent",
                      fontWeight: d && s.pickedDay === d ? 700 : 400 }}>
                    {d || "·"}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <Card tone={C.blueSoft} style={{ marginTop: 12, padding: "11px 14px" }}>
            <span style={{ fontSize: 14, color: C.blueDeep, lineHeight: 1.45 }}>
              Don’t know the day? Pick <b>a rough month</b> instead.
            </span>
          </Card>
          <div style={{ marginTop: 12 }}>
            <BigButton onClick={() => {
              if (s.dateTarget === "add") return up({ sheet: "add" });
              up({ editKey: "date" }); saveSheet();
            }}>Save</BigButton>
          </div>
        </Sheet>
      )}

    </div>
  );
};

/* -------- per-tab explainer videos — help that meets you where you are.
   Placeholder player; each tab gets its own 1-minute walkthrough. ------- */
const TAB_VIDEOS = {
  today: ["How Today works", "One place each day: answer the check-in, log your medications, glance at your next visit. Everything else finds you when it needs you."],
  journal: ["Your Journal", "Every check-in becomes an entry in your own words, and weekly insights arrive on Saturdays. Private unless you choose to share."],
  visits: ["Visits & briefs", "Each appointment gets a page that fills from your check-ins — questions, patterns, documents — and becomes a one-page brief the day before."],
  meds: ["Your medications", "Log doses by moment, keep your cabinet current, scan a bottle to add one. Missed doses are recorded, never judged."],
  docs: ["Documents", "Scan letters and results — Recall reads them, files them, and explains them in plain words."],
};
const VideoHelpSheet = ({ tab, onClose }) => {
  /* opens on the tab you're in; every other guide is one tap below —
     contextual first, global still reachable */
  const [sel, setSel] = useState(TAB_VIDEOS[tab] ? tab : "today");
  const [title, blurb] = TAB_VIDEOS[sel];
  const others = Object.keys(TAB_VIDEOS).filter((k) => k !== sel);
  return (
    <Sheet title={title} onClose={onClose}>
      <div key={sel} className="fadeMsg" style={{ position: "relative", borderRadius: 14, overflow: "hidden",
        background: "#14181F", aspectRatio: "16 / 9", display: "flex", alignItems: "center",
        justifyContent: "center" }}>
        <div className="tap" role="button" style={{ width: 62, height: 62, borderRadius: 99,
          background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.35)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={C.blue}><path d="M8 5v14l11-7z" /></svg>
        </div>
        <span style={{ position: "absolute", left: 12, bottom: 10, fontSize: 12, fontWeight: 600,
          color: "rgba(255,255,255,.75)" }}>1-minute video · placeholder</span>
      </div>
      <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.55, padding: "12px 2px 8px" }}>{blurb}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
        color: C.ter, padding: "6px 2px 6px" }}>Other guides</div>
      <Card style={{ padding: "2px 16px" }}>
        {others.map((k, i) => (
          <div key={k} className="tap" role="button" onClick={() => setSel(k)}
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 0", cursor: "pointer",
              borderBottom: i === others.length - 1 ? "none" : `0.5px solid ${C.line}` }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: C.blueSoft, color: C.blue,
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{TAB_VIDEOS[k][0]}</span>
            <Icon d={icons.chevron} size={14} color={C.ter} sw={2.2} />
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 13, color: C.ter, lineHeight: 1.5, padding: "10px 2px 4px" }}>
        Watch these as often as you like — nothing here changes your record.
      </div>
    </Sheet>
  );
};

const Fab = ({ tab, open, setOpen, onAction, bottom = 84 }) => (
  <>
    {open && (
      <div onClick={() => setOpen(false)}
        style={{ position: "absolute", inset: 0, zIndex: 21, background: "rgba(10,30,55,.42)" }} />
    )}
    <div style={{ position: "absolute", right: 14, bottom, zIndex: 22,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
      {open && FAB_ORDER[tab].map((id, i) => {
        const a = FAB_ACTIONS[id];
        return (
          <button key={id} className="tap fabItem" style={{ animationDelay: `${i * 0.04}s`,
            display: "flex", alignItems: "center", gap: 10, border: "none", background: C.card,
            color: C.ink, borderRadius: 99, padding: "12px 18px", fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT, boxShadow: "0 6px 20px rgba(0,0,0,.18)" }}
            onClick={() => { setOpen(false); onAction(id); }}>
            <span style={{ color: C.blue }}><Icon d={a.icon} size={19} /></span>
            {a.label}
          </button>
        );
      })}
      <button className="tap" onClick={() => setOpen(!open)} aria-label="Recall actions"
        style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
        <RecallOrb size={58} glow={open} />
      </button>
    </div>
  </>
);

/* ----------------------------- shell ------------------------------- */

/* Today & Meds (live, no top CTA) lead; the three "add" tabs follow */
const TABS = [
  { id: "today", label: "Today", icon: icons.today },
  { id: "meds", label: "Meds", icon: icons.meds },
  { id: "journal", label: "Journal", icon: icons.journal },
  { id: "visits", label: "Visits", icon: icons.visits },
  { id: "docs", label: "Documents", icon: icons.docs },
];

export default function App() {
  const [period, setPeriodRaw] = useState("day1");
  const [tab, setTab] = useState("today");
  const [page, setPage] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [callMode, setCallMode] = useState("voice");
  const [fabOpen, setFabOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [welcomeClosed, setWelcomeClosed] = useState(false);
  const [finalizeStage, setFinalizeStage] = useState(null);
  /* the week-2 planted slip's verdict — null (marked, undecided) ·
     "fixed" · "kept". App-level on purpose: a repair that un-fixed
     itself when she left the page would be a trust bug. */
  const [entrySlip, setEntrySlip] = useState(null);
  const [callScenario, setCallScenario] = useState("base");
  const [captured, setCaptured] = useState([]);
  const [reviewScan, setReviewScan] = useState(null); /* cap title being scanned from the review */
  const [reviewPreview, setReviewPreview] = useState(false); /* bench: review opened from the gallery */
  const [reopenFlow, setReopenFlow] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [finalizeCelebrate, setFinalizeCelebrate] = useState(false);
  const [insightBoost, setInsightBoost] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [orbLab, setOrbLab] = useState(false);
  const [hdrCollapsed, setHdrCollapsed] = useState(false);
  /* the owner-exit receipt: the finished onboarding's own facts, so day 1
     can read back THE setup that just happened. Cleared when a demo
     period is picked — the menu's Day 1 is Amma's, with her assisted
     beginning; the seam between the two is named on the receipt itself. */
  const [obSummary, setObSummary] = useState(null);
  const [todayAlt, setTodayAlt] = useState(true);    /* ••• menu: Today design — V3 header-horizon
                                                        is the default (signed off on the design
                                                        canvas); Classic stays switchable until the
                                                        sign-off window closes, then gets deleted */
  /* on an actual phone the bezel is a picture, not an app — go full-bleed.
     Desktop keeps the framed presentation for canvas viewing. */
  const [frameless, setFrameless] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 560px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    const on = (e) => setFrameless(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  /* appearance — set from You → Appearance; applied before anything styles */
  const [darkMode, setDarkMode] = useState(false);
  const [textSize, setTextSize] = useState("Normal");
  applyTheme(darkMode);
  CHROMELESS = frameless;
  CURRENT_PERIOD = period;
  const tScale = TEXT_SIZES[textSize] || 1;
  useEffect(() => {
    /* the page ground behind the app (rubber-band, letterbox) follows */
    document.documentElement.style.background = darkMode ? THEME_DARK.bg : "";
    document.body.style.background = darkMode ? THEME_DARK.bg : "";
  }, [darkMode]);
  const mainScroll = useRef(null);
  const [medsCelebrate, setMedsCelebrate] = useState(false);
  /* the visit pipeline: null → 0..5 (completed steps) → "done". Lives
     at app level so the Visits card and an early-opened page read the
     SAME clock — the story can't fork between surfaces. */
  const [visitProc, setVisitProc] = useState(null);
  /* upcoming visits the user adds by hand; freshUpId marks the one
     still settling from skeleton to row */
  const [customVisits, setCustomVisits] = useState([]);
  const [freshUpId, setFreshUpId] = useState(null);
  const [docStage, setDocStage] = useState(null);
  const [tourStep, setTourStep] = useState(null);
  const [doseLog, setDoseLog] = useState(() => defaultDoseLog("day1"));
  const [anLog, setAnLog] = useState([]);
  const [logSheet, setLogSheet] = useState(null);
  const [checkinChooser, setCheckinChooser] = useState(null);
  const [customMeds, setCustomMeds] = useState([]);
  const [toast, setToast] = useState(null);
  /* the topics layer — ids followed via the review's proposal card, and
     per-topic lifecycle overrides (pause · resolve · rename · stop),
     every one of them Amma's own act on the topic's page */
  const [followedTopics, setFollowedTopics] = useState([]);
  const [topicStates, setTopicStates] = useState({});
  const setTopicState = (id, patch) =>
    setTopicStates((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
  /* Sarah's suggested eye exam — pending row in Visits until approved */
  const [eyeApproved, setEyeApproved] = useState(false);
  /* the rest of the month-1 request matrix — each yes lands in place */
  const [followupApproved, setFollowupApproved] = useState(false); // Dr. Patel · October
  const [oseiMoved, setOseiMoved] = useState(false);               // Aug 21 → Aug 28
  const [metDoseUp, setMetDoseUp] = useState(false);               // Metformin 500 → 850
  const [aspirinAdded, setAspirinAdded] = useState(false);         // new med from the visit

  /* care spaces — device, room state, sharing state */
  const [device, setDeviceRaw] = useState("amma");
  const [thataTaken, setThataTaken] = useState(new Set(["t-lis"]));
  const [thataMedChanged, setThataMedChanged] = useState(false);
  const [thataMedAdded, setThataMedAdded] = useState(false);
  const [noteAdded, setNoteAdded] = useState(false);
  const [invited, setInvited] = useState(false);
  /* the hello exchange — null · "asked" · "passed" (she closed it
     warmly; Sarah never learns which) · a string = her line back */
  const [hello, setHello] = useState(null);
  const [sarahRemoved, setSarahRemoved] = useState(false);
  /* the request she just declined — held so the warm-no sheet can name
     it. The no itself is already recorded before this is ever set. */
  const [declineReq, setDeclineReq] = useState(null);
  /* the profile: one fact grows by consent; removals wait with an Undo */
  const [diabetesAdded, setDiabetesAdded] = useState(false);
  const [profileRemoved, setProfileRemoved] = useState({});
  const [factShares, setFactShares] = useState({
    sarah: { visits: true, refills: false, meds: false },
    denise: { meds: true, adherence: true, visits: true, refills: true },
  });
  const [sarahSugs, setSarahSugs] = useState(SARAH_SUGGESTIONS);

  const showToast = (msg, ms = 4600) => {
    buzz();   /* if it's worth a toast, it's worth a tick */
    setToast(msg);
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(null), ms);
  };

  useEffect(() => { showToast(PERIOD_NOTES.day1, 5600); }, []);

  /* each tab starts at the top with the large title open */
  useEffect(() => {
    setHdrCollapsed(false);
    if (mainScroll.current) mainScroll.current.scrollTop = 0;
  }, [tab, device, period]);

  /* nothing is sudden — staged transitions */
  useEffect(() => {
    if (sheet === "processing") {
      const t = setTimeout(() => {
        setSheet(null); setPageData(null); setReviewPreview(false); setPage("review");
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [sheet]);
  useEffect(() => {
    if (finalizeStage === "processing") {
      const t = setTimeout(() => {
        setFinalizeStage("done");
        setFinalizeCelebrate(true);
        buzz(BUZZ_THUMP);   /* the day is kept — the one moment that thumps */
        setTimeout(() => setFinalizeCelebrate(false), 2100);
        /* V3 · E2 — the toast names the brief the day's words just improved,
           the causal link a persistent chip can never say */
        const v3NextVisit = (VISITS[period] || [])[0];
        showToast(
          reopenFlow
            ? "Evening note added — the entry now shows both, with times ✓"
            : todayAlt && v3NextVisit
            ? `Today's entry is written — it just went into ${v3NextVisit.title.split("·")[0].trim()}'s brief ✓`
            : captured.length
            ? `Day kept ✓ ${captured.length} more thing${captured.length > 1 ? "s" : ""} from the talk filed where ${captured.length > 1 ? "they belong" : "it belongs"}`
            : "Day kept ✓ Tap the card any time to read it",
          3000
        );
        if (reopenFlow) { setReopened(true); setReopenFlow(false); }
      }, 3200);
      return () => clearTimeout(t);
    }
  }, [finalizeStage]);
  useEffect(() => {
    if (docStage === "processing") {
      const t = setTimeout(() => {
        setDocStage("done");
        showToast("Filed under Lab results — tap it to review ✓", 3000);
      }, 5600);
      return () => clearTimeout(t);
    }
  }, [docStage]);
  /* the recorded visit's pipeline — saving ticks fast (it's already
     true), the four writing steps take their honest seconds, and the
     finish announces itself wherever she is */
  useEffect(() => {
    if (typeof visitProc !== "number") return;
    if (visitProc >= VISIT_STEPS.length) {
      const t = setTimeout(() => {
        setVisitProc("done");
        buzz(BUZZ_THUMP);
        showToast("Dr. Chen's visit is ready — transcript & plain-language summary ✓", 4200);
      }, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisitProc(visitProc + 1), visitProc === 0 ? 700 : 2700);
    return () => clearTimeout(t);
  }, [visitProc]);
  /* a care note has its own pipeline — it files to HIS record as HER
     words; no review screen, no tab switch, back to the room it came from */
  useEffect(() => {
    if (sheet === "noteProcessing") {
      const t = setTimeout(() => {
        setSheet(null); setNoteAdded(true); setPage("room");
        showToast("Note filed in Thatha's record — marked “From Amma,” his to read ✓", 3400);
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [sheet]);

  const setPeriod = (p) => {
    setPeriodRaw(p);
    setDoseLog(defaultDoseLog(p)); setAnLog([]); setLogSheet(null); setCheckinChooser(null);
    setPage(null); setPageData(null); setSheet(null); setFabOpen(false); setMenuOpen(false);
    setWelcomeClosed(false); setFinalizeStage(null); setVisitProc(null);
    setCustomVisits([]); setFreshUpId(null);
    setDocStage(null); setTourStep(null); setCustomMeds([]);
    setCallScenario("base"); setCaptured([]); setReopenFlow(false); setReopened(false); setEntrySlip(null);
    setReviewPreview(false); setFollowedTopics([]); setTopicStates({}); setEyeApproved(false);
    setFollowupApproved(false); setOseiMoved(false); setMetDoseUp(false); setAspirinAdded(false);
    setFinalizeCelebrate(false); setInsightBoost(false); setMedsCelebrate(false);
    setNoteAdded(false); setThataMedChanged(false); setThataMedAdded(false); setHello(null);
    setSarahSugs(SARAH_SUGGESTIONS); setDiabetesAdded(false); setProfileRemoved({});
    showToast(PERIOD_NOTES[p], 5600);
  };

/* internal preview control — which PHONE we're holding */
  const setDevice = (d) => {
    setDeviceRaw(d);
    setPage(null); setPageData(null); setSheet(null); setFabOpen(false); setMenuOpen(false);
    setTourStep(null);
    showToast(DEVICE_NOTES[d], 5600);
  };

  const toggleThataDose = (id) =>
    setThataTaken((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const doses = [
    /* confirmed record changes reach Today's list too — the 850 name
       and the new aspirin dose appear the moment she says yes */
    ...DOSES[period].map((d) =>
      metDoseUp && d.name === "Metformin 500 mg" ? { ...d, name: "Metformin 850 mg" } : d),
    ...(period === "month1" && aspirinAdded
      ? [{ id: "asp-am", name: "Aspirin 81 mg", time: "Morning", slot: "morning" }] : []),
    ...customMeds.filter((m) => !m.asNeeded).flatMap((m) =>
      (m.slots && m.slots.length ? m.slots : [{ key: "morning", ...SLOTS.morning }]).map((s) => ({
        id: `${m.id}-${s.key}`, name: `${m.name} ${m.dose}`, time: m.when, look: m.look, slot: s,
      }))),
  ];
  const anMeds = [
    ...BASE_ASNEEDED[period],
    ...customMeds.filter((m) => m.asNeeded).map((m) => ({ id: m.id, name: `${m.name} ${m.dose}`, look: m.look })),
  ];
  const doseGroups = groupDoses(doses);

  /* the request roll-up, minus what's been decided — a decided item
     leaves Updates everywhere the moment its yes lands in place */
  const decidedNeeds = { visit: eyeApproved, followup: followupApproved, oseimove: oseiMoved,
    metdose: metDoseUp, aspirin: aspirinAdded, profile: diabetesAdded,
    ins: docStage === "done", intake: docStage === "done" };

  /* what the recorded visit heard that would CHANGE the record — each
     one is the existing month-1 request, reachable from the visit page
     itself. The transcript is a record; changes still wait for a yes. */
  const visitNoticed = [
    { id: "metdose", title: "Metformin 500 → 850 mg", icon: icons.meds,
      sub: "Dr. Chen raised it — your cabinet updates only with your OK",
      done: metDoseUp, need: needById("month1", "metdose") },
    { id: "aspirin", title: "New medication: aspirin 81 mg", icon: icons.meds,
      sub: "One each morning — waits for your yes",
      done: aspirinAdded, need: needById("month1", "aspirin") },
  ];
  /* ONE mailbox, two views. A suggestion Sarah sends isn't copied onto
     Amma's phone — the same object is read through needFromSug, so it
     can't drift from the card she previewed, and it leaves her Updates
     the moment she answers, because answering IS what moves its status
     on Sarah's list. A canon request with a twin obeys the same rule:
     decide it here, and the row on the other phone stops saying
     "Waiting" — even when the verdict was no. */
  const sugAnswered = {};
  sarahSugs.forEach((s) => { if (s.status !== "wait") sugAnswered[s.id] = true; });
  const liveNeeds = sarahSugs.filter((s) => s.f && s.status === "wait")
    .map(needFromSug).filter(Boolean);
  const openNeeds = [
    ...liveNeeds,
    ...(NEEDS[period] || []).filter((n) => !decidedNeeds[n.id] && !(n.sugId && sugAnswered[n.sugId])),
  ];
  const waitingNeeds = openNeeds.filter((n) => !n.applied);
  /* what's new on SARAH's phone: answers that landed while she was away */
  const freshAnswers = sarahSugs.filter((s) => s.ansAt);
  const answerSug = (id, status, ans) => setSarahSugs((p) =>
    p.map((s) => (s.id === id ? { ...s, status, ans, ansAt: "Just now" } : s)));
  const filedForSarah = () => {
    if (period === "month1") {
      answerSug("intake", "yes", "Amma signed and scanned it — it's in her Documents, on Dr. Osei's brief.");
    }
  };

  /* the Logged trail: one event per recorded time, scheduled + as-needed */
  const eventsMap = new Map();
  doses.forEach((d) => {
    const l = doseLog[d.id];
    if (!l) return;
    if (!eventsMap.has(l.time)) eventsMap.set(l.time, []);
    eventsMap.get(l.time).push({ id: d.id, d, name: d.name, look: d.look || MED_LOOKS[d.name], status: l.status });
  });
  anLog.forEach((e) => {
    if (!eventsMap.has(e.time)) eventsMap.set(e.time, []);
    eventsMap.get(e.time).push({ name: e.name, look: e.look, status: "taken", an: true });
  });
  const logEvents = [...eventsMap.entries()]
    .map(([time, items]) => ({ time, items, rel: time === NOW_TIME ? "Just now" : "Earlier" }))
    .sort((a, b) => parseClock(a.time) - parseClock(b.time));

  const celebrateIfDone = (log) => {
    if (doses.length > 0 && doses.every((d) => log[d.id]?.status === "taken")) {
      showToast("That's every medication today — lovely ✓", 2600);
      buzz(BUZZ_THUMP);
      setMedsCelebrate(true);
      setTimeout(() => setMedsCelebrate(false), 2100);
    }
  };
  const logDose = (id, status, stampTime = NOW_TIME) =>
    setDoseLog((prev) => {
      const n = { ...prev };
      if (!status) delete n[id]; else n[id] = { status, time: stampTime };
      if (status === "taken") celebrateIfDone(n);
      return n;
    });
  const logAllGroup = () => {
    const g = doseGroups.find((x) => `time:${x.key}` === logSheet);
    if (!g) return;
    setDoseLog((prev) => {
      const n = { ...prev };
      g.items.forEach((d) => { if (!n[d.id]) n[d.id] = { status: "taken", time: NOW_TIME }; });
      celebrateIfDone(n);
      return n;
    });
    setLogSheet(null);
    showToast(`${g.time} medications — all logged at ${NOW_TIME} ✓`, 2600);
  };
  const logAsNeeded = (m) => {
    setAnLog((prev) => [...prev, { name: m.name, time: NOW_TIME, look: m.look }]);
    showToast(`${shortMedName(m.name)} logged at ${NOW_TIME} — it's in your journal ✓`, 2600);
  };
  const removeMed = (id) => {
    setCustomMeds((prev) => prev.filter((m) => m.id !== id));
    showToast("Removed from your cabinet ✓", 2200);
  };
  const updateMed = (id, patch) =>
    setCustomMeds((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const openPage = (name, data = null) => { setPageData(data); setPage(name); };
  const startTour = () => {
    setSheet(null); setPage(null); setFabOpen(false); setMenuOpen(false);
    setTab("today"); setTourStep(0);
  };

  /* openCall/openChat accept an optional scenario id — click events are
     ignored, so existing onClick={ui.openCall} callers stay safe */
  const startConversation = (scen, m) => {
    const s = typeof scen === "string" ? scen : "base";
    setCallScenario(s);
    setReopenFlow(s === "reopen");
    setCaptured([]);
    setCallMode(m);
    setSheet("call");
  };

  /* review → "keep talking": reopen the SAME conversation (same mode,
     captured items kept) with a short re-entry beat, not a replay.
     A scoped scenario (say-it-again) re-enters the talk about ONE fact. */
  const resumeConversation = (scen = "resume") => {
    setCallScenario(typeof scen === "string" ? scen : "resume");
    setSheet("call");
  };

  const ui = {
    goTab: setTab,
    openPage,
    openSheet: setSheet,
    openCall: (scen) => startConversation(scen, "voice"),
    openChat: (scen) => startConversation(scen, "chat"),
    openCheckin: (scen) => setCheckinChooser(typeof scen === "string" ? scen : "base"),
    openVisit: (v) => openPage("visitDetail", v),
    openRequest: (r) => openPage("request", r),
  };

  /* room FABs — same face, role-scoped actions */
  const roomFab = (id) => {
    if (id === "carenote") startConversation("carenote", "voice");
    else if (id === "med") openPage("roomAddMed");
    else if (id === "roomVisit") openPage("roomVisit");
    else if (id === "doc") setSheet("roomAddDoc");
    else if (id === "howRoom") setSheet("roomHow");
  };
  const sarahFab = (id) => {
    if (id === "suggest") openPage("famSuggest");
    else if (id === "askUpdate") setSheet("askHello");
    else if (id === "sendDoc") {
      setSarahSugs((p) => [{ id: "doc" + p.length, t: "Sent the insurance card photo", status: "wait",
        s: "Files only when Amma says yes" }, ...p]);
      showToast("Offered — it files only when Amma says yes ✓", 3000);
    }
    else if (id === "howFam") setSheet("famHow");
  };

  const screens = {
    today: todayAlt
      ? <TodayScreenV3 period={period} ui={ui} doses={doses} doseLog={doseLog} anMeds={anMeds}
          openLog={setLogSheet} needs={waitingNeeds} finalizeStage={finalizeStage} reopened={reopened}
          finalizeCelebrate={finalizeCelebrate} medsCelebrate={medsCelebrate} insightBoost={insightBoost}
          obSummary={obSummary} visitRecorded={visitProc != null} />
      : <TodayScreen period={period} ui={ui} doses={doses} doseLog={doseLog}
          anMeds={anMeds} anLog={anLog} logEvents={logEvents} openLog={setLogSheet} needs={waitingNeeds}
          welcomeClosed={welcomeClosed} closeWelcome={() => setWelcomeClosed(true)}
          finalizeStage={finalizeStage} reopened={reopened}
          finalizeCelebrate={finalizeCelebrate} medsCelebrate={medsCelebrate} insightBoost={insightBoost}
          visitRecorded={visitProc != null} />,
    journal: <JournalScreen period={period} ui={ui} finalizeStage={finalizeStage} reopened={reopened}
      followed={followedTopics} topicStates={topicStates} obSelf={!!obSummary} />,
    visits: <VisitsScreen period={period} ui={ui} visitProc={visitProc}
      eyeApproved={eyeApproved} followupApproved={followupApproved} oseiMoved={oseiMoved}
      customVisits={customVisits} freshUpId={freshUpId} />,
    meds: <MedsScreen period={period} ui={ui} doses={doses} doseLog={doseLog}
      anMeds={anMeds} anLog={anLog} logEvents={logEvents} openLog={setLogSheet}
      medsCelebrate={medsCelebrate} customMeds={customMeds} removeMed={removeMed} showToast={showToast}
      metDoseUp={metDoseUp} aspirinAdded={aspirinAdded} />,
    docs: <DocsScreen period={period} ui={ui} docStage={docStage} />,
  };

  const headerTitle = device === "sarah"
    ? "People"
    : tab === "today"
      ? "Good morning, Amma"
      : tab === "meds" ? "Medications"
      : TABS.find((t) => t.id === tab).label;
  /* Today carries the date under the greeting — orientation without a card */
  const headerSub = device !== "sarah" && tab === "today"
    ? { day1: "Tuesday, July 21", week1: "Tuesday, July 28", week2: "Thursday, July 30",
        visitday: "Friday, July 31", month1: "Thursday, August 13" }[period]
    : null;

  /* V3 · A2 — the nearest visit as ONE line riding with the date. Never a
     list; hidden on visit day, where the hero owns the top (the ladder's
     last rung). Tap lands on the visit itself — ONE target, one
     destination. No "+N more": two adjacent taps on one short line read
     as one control and split under the thumb, and the full list already
     lives one scroll down in "The days ahead". */
  const v3AheadVisit = todayAlt && device === "amma" && tab === "today" && period !== "visitday"
    ? (VISITS[period] || [])[0] : null;
  const v3AheadLine = v3AheadVisit
    ? (() => {
        const name = v3AheadVisit.title.split("·")[0].trim();
        const segs = v3AheadVisit.date.split("·").map((s) => s.trim());
        const text = segs[0] === "Tomorrow"
          ? `Next: ${name} tomorrow · ${segs[1] || ""}`.trim()
          : segs[1] && /day/.test(segs[1])
          ? `Next: ${name} · ${segs[1]}`
          : `Next: ${name} · ${segs[0]}`;
        return { text };
      })()
    : null;
  /* collapsed bar shows the TAB name — greeting is a moment, not a label */
  const compactTitle = device === "sarah" ? "People"
    : tab === "today" ? "Today"
    : tab === "meds" ? "Medications"
    : TABS.find((t) => t.id === tab).label;

  /* the bell counts requests about YOUR record (v9, unchanged).
     News from rooms you help = a DOT on the avatar — never a number. */
  /* a waiting hello counts on her bell like any ask — one mailbox */
  const badge = device === "sarah" ? 0 : waitingNeeds.length + (hello === "asked" ? 1 : 0);
  const thataNewsCount = THATHA_NEWS[period].length;
  const avatarDot = device === "amma" ? thataNewsCount > 0 : true;

  return (
    <div style={{ minHeight: frameless ? "100dvh" : "100vh", background: frameless ? C.bg : C.canvas,
      fontFamily: FONT, color: C.ink, display: "flex", overflow: "hidden",
      /* frameless anchors left: the scaled shell's layout box is narrower
         than its visual box, and scaling grows from the left edge */
      justifyContent: frameless ? "flex-start" : "center",
      alignItems: frameless ? "stretch" : "flex-start", padding: frameless ? 0 : "16px 8px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; }
        .tap { transition: transform .08s ease, opacity .08s ease; }
        .tap:active { transform: scale(.97); opacity: .85; }
        .tabbtn { flex: 1; border: none; background: transparent; cursor: pointer;
                  display: flex; flex-direction: column; align-items: center; gap: 3px;
                  padding: 7px 0 4px; font-family: ${FONT}; }
        .scroll::-webkit-scrollbar { display: none; }
        .fadeMsg { animation: fadeUp .45s ease; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .orbPulse { animation: orbPulse .8s ease; }
        @keyframes orbPulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,.34); }
          70% { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } }
        .orbTell { animation: orbTell .65s ease; }
        @keyframes orbTell { 0% { box-shadow: 0 0 0 0 rgba(0,122,255,.35); }
          70% { box-shadow: 0 0 0 9px rgba(0,122,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,122,255,0); } }
        .sheetIn { animation: sheetUp .28s ease; }
        @keyframes sheetUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }
        .pageIn { animation: pageIn .26s ease; }
        @keyframes pageIn { from { transform: translateX(46px); opacity: 0; } to { transform: none; opacity: 1; } }
        .wave { animation: wave 1s ease-in-out infinite alternate; }
        @keyframes wave { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
        .blink { animation: blink 1.2s ease-in-out infinite; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        .toastIn { animation: toastUp .3s ease; }
        @keyframes toastUp { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
        .fabItem { animation: fabPop .22s ease backwards; }
        @keyframes fabPop { from { transform: translateY(10px) scale(.9); opacity: 0; } to { transform: none; opacity: 1; } }
        .orbEye, .eyeBreathe { transform-box: fill-box; transform-origin: center; }
        .orbEye { animation: blinkEyes 4.6s ease-in-out infinite; }
        @keyframes blinkEyes { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.12); } 97% { transform: scaleY(1); } }
        .eyeBreathe { animation: eyeBreathe 1.5s ease-in-out infinite alternate; }
        @keyframes eyeBreathe { from { transform: scaleY(1); } to { transform: scaleY(1.16); } }
        .orbRing { animation: ringPulse 1.5s ease-out infinite; }
        @keyframes ringPulse { from { transform: scale(1); opacity: .7; } to { transform: scale(1.55); opacity: 0; } }
        .thoughtDot { animation: thoughtDot 2.1s ease-in-out infinite; }
        @keyframes thoughtDot { 0% { opacity: .15; transform: translateY(3px) scale(.8); } 45% { opacity: 1; transform: none; } 100% { opacity: .15; transform: translateY(-4px) scale(.9); } }
        .sideArc { animation: sideArc 1s ease-in-out infinite alternate; }
        @keyframes sideArc { from { opacity: .25; transform: scale(.9); } to { opacity: 1; transform: scale(1.06); } }
        .sparklePop { animation: sparklePop 1.6s ease-in-out infinite alternate; }
        @keyframes sparklePop { from { opacity: .4; transform: scale(.75) rotate(-8deg); } to { opacity: 1; transform: scale(1.15) rotate(10deg); } }
        .rayPulse { animation: rayPulse 1.8s ease-in-out infinite alternate; }
        @keyframes rayPulse { from { opacity: .55; transform: translate(-50%,-50%) scale(.96); } to { opacity: 1; transform: translate(-50%,-50%) scale(1.05); } }
        .confetti { position: absolute; bottom: 32%; animation: confettiFly 1.5s ease-out forwards; }
        @keyframes confettiFly { 0% { transform: translate(0, 8px) scale(.4) rotate(0deg); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(var(--dx, 10px), -80px) scale(1) rotate(230deg); opacity: 0; } }
        .wavebar { display: inline-block; width: 3px; border-radius: 99px; background: currentColor; animation: wavebar .9s ease-in-out infinite alternate; transform-origin: bottom; }
        @keyframes wavebar { from { transform: scaleY(.4); } to { transform: scaleY(1); } }
        .skel { background: linear-gradient(90deg, ${C.track} 25%, ${C.card} 37%, ${C.track} 63%); background-size: 400% 100%;
                animation: skel 1.2s infinite; border-radius: 6px; }
        @keyframes skel { from { background-position: 100% 0; } to { background-position: 0 0; } }
        .menuIn { animation: menuPop .18s ease; transform-origin: top right; }
        @keyframes menuPop { from { transform: scale(.92); opacity: 0; } to { transform: none; opacity: 1; } }
        .kbIn { animation: sheetUp .22s ease; }
        .chipPop { animation: chipPop .32s ease backwards; }
        @keyframes chipPop { from { transform: scale(.6) translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
        .termIn { animation: chipPop .3s ease backwards; }
        .dockIn { animation: sheetUp .32s ease; }
        .barIn { animation: barIn .15s ease; transform-origin: center; }
        @keyframes barIn { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
        .scanline { animation: scanline 1.1s ease-in-out infinite alternate; }
        @keyframes scanline { from { top: 5%; } to { top: 92%; } }
        .wobble { animation: wobble 3.4s ease-in-out infinite alternate; }
        @keyframes wobble { from { transform: translate(-50%,-52%) rotate(-.7deg); } to { transform: translate(calc(-50% + 3px),calc(-52% - 3px)) rotate(.8deg); } }
        .flashFade { animation: flashFade .34s ease-out forwards; }
        @keyframes flashFade { from { opacity: .95; } to { opacity: 0; } }
        .quadPulse { animation: quadPulse 1.3s ease-in-out infinite alternate; }
        @keyframes quadPulse { from { opacity: .55; } to { opacity: .95; } }
        .stepIn { animation: fadeUp .4s ease backwards; }
        .splashField { animation: splashField 1.15s cubic-bezier(.3,.75,.25,1) both; }
        @keyframes splashField { 0% { transform: scale(7.5); } 100% { transform: scale(1); } }
        .splashBg { animation: splashBg 1.15s ease both; }
        @keyframes splashBg { 0% { opacity: 1; } 35% { opacity: 1; } 100% { opacity: 0; } }
        .splashEye { animation: eyeBreathe 1.5s ease-in-out infinite alternate; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div style={frameless
        ? { width: "100%" }
        : { background: "#0F1114", borderRadius: 46, padding: 10,
            boxShadow: "0 24px 60px rgba(15,17,20,.32)", width: "min(414px, 100%)",
            /* the bezel wraps the shell's LAYOUT box, which shrinks when the
               shell is scaled — pin the visual height explicitly */
            height: "calc(max(min(860px, 100vh - 52px), 640px) + 20px)" }}>
        <div style={{ background: C.bg, overflow: "hidden", display: "flex",
          flexDirection: "column", position: "relative",
          /* text size scales the whole UI via transform (identical on Safari
             and Chromium — CSS zoom is not); the layout box is divided back
             down so the visual size is constant: content grows, the phone
             doesn't. Radius divides too, so corners render unchanged. */
          transform: tScale !== 1 ? `scale(${tScale})` : undefined,
          transformOrigin: "top left",
          borderRadius: frameless ? 0 : 38 / tScale,
          width: `${100 / tScale}%`,
          height: frameless
            ? `calc(100dvh / ${tScale})`
            : `calc(max(min(860px, 100vh - 52px), 640px) / ${tScale})`,
          paddingTop: frameless ? `calc((env(safe-area-inset-top) + 6px) / ${tScale})` : 0 }}>

          {/* collapsing large-title header (the iOS pattern): profile LEFT,
              actions RIGHT, one quiet bar — and the big greeting lives
              below it, shrinking into the bar as you scroll. Same skeleton
              on every tab; only the words change. */}
          {/* NO z-index here: pages, sheets and calls are absolute overlays
              that must paint OVER this header. Content never scrolls under
              it (the scroller is a sibling below), so it needs no background
              or stacking of its own — just the collapse hairline. */}
          <div style={{ padding: "14px 20px 0", flexShrink: 0,
            boxShadow: hdrCollapsed ? "0 0.5px 0 rgba(0,0,0,.12)" : "none",
            transition: "box-shadow .25s ease" }}>
            {/* the fake status row belongs to the fake bezel. Full-bleed on a
                real phone drops it entirely — no fake clock under a real one,
                no orphaned strip of dots — and the ••• moves into the header
                bar as a quiet ghost pill beside Updates. */}
            {/* the preview menu has NO visible chrome — the tab title is its
                hidden door (tap the greeting / the compact title). The 9:41
                is bezel decor only. */}
            {!frameless && (
              <div style={{ display: "flex", fontSize: 13, fontWeight: 600, color: C.sub }}>
                <span>9:41</span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0" }}>
              <button className="tap" onClick={() => setSheet("profile")} aria-label="Your circle"
                style={{ width: 44, height: 44, margin: -4, borderRadius: 99, border: "none", flexShrink: 0,
                  background: "none", cursor: "pointer", padding: 4, fontFamily: FONT }}>
                <span style={{ width: 36, height: 36, borderRadius: 99, display: "flex",
                  alignItems: "center", justifyContent: "center", position: "relative",
                  background: C.blue, color: "#fff", fontSize: 15, fontWeight: 700 }}>
                {device === "sarah" ? "S" : "A"}
                {avatarDot && (
                  <span style={{ position: "absolute", top: -1, right: -1, width: 11, height: 11,
                    borderRadius: 99, background: C.orange, border: `2px solid ${C.bg}` }} />
                )}
                </span>
              </button>
              <div style={{ flex: 1, minWidth: 0, opacity: hdrCollapsed ? 1 : 0,
                transform: hdrCollapsed ? "none" : "translateY(7px)",
                transition: "opacity .22s ease, transform .25s ease",
                pointerEvents: hdrCollapsed ? "auto" : "none" }}>
                <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Preview controls"
                  style={{ border: "none", background: "none", padding: 0, fontFamily: FONT,
                    fontSize: 17.5, fontWeight: 700, letterSpacing: "-.01em", color: C.ink,
                    cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden",
                    textOverflow: "ellipsis", maxWidth: "100%" }}>{compactTitle}</button>
              </div>
              {/* words, not glyphs — this audience reads labels, not icons.
                  "Help" is the question (the video is the answer, inside);
                  "Updates" names exactly the sheet it opens. */}
              {device === "amma" && (
                <button className="tap" onClick={() => setSheet("videoHelp")} aria-label="How this tab works"
                  style={{ height: 40, minWidth: 40, borderRadius: 99, border: "none", flexShrink: 0,
                    background: C.card, color: C.blue, cursor: "pointer",
                    padding: hdrCollapsed ? "0 9.5px" : "0 12px",
                    boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)", fontFamily: FONT,
                    /* centered — collapsed, the icon alone sits inside the
                       40px minWidth; without this it hugs the left edge */
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "padding .28s ease" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9.5" />
                    <path d="M9.3 9.2a2.7 2.7 0 1 1 4.2 2.6c-.9.6-1.5 1.1-1.5 2.1" />
                    <path d="M12 17.2h.01" />
                  </svg>
                  <span style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden",
                    whiteSpace: "nowrap", maxWidth: hdrCollapsed ? 0 : 56,
                    opacity: hdrCollapsed ? 0 : 1, marginLeft: hdrCollapsed ? 0 : 6,
                    transition: "max-width .28s ease, opacity .18s ease, margin-left .28s ease" }}>
                    Help
                  </span>
                </button>
              )}
              <button className="tap" onClick={() => setSheet("updates")} aria-label="Updates"
                style={{ height: 40, minWidth: 40, borderRadius: 99, border: "none", flexShrink: 0,
                  background: C.card, color: C.blue, cursor: "pointer", position: "relative",
                  padding: hdrCollapsed ? "0 9.5px" : "0 12px",
                  boxShadow: "0 0 0 0.5px rgba(0,0,0,.06)", fontFamily: FONT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "padding .28s ease" }}>
                <Icon d={icons.bell} size={15} />
                <span style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden",
                  whiteSpace: "nowrap", maxWidth: hdrCollapsed ? 0 : 76,
                  opacity: hdrCollapsed ? 0 : 1, marginLeft: hdrCollapsed ? 0 : 6,
                  transition: "max-width .28s ease, opacity .18s ease, margin-left .28s ease" }}>
                  Updates
                </span>
                {badge > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -4, minWidth: 17, height: 17,
                    borderRadius: 99, background: C.orange, color: "#fff", fontSize: 11,
                    fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${C.bg}`, padding: "0 3px" }}>
                    {badge}
                  </span>
                )}
              </button>
            </div>

            <div style={{ maxHeight: hdrCollapsed ? 0 : v3AheadLine ? 165 : 130, opacity: hdrCollapsed ? 0 : 1,
              transform: hdrCollapsed ? "translateY(-8px)" : "none", overflow: "hidden",
              transition: "max-height .28s ease, opacity .2s ease, transform .28s ease" }}>
              <div style={{ padding: "2px 0 12px" }}>
                {/* the greeting WRAPS rather than truncates — an ellipsis in a
                    greeting is a small insult, and large text sizes need the
                    second line. It is also the HIDDEN DOOR to the internal
                    preview menu (periods · device · design · testing), so the
                    menu needs no visible chrome of its own. */}
                <div onClick={() => setMenuOpen(!menuOpen)} role="button" aria-label="Preview controls"
                  style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em",
                    lineHeight: 1.15, cursor: "pointer" }}>{headerTitle}</div>
                {headerSub && <div style={{ fontSize: 14, color: C.sub, marginTop: 1 }}>{headerSub}</div>}
                {v3AheadLine && (
                  /* visual height unchanged; padding + negative margin extend
                     the hit area to the 44pt HIG floor */
                  <button className="tap" onClick={() => openPage("visitDetail", v3AheadVisit)}
                    style={{ border: "none", background: "none", cursor: "pointer",
                      fontFamily: FONT, color: C.blue, fontSize: 14, fontWeight: 600,
                      display: "flex", alignItems: "center", gap: 5, minHeight: 44,
                      flexWrap: "wrap", textAlign: "left",
                      padding: "12px 10px", margin: "-9px -10px -8px" }}>
                    <Icon d={icons.visits} size={14} sw={2.1} />
                    {v3AheadLine.text}
                    <Icon d={icons.chevron} size={12} sw={2.4} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 50 }} />
              {/* the menu scrolls — a tester's tool must never hide its own
                  bottom rows off the phone (Device was unreachable) */}
              <div className="menuIn scroll" style={{ position: "absolute", top: frameless ? 64 : 44, right: 14,
                zIndex: 51, background: C.card, borderRadius: 14, boxShadow: "0 10px 34px rgba(0,0,0,.2)",
                padding: 6, width: 190, maxHeight: "72vh", overflowY: "auto",
                overscrollBehavior: "contain" }}>
                <button className="tap" onClick={() => { setMenuOpen(false); setOnboarding(true); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", border: "none", background: "transparent",
                    borderRadius: 10, padding: "11px 13px", fontSize: 15.5, fontWeight: 600,
                    color: C.ink, cursor: "pointer", fontFamily: FONT }}>
                  Onboarding
                  <RecallOrb size={18} />
                </button>
                <button className="tap" onClick={() => { setMenuOpen(false); setOrbLab(true); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", border: "none", background: "transparent",
                    borderRadius: 10, padding: "11px 13px", fontSize: 15.5, fontWeight: 600,
                    color: C.ink, cursor: "pointer", fontFamily: FONT }}>
                  Orb motion lab
                  <RecallOrb size={18} mood="delighted" />
                </button>
                <button className="tap" onClick={() => {
                    setMenuOpen(false); setCaptured(REVIEW_GALLERY.map((c) => ({ ...c })));
                    setReopenFlow(false); setReviewPreview(true); setPage("review");
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", border: "none", background: "transparent",
                    borderRadius: 10, padding: "11px 13px", fontSize: 15.5, fontWeight: 600,
                    color: C.ink, cursor: "pointer", fontFamily: FONT }}>
                  Review — every card variant
                  <Icon d={icons.flask} size={16} color={C.ter} />
                </button>
                <div style={{ height: 0.5, background: C.line, margin: "5px 8px" }} />
                {/* picking a demo period returns the world to Amma's canon —
                    the self-setup receipt belongs only to the freshly
                    finished flow */}
                {PERIODS.map((p) => (
                  <button key={p.id} className="tap" onClick={() => { setPeriod(p.id); setObSummary(null); }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", border: "none", background: period === p.id ? C.blueSoft : "transparent",
                      borderRadius: 10, padding: "11px 13px", fontSize: 15.5, fontWeight: 600,
                      color: period === p.id ? C.blue : C.ink, cursor: "pointer", fontFamily: FONT }}>
                    {p.label}
                    {period === p.id && <Icon d={icons.check} size={16} sw={2.6} />}
                  </button>
                ))}
                {/* "Today design · Classic" retired for real — one Today,
                    less menu to scroll */}
                <div style={{ height: 0.5, background: C.line, margin: "5px 8px" }} />
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                  color: C.ter, padding: "4px 13px 3px" }}>
                  Device
                </div>
                {[["amma", "Amma's phone"], ["sarah", "Sarah's phone"]].map(([id, label]) => (
                  <button key={id} className="tap" onClick={() => setDevice(id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", border: "none", background: device === id ? C.blueSoft : "transparent",
                      borderRadius: 10, padding: "11px 13px", fontSize: 15.5, fontWeight: 600,
                      color: device === id ? C.blue : C.ink, cursor: "pointer", fontFamily: FONT }}>
                    {label}
                    {device === id && <Icon d={icons.check} size={16} sw={2.6} />}
                  </button>
                ))}
                <div style={{ fontSize: 11.5, color: C.ter, padding: "8px 13px 6px" }}>
                  Internal preview control
                </div>
              </div>
            </>
          )}

          <div className="scroll" ref={mainScroll}
            onScroll={(e) => {
              /* collapse only when there's enough travel to STAY collapsed —
                 on short screens the collapse grows the viewport, the browser
                 clamps scrollTop back, the header re-expands, and the loop
                 reads as glitching. Hysteresis (26 in, 8 out) kills the
                 flicker at the boundary. */
              const el = e.currentTarget;
              const top = el.scrollTop;
              setHdrCollapsed((p) => {
                if (!p) return top > 26 && el.scrollHeight - el.clientHeight > 170;
                return top > 8;
              });
            }}
            style={{ flex: 1, overflowY: "auto", padding: "2px 16px 110px", scrollbarWidth: "none",
              overscrollBehavior: "contain" }}>
            {device === "sarah"
              ? <PeopleHome ui={ui} showToast={showToast} period={period}
                  newCount={2 + freshAnswers.length + (hello && hello !== "asked" && hello !== "passed" ? 1 : 0)} />
              : screens[tab]}
          </div>

          {toast && (
            <div className="toastIn" style={{ position: "absolute", bottom: 88, left: 14, right: 14,
              display: "flex", justifyContent: "center", zIndex: 45, pointerEvents: "none" }}>
              <div style={{ background: "rgba(20,24,30,.94)", color: "#fff",
                borderRadius: 16, padding: "12px 16px", fontSize: 14, fontWeight: 500, lineHeight: 1.45,
                boxShadow: "0 8px 24px rgba(0,0,0,.25)", maxWidth: 340 }}>
                {toast}
              </div>
            </div>
          )}

          <Fab tab={device === "sarah" ? "sarahHome" : tab} open={fabOpen} setOpen={setFabOpen}
            bottom={device === "sarah" ? 24 : 84}
            onAction={(id) => {
              if (device === "sarah") { sarahFab(id); return; }
              if (id === "checkin") ui.openCheckin();
              else if (id === "visit") setSheet("addVisit");
              else if (id === "med") openPage("addMed");
              else if (id === "doc") setSheet("addDoc");
              else if (id === "tour") startTour();
            }} />

          {device === "amma" && (
            <div style={{ flexShrink: 0, display: "flex", borderTop: `0.5px solid ${C.line}`,
              background: C.card,
              padding: frameless ? "2px 6px calc(10px + env(safe-area-inset-bottom))" : "2px 6px 10px" }}>
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button key={t.id} className="tabbtn tap"
                    onClick={() => { setTab(t.id); setPage(null); setFabOpen(false); }} aria-label={t.label}>
                    <div style={{ color: on ? C.blue : C.ter }}>
                      <Icon d={t.icon} size={24} sw={on ? 2.1 : 1.7} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: on ? 600 : 400, color: on ? C.blue : C.ter }}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* pages */}
          {page === "needs" && <NeedsPage needs={openNeeds} onBack={() => setPage(null)} openRequest={ui.openRequest} />}
          {page === "request" && pageData && (
            <RequestDetailPage req={pageData} onBack={() => setPage(null)}
              onDone={(verdict) => {
                const req = pageData;
                setPage(null);
                /* a yes lands IN PLACE: the pending row becomes the real
                   thing where it waited — and the item leaves Updates.
                   A "not now" changes nothing; it just keeps waiting.
                   A "no" is different: only a PERSON's ask can be told no,
                   and that verdict travels to their phone before the sheet
                   that offers her a word ever opens — so there is no way
                   out of this screen that leaves Sarah waiting. */
                if (verdict === "no") {
                  answerSug(req.sugId, "no", "Not this time — she didn't add a word.");
                  setDeclineReq(req);
                  return;
                }
                if (verdict === "yes" && req.sugId && req.actions[0] === "approve") {
                  answerSug(req.sugId, "yes", req.ansYes);
                }
                if (verdict === "later") {
                  showToast("It'll keep waiting — where it stands, and in Updates", 2600);
                } else if (pageData.id === "visit" && verdict === "yes") {
                  setEyeApproved(true); setTab("visits");
                  showToast("Added to Visits ✓ Sarah can see you said yes — nothing else to do", 3400);
                } else if (pageData.id === "followup" && verdict === "yes") {
                  setFollowupApproved(true); setTab("visits");
                  showToast("Drafted for October ✓ Recall will suggest dates closer to time", 3200);
                } else if (pageData.id === "oseimove" && verdict === "yes") {
                  setOseiMoved(true); setTab("visits");
                  showToast("Moved to August 28 ✓ Sarah can see it — the brief keeps building", 3200);
                } else if (pageData.id === "metdose" && verdict === "yes") {
                  setMetDoseUp(true); setTab("meds");
                  showToast("Cabinet updated to 850 mg ✓ Today's list already follows", 3200);
                } else if (pageData.id === "aspirin" && verdict === "yes") {
                  setAspirinAdded(true); setTab("meds");
                  showToast("Aspirin 81 mg added ✓ It's on Today's morning list", 3200);
                } else if (pageData.id === "profile" && verdict === "yes") {
                  /* the yes lands in place — the profile page opens with
                     the new fact standing in it, provenance and all */
                  setDiabetesAdded(true); openPage("healthProfile");
                  showToast("Added to your profile ✓ It shapes check-ins and briefs — nowhere else", 3400);
                } else if ((pageData.id === "ins" || pageData.id === "intake") && verdict === "yes") {
                  setSheet("addDoc");
                } else {
                  showToast(req.doneToast || "Done — you can change your mind in Updates", 3000);
                }
              }} />
          )}
          {page === "insightProgress" && <InsightProgressPage period={period} boost={insightBoost} onBack={() => setPage(null)} />}
          {page === "insightReport" && <InsightReportPage onBack={() => setPage(null)} />}
          {page === "insightsList" && (
            <InsightsListPage period={period} onBack={() => setPage(null)} openReport={() => setPage("insightReport")} />
          )}
          {page === "briefReport" && <BriefReportPage onBack={() => setPage(null)} openShare={() => setSheet("share")} />}
          {page === "record" && (
            <RecordPage title={period === "visitday" ? "Dr. Chen · Cardiology" : "Today's appointment"}
              onCancel={() => setPage(null)}
              onDiscard={() => {
                setPage(null);
                showToast("Recording discarded — nothing was saved", 2800);
              }}
              onFinish={() => {
                /* save fast, process in place: the audio is already hers,
                   so the app says so and moves on. No dead-air screen —
                   Visits shows the work happening, watchable or not. */
                setPage(null); setTab("visits"); setVisitProc(0);
                showToast("Saved ✓ Recall is writing it up — watch in Visits, or don't", 3200);
              }} />
          )}
          {page === "visitDetail" && pageData && (
            <VisitDetailPage visit={pageData} onBack={() => setPage(null)} openPage={openPage} />
          )}
          {page === "patternDetail" && pageData && (
            <PatternDetailPage pattern={pageData.pattern}
              onBack={() => openPage("visitDetail", pageData.visit)} />
          )}
          {/* two doors, one grammar: recorded-with-audio visits open the
              rich page (word-timed transcript, dock, glossary); paper-era
              ones keep the simple reader. Dr. Chen's July 31 visit IS the
              fresh recording, aged into month 1. */}
          {page === "pastVisit" && pageData && (pageData.rich || pageData.id === "chen-past" ? (
            <RecordedVisitPage visit={pageData}
              proc={pageData.fresh ? (visitProc == null ? "done" : visitProc) : "done"}
              onBack={() => setPage(null)} onShare={() => setSheet("shareVisit")}
              noticed={visitNoticed} openRequest={(r) => ui.openRequest(r)} />
          ) : (
            <PastVisitPage visit={pageData} onBack={() => setPage(null)}
              onSuggest={() => { setPage(null); ui.openRequest(needById("month1", "followup")); }}
              onShare={() => setSheet("shareVisit")} />
          ))}
          {page === "docDetail" && pageData && (
            <DocDetailPage doc={pageData} onBack={() => setPage(null)}
              onSuggest={() => { setPage(null); showToast("Added to Dr. Chen's brief as a question ✓", 2600); }} />
          )}
          {page === "medDetail" && pageData && (
            <MedDetailPage med={pageData} customMeds={customMeds} updateMed={updateMed}
              showToast={showToast} onBack={() => setPage(null)}
              /* the ask follows the thing: the same orange line that rides
                 the cabinet row must still be standing when the row's door
                 opens — a request that vanishes one level deeper reads as
                 handled, or worse, imagined */
              notice={
                period === "month1" && pageData.name.startsWith("Metformin") && !metDoseUp
                  ? { text: "Dose change waiting — Dr. Chen raised it to 850 mg · review",
                      onClick: () => ui.openRequest(needById("month1", "metdose")) }
                : period === "month1" && pageData.name.startsWith("Lisinopril")
                  ? { text: "Moved by Denise yesterday — keep it, or undo",
                      onClick: () => ui.openRequest(needById("month1", "denise")) }
                : null
              } />
          )}
          {page === "addMed" && (
            <AddMedPage onBack={() => setPage(null)}
              onSaved={(m) => {
                setCustomMeds((prev) => [...prev, m]);
                setPage(null); setTab("meds");
                showToast(m.asNeeded
                  ? `${m.name} ${m.dose} saved to your cabinet — no reminders, just there when you need it ✓`
                  : `${m.name} ${m.dose} saved — it's in your cabinet and on Today's list ✓`, 3200);
              }} />
          )}
          {page === "checkinDetail" && pageData && (
            <CheckinDetailPage status={pageData.status} reopened={reopened} period={period}
              captured={captured}
              pastEntry={pageData.entry}
              tagFor={entryTagFor(period, followedTopics, ui)}
              slipState={entrySlip}
              onSlip={(v) => { setEntrySlip(v);
                showToast(v === "fixed"
                  ? "Fixed in your words — the wrong line isn't kept ✓"
                  : "Line kept as written — thanks for checking ✓", 3000); }}
              onBack={() => (pageData.from ? openPage(pageData.from) : setPage(null))}
              openCheckin={() => { setPage(null); ui.openCheckin(); }}
              openAddCheckin={() => { setPage(null); ui.openCheckin("reopen"); }}
              openReview={() => setPage("review")} />
          )}
          {page === "allCheckins" && (
            <AllCheckinsPage period={period} followed={followedTopics} ui={ui}
              onBack={() => setPage(null)} />
          )}
          {page === "topicsList" && (
            <TopicsListPage period={period} ui={ui} followed={followedTopics}
              topicStates={topicStates} onBack={() => setPage(null)} />
          )}
          {page === "topic" && pageData && (
            <TopicPage topic={pageData} ov={topicStates[pageData.id]} onSetState={setTopicState}
              /* Back retraces: a topic opened from the Topics page returns
                 there; opened from a tag or completion, it returns to the tab */
              onBack={() => (pageData.from === "topicsList" ? openPage("topicsList") : setPage(null))}
              openPage={openPage} showToast={showToast} />
          )}
          {page === "review" && (
            <ReviewPage period={period} captured={captured} reopen={reopenFlow} preview={reviewPreview}
              onFinalize={(skipped = [], fixed = {}) => {
                /* anything skipped stays out of the record — it waits in
                   Updates — and fixes travel with it, so completion reports
                   the corrected fact, never the misheard one */
                if (skipped.length || Object.keys(fixed).length)
                  setCaptured((prev) => prev.filter((c) => !skipped.includes(c.t))
                    .map((c) => (fixed[c.t] ? { ...c, t: fixed[c.t] } : c)));
                /* a followed proposal becomes a real topic — it appears in
                   Journal › Topics from this moment on */
                const newlyFollowed = captured
                  .filter((c) => c.home === "Topics" && c.settled === "done" && c.topicId)
                  .map((c) => c.topicId);
                if (newlyFollowed.length)
                  setFollowedTopics((prev) => [...new Set([...prev, ...newlyFollowed])]);
                setPage(null);
                /* an evening addendum is a small moment — no full reward beat */
                if (reopenFlow) { setTab("today"); setFinalizeStage("processing"); }
                else setSheet("finalizeReward");
              }}
              onResume={() => { setPage(null); resumeConversation(); }}
              onResay={(scen) => { setPage(null); resumeConversation(scen); }}
              onScanNow={(cap) => setReviewScan(cap.t)}
              onSettle={(t, v, vals) => setCaptured((prev) => prev.map((c) =>
                c.t === t ? { ...c, settled: v || undefined, ...(vals ? { fixedVals: vals } : {}) } : c))}
              onKeepOpen={() => setPage(null)} />
          )}
          {/* scanning FROM the review: mid-call it would yank her out of
              the talk, but the talk is over — so it's a choice here. The
              letter files immediately and the review row updates. */}
          {reviewScan && (
            <DocScanOverlay onCancel={() => setReviewScan(null)}
              onDone={() => {
                setCaptured((prev) => prev.map((c) => (c.t === reviewScan
                  ? { ...c, scanNow: false, t: "Lab letter — scanned", home: "Documents",
                      fate: "read and filed in Documents ✓", fateTone: "green",
                      picture: "the lab letter is read and filed" }
                  : c)));
                setReviewScan(null);
                showToast("Filed under Lab results — it's in Documents ✓", 3000);
              }} />
          )}

          {/* care spaces — your side of the door */}
          {page === "you" && (
            <YouPage onBack={() => setPage(null)} sarahRemoved={sarahRemoved}
              onMember={(m) => openPage("member", MEMBERS[m])} onTour={startTour} showToast={showToast}
              onHealth={() => openPage("healthProfile", { from: "you" })}
              onPrivacy={() => openPage("privacy", { from: "you" })}
              appearance={{ textSize, setTextSize, dark: darkMode, setDark: setDarkMode }} />
          )}
          {page === "setupStory" && (
            <SetupStoryPage period={period} obSummary={obSummary} onBack={() => setPage(null)}
              onMember={(m) => openPage("member", { ...MEMBERS[m], from: "setupStory" })}
              onHealth={() => openPage("healthProfile", { from: "setupStory" })}
              onPrivacy={() => openPage("privacy", { from: "setupStory" })}
              onGoTab={(t) => { setPage(null); setTab(t); }} />
          )}
          {/* who can see what — reached from her page or the receipt;
              Back retraces the door she came through */}
          {page === "privacy" && (
            <PrivacyPage onBack={() => (pageData && pageData.from === "setupStory" ? openPage("setupStory")
              : pageData && pageData.from === "you" ? openPage("you") : setPage(null))} />
          )}
          {/* About your health — reached from her page or the receipt;
              Back retraces the door she came through */}
          {page === "healthProfile" && (
            <HealthProfilePage ui={ui} diabetesAdded={diabetesAdded}
              removed={profileRemoved}
              profileNeed={period === "month1" && !diabetesAdded ? needById("month1", "profile") : null}
              onRemove={(f) => { setProfileRemoved((p) => ({ ...p, [f.id]: true }));
                showToast(`${f.t.split(" — ")[0]} removed — check-ins stop accounting for it`, 3000); }}
              onUndo={(id) => setProfileRemoved((p) => { const q = { ...p }; delete q[id]; return q; })}
              onBack={() => (pageData && pageData.from === "setupStory" ? openPage("setupStory")
                : pageData && pageData.from === "you" ? openPage("you") : setPage(null))} />
          )}
          {page === "member" && pageData && (
            <MemberPage person={{ ...pageData, lately: latelyFor(pageData.id, period) }} facts={factShares[pageData.id]}
              setFact={(fid, v) => setFactShares((p) => ({ ...p, [pageData.id]: { ...p[pageData.id], [fid]: v } }))}
              onBack={() => (pageData.from === "setupStory" ? openPage("setupStory") : setPage(null))}
              onSendUpdate={() => openPage("curation")}
              onChangeRole={() => openPage("roleChange", pageData)}
              onRemove={() => {
                if (pageData.id === "sarah") setSarahRemoved(true);
                setPage(null);
                showToast(`${pageData.name} removed — sharing stopped. Invite her back anytime.`, 3200);
              }}
              showToast={showToast} />
          )}
          {page === "roleChange" && pageData && (
            <RoleChangePage person={pageData} onBack={() => openPage("member", pageData)} showToast={showToast} />
          )}
          {page === "invite" && (
            <InvitePage invited={invited} onBack={() => setPage(null)}
              onSent={() => { setInvited(true); setPage(null);
                showToast("Invite sent to Ravi — it tells him exactly what he'll be able to do ✓", 3200); }} />
          )}
          {page === "curation" && (
            <CurationPage onBack={() => setPage(null)} showToast={showToast}
              onSent={() => { setPage(null);
                showToast("Sent to Sarah ✓ In her room of you, in English — nothing else travels", 3400); }} />
          )}

          {/* Thatha's room — the caregiver side */}
          {page === "room" && (
            <RoomHub period={period} news={THATHA_NEWS[period]} thataTaken={thataTaken}
              toggleThataDose={toggleThataDose} noteAdded={noteAdded} ui={ui}
              onExit={() => setPage(null)} fabOpen={fabOpen} setFabOpen={setFabOpen}
              onFab={roomFab} showToast={showToast} />
          )}
          {page === "roomMeds" && (
            <RoomMedsPage onBack={() => setPage("room")} onExit={() => setPage(null)}
              medAdded={thataMedAdded}
              openMed={(m) => openPage("roomMed", m)} openAdd={() => setPage("roomAddMed")} />
          )}
          {page === "roomMed" && pageData && (
            <RoomMedDetailPage med={pageData} changed={thataMedChanged}
              onBack={() => setPage("roomMeds")} onExit={() => setPage(null)}
              onChange={() => setSheet("roomChangeWhen")} showToast={showToast} />
          )}
          {page === "roomAddMed" && (
            <AddMedPage forName="Thatha" onBack={() => setPage("roomMeds")}
              onSaved={() => { setThataMedAdded(true); setPage("roomMeds");
                showToast("Added for Thatha ✓ He sees it and can undo.", 3000); }}
              onSuggestInstead={() => { setPage("roomMeds");
                showToast("Sent as a suggestion instead — Thatha decides ✓", 2800); }} />
          )}
          {page === "roomVisit" && (
            <RoomVisitPage onBack={() => setPage("room")} onExit={() => setPage(null)}
              onRecord={() => setPage("roomRecord")} showToast={showToast} />
          )}
          {page === "roomRecord" && (
            <RecordPage title="Thatha's visit · Dr. Singh" forWhom="Thatha"
              onCancel={() => setPage("roomVisit")}
              onDiscard={() => { setPage("roomVisit");
                showToast("Recording discarded — nothing was saved", 2800); }}
              onFinish={() => { setPage("roomVisit");
                showToast("Saved to Thatha's record — marked “Recorded by Amma.” He can remove it.", 3600); }} />
          )}
          {page === "roomDocs" && (
            <RoomDocsPage onBack={() => setPage("room")} onExit={() => setPage(null)}
              onAdd={() => setSheet("roomAddDoc")} showToast={showToast} />
          )}
          {page === "roomActivity" && (
            <RoomActivityPage onBack={() => setPage("room")} onExit={() => setPage(null)} />
          )}
          {page === "roomNote" && pageData && (
            <RoomNotePage note={pageData} onBack={() => setPage("room")} onExit={() => setPage(null)} />
          )}
          {page === "roomShared" && (
            <RoomShell owner={THATHA_OWNER} title="Shared with you"
              onBack={() => setPage("room")} onExit={() => setPage(null)}>
              <SharedReaderBody data={THATHA.sharedSummary} />
              <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
                Shared by Thatha — exactly what he approved, this once.
              </div>
            </RoomShell>
          )}

          {/* Amma's room, from Sarah's phone — the family side */}
          {page === "sarahStory" && (
            <SarahStoryPage period={period} onBack={() => setPage(null)}
              onRoom={() => openPage("famRoom", { from: "sarahStory" })} />
          )}
          {page === "famRoom" && (
            <FamilyRoomPage sugs={sarahSugs} ui={ui} hello={hello} fresh={freshAnswers}
              onExit={() => (pageData && pageData.from === "sarahStory"
                ? openPage("sarahStory") : setPage(null))}
              onAskHello={() => setSheet("askHello")} onHow={() => setSheet("famHow")} />
          )}
          {page === "famSuggest" && (
            <SuggestComposerPage onBack={() => setPage("famRoom")} onExit={() => setPage(null)}
              onSent={(composed) => {
                /* the sent row carries what SHE composed — her title, her
                   why, the kind's where-it-waits line */
                setSarahSugs((p) => [{ id: composed.kind + p.length, status: "wait", ...composed }, ...p]);
                setPage("famRoom");
                showToast("Sent to Amma as a suggestion — nothing changes unless she says yes ✓", 3400);
              }} />
          )}
          {page === "famSugDetail" && pageData && (
            <SuggestionDetailPage sug={pageData} onBack={() => setPage("famRoom")} onExit={() => setPage(null)} />
          )}
          {page === "famUpdate" && (
            <CareUpdateReaderPage onBack={() => setPage("famRoom")} onExit={() => setPage(null)} showToast={showToast} />
          )}
          {page === "famSummary" && (
            <RoomShell owner={AMMA_OWNER} title="Shared with you"
              onBack={() => setPage("famRoom")} onExit={() => setPage(null)}>
              <SharedReaderBody data={AMMA_SHARED_SUMMARY} />
              <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0", textAlign: "center" }}>
                The recording and transcript stayed with Amma — she shared the summary, this once.
              </div>
            </RoomShell>
          )}

          {/* sheets & overlays */}
          {sheet === "addVisit" && (
            <AddVisitSheet onClose={() => setSheet(null)}
              onRecord={() => { setSheet(null); openPage("record"); }}
              onUpcoming={() => { setSheet(null); openPage("addVisit"); }} />
          )}
          {page === "addVisit" && (
            <AddVisitPage onBack={() => setPage(null)}
              onSaved={(v) => {
                const id = `up-${customVisits.length}`;
                setCustomVisits((p) => [...p, { ...v, id }]);
                setFreshUpId(id);
                setTimeout(() => setFreshUpId(null), 1200);
                setPage(null); setTab("visits");
                buzz();
                showToast(v.briefLine === "Brief just started"
                  ? `${v.title.split(" · ")[0]} added ✓ The visit is close — the brief is already collecting`
                  : `${v.title.split(" · ")[0]} added ✓ The brief starts building two weeks before`, 3400);
              }} />
          )}
          {/* a scan-type ask closes when the paper actually lands, not when
              she taps "Scan" — so Sarah's row flips here, not earlier */}
          {sheet === "addDoc" && (
            <AddDocSheet onClose={() => setSheet(null)}
              onScan={() => setSheet("docScan")}
              onAdd={() => { setSheet(null); setDocStage("processing"); ui.goTab("docs"); filedForSarah(); }} />
          )}
          {sheet === "docScan" && (
            <DocScanOverlay onCancel={() => setSheet(null)}
              onDone={() => { setSheet(null); setDocStage("processing"); ui.goTab("docs"); filedForSarah(); }} />
          )}
          {sheet === "call" && (
            <CallOverlay startMode={callMode} startScenario={callScenario} showToast={showToast}
              period={period} followedTopics={followedTopics} topicStates={topicStates}
              onDone={(cap, scn) => {
                if (scn === "carenote") { setSheet("noteProcessing"); return; }
                /* merge, don't append — a re-said fact replaces its old wording */
                setCaptured((prev) => mergeCaps(prev, cap || [])); setSheet("processing");
              }} />
          )}
          {sheet === "processing" && <ProcessingOverlay lines={reopenFlow ? PROC_LINES_REOPEN : PROC_LINES} />}
          {sheet === "finalizeReward" && (
            <FinalizeOverlay period={period} captured={captured}
              onDone={(read, arg) => {
                setSheet(null); setTab("today");
                setInsightBoost(true); setFinalizeStage("processing");
                /* the takeover's "Read it now" — the earned insight is a
                   choice, so it opens only when she asks for it */
                if (read === "insight") openPage("insightReport");
                /* a topic card tapped in the put-away — land on its page */
                if (read === "topic" && arg) {
                  const t = topicsFor(period, [...followedTopics, arg]).find((x) => x.id === arg);
                  if (t) openPage("topic", t);
                }
              }} />
          )}
          {orbLab && <OrbLabPage onBack={() => setOrbLab(false)} />}
          {onboarding && (
            <OnboardingOverlay
              onExit={() => setOnboarding(false)}
              onFinish={(role, summary) => {
                setOnboarding(false);
                if (role === "care" || role === "care-call") {
                  /* supporters land on the supporter home — no journal, no
                     Today of their own; their person's room opens on a yes */
                  setDevice("sarah");
                  showToast(role === "care-call"
                    ? "Invitation sent ✓ The supporter home — the call makes everything else, together"
                    : "Request sent ✓ This is the supporter home — their room opens when they say yes", 4600);
                } else {
                  if (period !== "day1") setPeriod("day1");
                  else { setTab("today"); setPage(null); }
                  /* the honest seam, now SHOWN not just said: day 1 keeps
                     YOUR setup under its own card, and the receipt's frame
                     line names the rest of the preview as Amma's world */
                  if (summary) setObSummary(summary);
                  showToast("Setup complete ✓ Your setup is kept under “Set up just now” — the demo around it continues as Amma", 5200);
                }
              }} />
          )}
          {logSheet === "asneeded" && (
            <LogSheet mode="asneeded" anMeds={anMeds} anLog={anLog} doseLog={doseLog}
              onLog={logDose} onLogAll={logAllGroup} onLogAn={logAsNeeded}
              onClose={() => setLogSheet(null)} />
          )}
          {logSheet?.startsWith?.("time:") && doseGroups.some((g) => `time:${g.key}` === logSheet) && (
            <LogSheet mode="group" group={doseGroups.find((g) => `time:${g.key}` === logSheet)}
              anMeds={anMeds} anLog={anLog} doseLog={doseLog}
              onLog={logDose} onLogAll={logAllGroup} onLogAn={logAsNeeded}
              onClose={() => setLogSheet(null)} />
          )}
          {logSheet?.startsWith?.("event:") && logEvents.some((ev) => `event:${ev.time}` === logSheet) && (
            <LogSheet mode="event" event={logEvents.find((ev) => `event:${ev.time}` === logSheet)}
              anMeds={anMeds} anLog={anLog} doseLog={doseLog}
              onLog={logDose} onLogAll={logAllGroup} onLogAn={logAsNeeded}
              onClose={() => setLogSheet(null)} />
          )}
          {sheet === "noteProcessing" && <ProcessingOverlay lines={PROC_LINES_NOTE} />}
          {sheet === "share" && <ShareSheet onClose={() => setSheet(null)} />}
          {sheet === "videoHelp" && <VideoHelpSheet tab={tab} onClose={() => setSheet(null)} />}
          {checkinChooser !== null && (
            <CheckinModeSheet
              onPick={(m) => {
                const s = checkinChooser;
                setCheckinChooser(null);
                startConversation(s, m);
              }}
              onClose={() => setCheckinChooser(null)} />
          )}
          
          {sheet === "profile" && (
            <CircleSheet onClose={() => setSheet(null)} device={device}
              thataNewsCount={thataNewsCount} invited={invited} sarahRemoved={sarahRemoved}
              onYou={() => { setSheet(null); openPage("you"); }}
              onRoom={() => { setSheet(null); openPage(device === "sarah" ? "famRoom" : "room"); }}
              onMember={(m) => { setSheet(null); openPage("member", MEMBERS[m]); }}
              onInvite={() => { setSheet(null); openPage("invite"); }}
              onTour={() => { setSheet(null); startTour(); }}
              onSetupStory={() => { setSheet(null); openPage("setupStory"); }}
              onStartJournal={() => { setSheet(null);
                showToast("Recall would set up your own check-ins — no pressure, whenever you like", 3000); }}
              showToast={showToast} />
          )}
          {sheet === "updates" && (device === "sarah" ? (
            <Sheet title="Updates" onClose={() => setSheet(null)}>
              <EmptyHint>
                Updates about your own record land here — and you don't have one yet.
                News about Amma lives behind her row, where it belongs.
              </EmptyHint>
              <div style={{ fontSize: 13.5, color: C.ter, lineHeight: 1.5, padding: "12px 6px 0" }}>
                One bell, one meaning: your record. People are behind your avatar.
              </div>
            </Sheet>
          ) : (
            <UpdatesSheet onClose={() => setSheet(null)} period={period} needs={openNeeds}
              hello={hello}
              onHelloAnswer={(line) => {
                setHello(line || "passed");
                if (line) showToast("Sent to Sarah — one line, your words ✓", 2800);
              }}
              openRequest={(r) => { setSheet(null); ui.openRequest(r); }} />
          ))}
          {sheet === "shareVisit" && (
            <ShareVisitSheet onClose={() => setSheet(null)} showToast={showToast}
              onCurate={() => { setSheet(null); openPage("curation"); }} />
          )}
          {sheet === "roomChangeWhen" && (
            <ChangeWhenSheet onClose={() => setSheet(null)}
              onPick={() => { setThataMedChanged(true); setSheet(null);
                showToast("Applied — Thatha can see and undo this ✓", 3000); }} />
          )}
          {sheet === "roomAddDoc" && (
            <AddDocSheet onClose={() => setSheet(null)}
              onAdd={() => { setSheet(null);
                showToast("Filed to Thatha's Documents — stamped “Filed by you.” He can remove it ✓", 3400); }} />
          )}
          {sheet === "roomHow" && <HowSheet kind="room" onClose={() => setSheet(null)} />}
          {sheet === "famHow" && <HowSheet kind="fam" onClose={() => setSheet(null)} />}
          {sheet === "askHello" && (
            <AskHelloSheet onClose={() => setSheet(null)}
              onSend={() => { setSheet(null); setHello("asked");
                showToast("Sent — it waits quietly in her Updates. No nudges ✓", 3000); }} />
          )}
          {/* closing this sheet is itself a complete answer — the plain no
              was recorded the moment she tapped it */}
          {declineReq && (
            <DeclineSheet req={declineReq}
              onClose={() => { setDeclineReq(null);
                showToast("Sarah sees “Not this time” ✓ Nothing else to do", 3000); }}
              onSend={(line) => {
                if (line) answerSug(declineReq.sugId, "no", `She said: “${line}”`);
                setDeclineReq(null);
                showToast(line ? "Sent with your words ✓ Sarah has your answer" : "Sarah sees “Not this time” ✓", 3000);
              }} />
          )}

          {tourStep !== null && (
            <TourOverlay step={tourStep}
              onNext={() => {
                const next = tourStep + 1;
                if (next >= TOUR_STEPS.length) { setTourStep(null); setTab("today"); }
                else { setTab(TOUR_STEPS[next].tab); setTourStep(next); }
              }}
              onClose={() => setTourStep(null)}
              onRead={() => showToast("Recall reads this step aloud", 2200)} />
          )}
        </div>
      </div>
    </div>
  );
}
