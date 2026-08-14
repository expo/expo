import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AgentStatus } from '@/constants/agents';
import { DEPARTMENT_AGENTS, MAIN_AGENT } from '@/constants/agents';

type AgentRuntime = {
  status: AgentStatus;
  activity: number; // 0–1 pulse intensity
};

type ControllerContextValue = {
  selectedId: string;
  selectAgent: (id: string) => void;
  runtimes: Record<string, AgentRuntime>;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  bumpActivity: (id: string, amount?: number) => void;
  selectedAgent: (typeof DEPARTMENT_AGENTS)[number] | typeof MAIN_AGENT;
};

const defaultRuntimes = (): Record<string, AgentRuntime> => {
  const map: Record<string, AgentRuntime> = {
    [MAIN_AGENT.id]: { status: 'listening', activity: 0.35 },
  };
  for (const agent of DEPARTMENT_AGENTS) {
    map[agent.id] = {
      status: Math.random() > 0.72 ? 'thinking' : 'idle',
      activity: 0.08 + Math.random() * 0.2,
    };
  }
  return map;
};

const ControllerContext = createContext<ControllerContextValue | null>(null);

export function ControllerProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string>(MAIN_AGENT.id);
  const [runtimes, setRuntimes] = useState(defaultRuntimes);

  /** Ambient life — idle pads occasionally tick so the grid feels inhabited */
  useEffect(() => {
    const id = setInterval(() => {
      setRuntimes((prev) => {
        const next = { ...prev };
        const pick =
          DEPARTMENT_AGENTS[Math.floor(Math.random() * DEPARTMENT_AGENTS.length)];
        const current = next[pick.id];
        if (!current || current.status === 'streaming') return prev;
        const thinking = Math.random() > 0.55;
        next[pick.id] = {
          status: thinking ? 'thinking' : 'idle',
          activity: thinking
            ? 0.45 + Math.random() * 0.35
            : 0.08 + Math.random() * 0.15,
        };
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const selectAgent = useCallback((id: string) => {
    setSelectedId(id);
    setRuntimes((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: 'listening',
        activity: Math.max(prev[id]?.activity ?? 0, 0.55),
      },
    }));
  }, []);

  const setAgentStatus = useCallback((id: string, status: AgentStatus) => {
    setRuntimes((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        activity:
          status === 'idle'
            ? 0.08
            : status === 'streaming'
              ? 0.95
              : status === 'thinking'
                ? 0.7
                : 0.45,
      },
    }));
  }, []);

  const bumpActivity = useCallback((id: string, amount = 0.2) => {
    setRuntimes((prev) => {
      const current = prev[id] ?? { status: 'idle' as AgentStatus, activity: 0 };
      return {
        ...prev,
        [id]: {
          ...current,
          activity: Math.min(1, current.activity + amount),
        },
      };
    });
  }, []);

  const selectedAgent = useMemo(() => {
    if (selectedId === MAIN_AGENT.id) return MAIN_AGENT;
    return DEPARTMENT_AGENTS.find((a) => a.id === selectedId) ?? MAIN_AGENT;
  }, [selectedId]);

  const value = useMemo(
    () => ({
      selectedId,
      selectAgent,
      runtimes,
      setAgentStatus,
      bumpActivity,
      selectedAgent,
    }),
    [selectedId, selectAgent, runtimes, setAgentStatus, bumpActivity, selectedAgent],
  );

  return (
    <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>
  );
}

export function useController() {
  const ctx = useContext(ControllerContext);
  if (!ctx) throw new Error('useController must be used within ControllerProvider');
  return ctx;
}
