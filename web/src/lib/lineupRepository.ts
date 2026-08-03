import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { Lineup } from '../domain/types'
import { db } from './firebase'
import {
  getLineups as getLocalLineups,
  getUserLineup as getLocalUserLineup,
  saveLineup as saveLocalLineup,
} from './storage'

function lineupDocumentId(eventId: string, userId: string): string {
  return `${eventId}__${userId}`
}

export async function loadUserLineup(
  eventId: string,
  userId: string,
): Promise<Lineup | null> {
  if (!db) return getLocalUserLineup(eventId, userId)

  const snapshot = await getDoc(doc(db, 'lineups', lineupDocumentId(eventId, userId)))
  if (!snapshot.exists()) return null
  return snapshot.data() as Lineup
}

export async function loadUserLineups(userId: string): Promise<Lineup[]> {
  if (!db) return getLocalLineups().filter((lineup) => lineup.userId === userId)

  const snapshot = await getDocs(
    query(collection(db, 'lineups'), where('userId', '==', userId)),
  )
  return snapshot.docs.map((item) => item.data() as Lineup)
}

export async function persistLineup(lineup: Lineup): Promise<void> {
  if (!db) {
    saveLocalLineup(lineup)
    return
  }

  await setDoc(
    doc(db, 'lineups', lineupDocumentId(lineup.eventId, lineup.userId)),
    {
      ...lineup,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
