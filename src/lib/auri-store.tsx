"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ------------------------------------------------------------------ */
/*  types                                                              */
/* ------------------------------------------------------------------ */

export type Classification = "urgent" | "medium" | "low";

export const CLASSIFICATIONS: Classification[] = ["urgent", "medium", "low"];

export const CLASSIFICATION_META: Record<
  Classification,
  { label: string; color: string; textColor: string }
> = {
  urgent: { label: "urgent", color: "#e0776d", textColor: "#2a0d0a" },
  medium: { label: "medium", color: "#e8c05f", textColor: "#2a2005" },
  low: { label: "low priority", color: "#6b6b76", textColor: "#ffffff" },
};

export type VibrationStrength = "light" | "medium" | "strong";
export type VibrationSpeed = "slow" | "medium" | "fast";

export const VIBRATION_STRENGTHS: VibrationStrength[] = ["light", "medium", "strong"];
export const VIBRATION_SPEEDS: VibrationSpeed[] = ["slow", "medium", "fast"];

// the physical LED only supports these five colors — presets (and any
// sound's assigned color) are constrained to this set
export const LED_COLORS: { name: string; hex: string }[] = [
  { name: "red", hex: "#e0776d" },
  { name: "yellow", hex: "#e8c05f" },
  { name: "green", hex: "#6faa6a" },
  { name: "blue", hex: "#5eb8e0" },
  { name: "white", hex: "#f5f5f2" },
];

// preset swatches offered in the sound-edit modal
export const SOUND_COLOR_PRESETS = LED_COLORS.map((c) => c.hex);

// turns "#e0776d" + 0.15 into "rgba(224,119,109,0.15)" — used for the faint
// ambient glows that echo a sound/tag's own color
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface SoundDef {
  id: string;
  name: string;
  enabled: boolean;
  classification: Classification;
  color: string;
  vibrationStrength: VibrationStrength;
  vibrationSpeed: VibrationSpeed;
  custom?: boolean;
}

export type NotifyLevel = "all" | "urgent-medium" | "urgent-only";

export const NOTIFY_LEVEL_META: Record<
  NotifyLevel,
  { label: string; blurb: string }
> = {
  all: { label: "all sounds", blurb: "notify for every enabled sound" },
  "urgent-medium": {
    label: "urgent & medium",
    blurb: "only notify for urgent & medium sounds",
  },
  "urgent-only": {
    label: "urgent only",
    blurb: "only notify for urgent sounds",
  },
};

export interface Space {
  id: string;
  name: string;
  soundIds: string[];
}

export type ContactMethod = "text" | "call" | "both";

export interface EmergencyContactEntry {
  id: string;
  name: string;
  number: string;
}

export interface EmergencySettings {
  enabled: boolean;
  method: ContactMethod;
  times: number;
  minutes: number;
  contacts: EmergencyContactEntry[];
  lastSavedAt: string | null;
}

export interface HistoryEntry {
  id: string;
  soundId: string;
  space: string;
  time: string;
}

interface AuriState {
  sounds: SoundDef[];
  notifyLevel: NotifyLevel;
  spaces: Space[];
  activeSpaceId: string;
  emergency: EmergencySettings;
  history: HistoryEntry[];
  haptics: boolean;
  lights: boolean;
}

