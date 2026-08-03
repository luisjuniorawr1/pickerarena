import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseEnabled } from '../lib/firebase'
import {
  getUser,
  login as demoLogin,
  logout as localLogout,
  saveUserSession,
  type SessionUser,
} from '../lib/storage'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  cloudEnabled: boolean
  signInDemo: (displayName: string) => Promise<void>
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (displayName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toSessionUser(firebaseUser: FirebaseUser): SessionUser {
  return {
    id: firebaseUser.uid,
    displayName:
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split('@')[0] ||
      'Jogador',
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    mode: 'firebase',
  }
}

async function saveCloudProfile(firebaseUser: FirebaseUser): Promise<void> {
  if (!db) return
  const session = toSessionUser(firebaseUser)
  await setDoc(
    doc(db, 'users', firebaseUser.uid),
    {
      displayName: session.displayName,
      email: session.email ?? null,
      photoURL: session.photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getUser())
  const [loading, setLoading] = useState(firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      setUser(getUser())
      setLoading(false)
      return
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        localLogout()
        setUser(null)
        setLoading(false)
        return
      }

      const session = toSessionUser(firebaseUser)
      saveUserSession(session)
      setUser(session)
      setLoading(false)

      try {
        await saveCloudProfile(firebaseUser)
      } catch (error) {
        console.error('Não foi possível atualizar o perfil no Firestore.', error)
      }
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      cloudEnabled: firebaseEnabled,
      async signInDemo(displayName) {
        const session = demoLogin(displayName)
        setUser(session)
      },
      async signInGoogle() {
        if (!auth) throw new Error('Firebase ainda não está configurado.')
        const credential = await signInWithPopup(auth, new GoogleAuthProvider())
        await saveCloudProfile(credential.user)
      },
      async signInEmail(email, password) {
        if (!auth) throw new Error('Firebase ainda não está configurado.')
        const credential = await signInWithEmailAndPassword(auth, email, password)
        await saveCloudProfile(credential.user)
      },
      async signUpEmail(displayName, email, password) {
        if (!auth) throw new Error('Firebase ainda não está configurado.')
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: displayName.trim() })
        await saveCloudProfile(credential.user)
      },
      async signOut() {
        if (auth?.currentUser) await firebaseSignOut(auth)
        localLogout()
        setUser(null)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
