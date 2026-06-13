"use client";

// Efectos de sonido minimalistas vía WebAudio (sin archivos). Se silencian
// con la preferencia guardada en localStorage.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx)
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

export function silenciado(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("trivia_mute") === "1";
}

export function setSilencio(v: boolean) {
  if (typeof window !== "undefined")
    localStorage.setItem("trivia_mute", v ? "1" : "0");
}

function tono(freq: number, dur: number, tipo: OscillatorType = "sine", vol = 0.12) {
  if (silenciado()) return;
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(ac.destination);
  const t = ac.currentTime;
  osc.start(t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.stop(t + dur);
}

export const sonidos = {
  tic: () => tono(880, 0.05, "square", 0.04),
  ding: () => {
    tono(660, 0.12, "sine", 0.12);
    setTimeout(() => tono(990, 0.18, "sine", 0.12), 90);
  },
  error: () => tono(180, 0.25, "sawtooth", 0.08),
  click: () => tono(440, 0.05, "triangle", 0.06),
};