/* ------------------------------------------------------------------ */
/*  defaults                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_SOUNDS: SoundDef[] = [
  { id: "baby-crying", name: "baby crying", enabled: true, classification: "urgent", color: "#e0776d", vibrationStrength: "strong", vibrationSpeed: "fast" },
  { id: "dog-bark", name: "dog bark", enabled: true, classification: "medium", color: "#e8c05f", vibrationStrength: "medium", vibrationSpeed: "medium" },
  { id: "door-knock", name: "door knock", enabled: true, classification: "medium", color: "#6faa6a", vibrationStrength: "medium", vibrationSpeed: "slow" },
  { id: "smoke-alarm", name: "smoke alarm", enabled: true, classification: "urgent", color: "#e0776d", vibrationStrength: "strong", vibrationSpeed: "fast" },
  { id: "car-horn", name: "car horn", enabled: false, classification: "low", color: "#f5f5f2", vibrationStrength: "light", vibrationSpeed: "fast" },
  { id: "bicycle-bell", name: "bicycle bell", enabled: true, classification: "low", color: "#5eb8e0", vibrationStrength: "light", vibrationSpeed: "medium" },
];

const DEFAULT_SPACES: Space[] = [
  { id: "home", name: "home", soundIds: ["baby-crying", "dog-bark", "door-knock", "smoke-alarm"] },
  { id: "outdoor", name: "outdoor", soundIds: ["car-horn", "dog-bark", "bicycle-bell"] },
  { id: "sleep", name: "sleep", soundIds: ["smoke-alarm"] },
  { id: "custom", name: "custom", soundIds: [] },
];

const DEFAULT_EMERGENCY: EmergencySettings = {
  enabled: true,
  method: "text",
  times: 3,
  minutes: 5,
  contacts: [
    { id: "contact-1", name: "", number: "" },
    { id: "contact-2", name: "", number: "" },
  ],
  lastSavedAt: null,
};

const DEFAULT_HISTORY: HistoryEntry[] = [
  { id: "h1", soundId: "door-knock", space: "home", time: "2 min ago" },
  { id: "h2", soundId: "dog-bark", space: "outdoor", time: "18 min ago" },
  { id: "h3", soundId: "smoke-alarm", space: "sleep", time: "yesterday, 11:42 pm" },
];

const DEFAULT_STATE: AuriState = {
  sounds: DEFAULT_SOUNDS,
  notifyLevel: "all",
  spaces: DEFAULT_SPACES,
  activeSpaceId: "home",
  emergency: DEFAULT_EMERGENCY,
  history: DEFAULT_HISTORY,
  haptics: true,
  lights: true,
};

const STORAGE_KEY = "auri-state-v1";

// accent colors cycled through for newly-added custom sounds — constrained
// to the same 5 colors the physical LED can actually display
const CUSTOM_COLOR_PALETTE = SOUND_COLOR_PRESETS;

function loadInitialState(): AuriState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const spaces: Space[] = parsed.spaces ?? DEFAULT_SPACES;
    const hasCustom = spaces.some((sp: Space) => sp.id === "custom");
    // shallow-merge so new fields introduced later don't break old saves
    return {
      ...DEFAULT_STATE,
      ...parsed,
      spaces: hasCustom ? spaces : [...spaces, { id: "custom", name: "custom", soundIds: [] }],
      sounds: (parsed.sounds ?? DEFAULT_SOUNDS).map((s: SoundDef) => ({
        ...s,
        vibrationStrength: s.vibrationStrength ?? "medium",
        vibrationSpeed: s.vibrationSpeed ?? "medium",
      })),
      emergency: { ...DEFAULT_EMERGENCY, ...(parsed.emergency ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/* ------------------------------------------------------------------ */
/*  context                                                            */
/* ------------------------------------------------------------------ */

interface AuriContextValue {
  sounds: SoundDef[];
  notifyLevel: NotifyLevel;
  spaces: Space[];
  activeSpaceId: string;
  emergency: EmergencySettings;
  history: HistoryEntry[];

  // sounds
  addSound: (name: string, classification: Classification) => SoundDef;
  removeSound: (id: string) => void;
  toggleSound: (id: string) => void;
  setSoundClassification: (id: string, classification: Classification) => void;
  updateSoundSettings: (
    id: string,
    patch: Partial<Pick<SoundDef, "color" | "vibrationStrength" | "vibrationSpeed">>
  ) => void;
  setNotifyLevel: (level: NotifyLevel) => void;
  willNotify: (sound: SoundDef) => boolean;

  // spaces
  addSoundToSpace: (spaceId: string, soundId: string) => void;
  removeSoundFromSpace: (spaceId: string, soundId: string) => void;
  renameSpace: (spaceId: string, name: string) => void;
  setActiveSpace: (spaceId: string) => void;

  // emergency
  updateEmergency: (patch: Partial<EmergencySettings>) => void;
  saveEmergency: (patch: Partial<EmergencySettings>) => void;
  addContact: () => void;
  updateContact: (id: string, patch: Partial<EmergencyContactEntry>) => void;
  removeContact: (id: string) => void;

  // device settings
  haptics: boolean;
  lights: boolean;
  setHaptics: (on: boolean) => void;
  setLights: (on: boolean) => void;

  // history
  logDetection: (soundId: string, space: string) => void;
  clearHistory: () => void;
}

const AuriContext = createContext<AuriContextValue | null>(null);

