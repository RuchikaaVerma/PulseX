import { useEffect, useRef } from "react";
import * as Tone from "tone";

// An original, generative ambient chord loop — not a real song, so there's
// nothing to license. Intensity (0-100, typically avg fleet CPU) brightens
// the filter and speeds up the arpeggio, so the "mood" of the site quietly
// tracks how hard the fleet is working.
const CHORDS: string[][] = [
  ["C3", "E3", "G3", "B3"],
  ["A2", "C3", "E3", "G3"],
  ["F2", "A2", "C3", "E3"],
  ["G2", "B2", "D3", "F3"],
];

export function useAmbientSound(enabled: boolean, intensity: number) {
  const nodesRef = useRef<{
    synth: Tone.PolySynth;
    pluck: Tone.PolySynth;
    filter: Tone.Filter;
    loop: Tone.Loop;
    arp: Tone.Loop;
  } | null>(null);
  const builtRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      Tone.Transport.stop();
      return;
    }

    let cancelled = false;

    async function boot() {
      await Tone.start();
      if (cancelled) return;

      if (!builtRef.current) {
        const reverb = new Tone.Reverb({ decay: 7, wet: 0.5 }).toDestination();
        const filter = new Tone.Filter(700, "lowpass").connect(reverb);

        const synth = new Tone.PolySynth(Tone.FMSynth, {
          volume: -20,
          envelope: { attack: 1.4, decay: 0.6, sustain: 0.5, release: 4 },
        }).connect(filter);

        const pluck = new Tone.PolySynth(Tone.Synth, {
          volume: -26,
          oscillator: { type: "triangle" },
          envelope: { attack: 0.02, decay: 0.3, sustain: 0, release: 0.4 },
        }).connect(filter);

        let chordIndex = 0;
        const loop = new Tone.Loop((time) => {
          const chord = CHORDS[chordIndex % CHORDS.length];
          synth.triggerAttackRelease(chord, "2n", time);
          chordIndex++;
        }, "2m");

        let step = 0;
        const arp = new Tone.Loop((time) => {
          const chord = CHORDS[(Math.floor(step / 4)) % CHORDS.length];
          const note = chord[step % chord.length];
          pluck.triggerAttackRelease(note, "8n", time);
          step++;
        }, "8n");

        loop.start(0);
        arp.start(0);

        Tone.Transport.bpm.value = 62;

        nodesRef.current = { synth, pluck, filter, loop, arp };
        builtRef.current = true;
      }

      Tone.Transport.start();
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // brighten / speed up with fleet load
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const freq = 350 + Math.min(100, Math.max(0, intensity)) * 18;
    nodes.filter.frequency.rampTo(freq, 1.2);
    const bpm = 56 + Math.min(100, Math.max(0, intensity)) * 0.3;
    Tone.Transport.bpm.rampTo(bpm, 2);
  }, [intensity]);

  useEffect(() => {
    return () => {
      const nodes = nodesRef.current;
      if (nodes) {
        nodes.loop.dispose();
        nodes.arp.dispose();
        nodes.synth.dispose();
        nodes.pluck.dispose();
        nodes.filter.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);
}