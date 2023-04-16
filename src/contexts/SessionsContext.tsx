import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { v4 as uuid } from 'uuid'
import { ImmerReducer, useImmerReducer } from 'use-immer'
import type { SeedIds } from '../data/crops'

const STORAGE_KEY = 'sessionsData'

export interface SessionData {
  id: string
  crops: {
    [key in SeedIds]?: true
  }
}

export interface SessionsState {
  currentSessionId: string
  sessions: SessionData[]
}

export type SessionsContextType = [
  state: SessionsState,
  methods: {
    setSession: (id: string) => void
    createSession: (autoSwitchSession?: boolean) => void
    toggleCrop: (id: SeedIds, value?: boolean) => void
  }
]
const SessionsContext = createContext<SessionsContextType | undefined>(
  undefined
)

function createEmptySession(): SessionData {
  const id = uuid()
  return {
    id,
    crops: {},
  }
}

function initializer() {
  const session = createEmptySession()
  const initialValue: SessionsState = {
    currentSessionId: session.id,
    sessions: [session],
  }

  if (typeof window === 'undefined') {
    return initialValue
  }
  try {
    const data = window.localStorage.getItem(STORAGE_KEY)
    return data ? (JSON.parse(data) as SessionsState) : initialValue
  } catch (error) {
    console.error(error)
    return initialValue
  }
}

type Actions =
  | {
      type: 'SET_CURRENT_SESSION'
      sessionId: string
    }
  | {
      type: 'CREATE_SESSION'
      setCurrent: boolean
    }
  | {
      type: 'TOGGLE_CROP'
      id: SeedIds
      value?: boolean
    }

const reducer: ImmerReducer<SessionsState, Actions> = (draft, action) => {
  const currentSession = draft.sessions.find(
    (s) => s.id === draft.currentSessionId
  )!
  switch (action.type) {
    case 'SET_CURRENT_SESSION':
      draft.currentSessionId = action.sessionId
      break
    case 'CREATE_SESSION': {
      const session = createEmptySession()
      draft.sessions.push(session)
      if (action.setCurrent) draft.currentSessionId = session.id
      break
    }
    case 'TOGGLE_CROP': {
      const turnOn = action.value ?? !Boolean(currentSession.crops[action.id])
      if (turnOn) {
        currentSession.crops[action.id] = true
      } else {
        delete currentSession.crops[action.id]
      }
      break
    }
  }
}

function SessionsContextProvider(
  props: Omit<React.ProviderProps<SessionsContextType>, 'value'>
) {
  const [sessionStore, dispatch] = useImmerReducer(reducer, null, initializer)

  const setSession = useCallback<SessionsContextType[1]['setSession']>((id) => {
    dispatch({
      type: 'SET_CURRENT_SESSION',
      sessionId: id,
    })
  }, [])

  const createSession = useCallback<SessionsContextType[1]['createSession']>(
    (autoSwitchSession = true) => {
      dispatch({
        type: 'CREATE_SESSION',
        setCurrent: autoSwitchSession,
      })
    },
    []
  )

  const toggleCrop = useCallback<SessionsContextType[1]['toggleCrop']>(
    (id, value) => {
      dispatch({
        type: 'TOGGLE_CROP',
        id,
        value,
      })
    },
    []
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionStore))
  }, [sessionStore])

  return (
    <SessionsContext.Provider
      value={[
        sessionStore,
        {
          setSession,
          createSession,
          toggleCrop,
        },
      ]}
      {...props}
    />
  )
}

const useSessionsContext = () => {
  const context = useContext(SessionsContext)
  if (context === undefined) {
    throw new Error('Missing SessionsContextProvider!')
  }
  return context
}

const useSessionsList = () => {
  const [{ sessions }, { setSession, createSession }] = useSessionsContext()
  return [sessions, { setSession, createSession }] as const
}

const useSession = () => {
  const [{ currentSessionId, sessions }, { toggleCrop }] = useSessionsContext()
  return [
    sessions.find((s) => s.id === currentSessionId)!,
    { toggleCrop },
  ] as const
}

export { SessionsContextProvider, useSessionsList, useSession }