export function AuriStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuriState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitialState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — fail silently, app still works in-memory
    }
  }, [state, hydrated]);

  const addSound = useCallback((name: string, classification: Classification) => {
    const trimmed = name.trim().toLowerCase();
    let created: SoundDef = {
      id: "",
      name: trimmed,
      enabled: true,
      classification,
      color: CUSTOM_COLOR_PALETTE[0],
      vibrationStrength: "medium",
      vibrationSpeed: "medium",
      custom: true,
    };
    setState((prev) => {
      const id = `custom-${trimmed.replace(/\s+/g, "-")}-${Date.now()}`;
      const color =
        CUSTOM_COLOR_PALETTE[prev.sounds.length % CUSTOM_COLOR_PALETTE.length];
      created = {
        id,
        name: trimmed,
        enabled: true,
        classification,
        color,
        vibrationStrength: "medium",
        vibrationSpeed: "medium",
        custom: true,
      };
      return { ...prev, sounds: [...prev.sounds, created] };
    });
    return created;
  }, []);

  const removeSound = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sounds: prev.sounds.filter((s) => s.id !== id),
      spaces: prev.spaces.map((sp) => ({
        ...sp,
        soundIds: sp.soundIds.filter((sid) => sid !== id),
      })),
    }));
  }, []);

  const toggleSound = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      sounds: prev.sounds.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  }, []);

  const setSoundClassification = useCallback(
    (id: string, classification: Classification) => {
      setState((prev) => ({
        ...prev,
        sounds: prev.sounds.map((s) => (s.id === id ? { ...s, classification } : s)),
      }));
    },
    []
  );

  const setNotifyLevel = useCallback((level: NotifyLevel) => {
    setState((prev) => ({ ...prev, notifyLevel: level }));
  }, []);

  const updateSoundSettings = useCallback(
    (
      id: string,
      patch: Partial<Pick<SoundDef, "color" | "vibrationStrength" | "vibrationSpeed">>
    ) => {
      setState((prev) => ({
        ...prev,
        sounds: prev.sounds.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    []
  );

  const willNotify = useCallback(
    (sound: SoundDef) => {
      if (!sound.enabled) return false;
      if (state.notifyLevel === "all") return true;
      if (state.notifyLevel === "urgent-medium") return sound.classification !== "low";
      return sound.classification === "urgent";
    },
    [state.notifyLevel]
  );

  const addSoundToSpace = useCallback((spaceId: string, soundId: string) => {
    setState((prev) => ({
      ...prev,
      spaces: prev.spaces.map((sp) =>
        sp.id === spaceId && !sp.soundIds.includes(soundId)
          ? { ...sp, soundIds: [...sp.soundIds, soundId] }
          : sp
      ),
    }));
  }, []);

  const removeSoundFromSpace = useCallback((spaceId: string, soundId: string) => {
    setState((prev) => ({
      ...prev,
      spaces: prev.spaces.map((sp) =>
        sp.id === spaceId
          ? { ...sp, soundIds: sp.soundIds.filter((id) => id !== soundId) }
          : sp
      ),
    }));
  }, []);

  const renameSpace = useCallback((spaceId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      spaces: prev.spaces.map((sp) => (sp.id === spaceId ? { ...sp, name } : sp)),
    }));
  }, []);

  const setActiveSpace = useCallback((spaceId: string) => {
    setState((prev) => ({ ...prev, activeSpaceId: spaceId }));
  }, []);

  const setHaptics = useCallback((on: boolean) => {
    setState((prev) => ({ ...prev, haptics: on }));
  }, []);

  const setLights = useCallback((on: boolean) => {
    setState((prev) => ({ ...prev, lights: on }));
  }, []);

  const updateEmergency = useCallback((patch: Partial<EmergencySettings>) => {
    setState((prev) => ({ ...prev, emergency: { ...prev.emergency, ...patch } }));
  }, []);

  const saveEmergency = useCallback((patch: Partial<EmergencySettings>) => {
    setState((prev) => ({
      ...prev,
      emergency: { ...prev.emergency, ...patch, lastSavedAt: new Date().toISOString() },
    }));
  }, []);

  const addContact = useCallback(() => {
    setState((prev) => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: [
          ...prev.emergency.contacts,
          { id: `contact-${Date.now()}`, name: "", number: "" },
        ],
      },
    }));
  }, []);

  const updateContact = useCallback(
    (id: string, patch: Partial<EmergencyContactEntry>) => {
      setState((prev) => ({
        ...prev,
        emergency: {
          ...prev.emergency,
          contacts: prev.emergency.contacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        },
      }));
    },
    []
  );

  const removeContact = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      emergency: {
        ...prev.emergency,
        contacts: prev.emergency.contacts.filter((c) => c.id !== id),
      },
    }));
  }, []);

  const logDetection = useCallback((soundId: string, space: string) => {
    setState((prev) => ({
      ...prev,
      history: [
        { id: `h-${Date.now()}`, soundId, space, time: "just now" },
        ...prev.history,
      ].slice(0, 50),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  const value = useMemo<AuriContextValue>(
    () => ({
      sounds: state.sounds,
      notifyLevel: state.notifyLevel,
      spaces: state.spaces,
      activeSpaceId: state.activeSpaceId,
      emergency: state.emergency,
      history: state.history,
      haptics: state.haptics,
      lights: state.lights,
      setHaptics,
      setLights,
      addSound,
      removeSound,
      toggleSound,
      setSoundClassification,
      updateSoundSettings,
      setNotifyLevel,
      willNotify,
      addSoundToSpace,
      removeSoundFromSpace,
      renameSpace,
      setActiveSpace,
      updateEmergency,
      saveEmergency,
      addContact,
      updateContact,
      removeContact,
      logDetection,
      clearHistory,
    }),
    [
      state,
      addSound,
      removeSound,
      toggleSound,
      setSoundClassification,
      updateSoundSettings,
      setNotifyLevel,
      willNotify,
      addSoundToSpace,
      removeSoundFromSpace,
      renameSpace,
      setActiveSpace,
      setHaptics,
      setLights,
      updateEmergency,
      saveEmergency,
      addContact,
      updateContact,
      removeContact,
      logDetection,
      clearHistory,
    ]
  );

  return <AuriContext.Provider value={value}>{children}</AuriContext.Provider>;
}

export function useAuriStore() {
  const ctx = useContext(AuriContext);
  if (!ctx) {
    throw new Error("useAuriStore must be used within an AuriStoreProvider");
  }
  return ctx;
}
