import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Shipment {
  id?: string
  source: string
  destination: string
  distance: number
  weight: number
  priority: 'low' | 'medium' | 'high'
  eta: number
  delay_risk: 'low' | 'medium' | 'high'
  vehicle: string
  route: string
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed'
  assigned_driver: string
  ai_analysis?: string
  createdAt?: Timestamp
}

export interface Driver {
  id?: string
  name: string
  vehicle: string
  status: 'available' | 'on_delivery'
}

export async function createShipment(data: Omit<Shipment, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, 'shipments'), {
    ...data,
    createdAt: Timestamp.now(),
  })
  return ref.id
}

export async function getShipments(): Promise<Shipment[]> {
  const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment))
}

export async function updateShipmentStatus(id: string, status: Shipment['status']) {
  await updateDoc(doc(db, 'shipments', id), { status })
}

export async function getDrivers(): Promise<Driver[]> {
  const snap = await getDocs(collection(db, 'drivers'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver))
}

export function subscribeToShipments(callback: (shipments: Shipment[]) => void) {
  const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment)))
  })
}
