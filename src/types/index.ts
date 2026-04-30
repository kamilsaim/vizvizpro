export type HiveStatus = 'gelişim' | 'bölme' | 'aktif' | 'pasif' | 'ana_ari_kutusu';
export type QueenBreed = 'Anadolu' | 'Karniyol' | 'Belfast' | 'Kafkas' | 'Muğla' | 'Karpat' | 'Belit' | 'Karma';
export type QueenLineage = 'Saf' | 'F1' | 'F2' | 'Karma';

export type HiveQueenStatus = 
  | 'Ana Arısız' 
  | 'Meme Var' 
  | 'Bakire' 
  | 'Çiftleşmemiş/Uçuşta' 
  | 'Çiftleşmiş (Yumurtlayan)' 
  | 'Yaşlı/Değiştirilecek';

export interface Hive {
  id: string;
  userId: string;
  code: string;
  status: HiveStatus;
  breed?: QueenBreed;
  lineage?: QueenLineage;
  queenStatus?: HiveQueenStatus;
  queenYear?: number;
  population?: number;
  lastFeedingDate?: string;
  lastMedicationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feeding {
  id: string;
  userId: string;
  hiveId: string;
  type: 'Şerbet' | 'Kek' | 'Fondan' | 'Diğer';
  amount: string;
  date: string;
}

export interface Medication {
  id: string;
  userId: string;
  hiveId: string;
  medicineName: string;
  type: 'Varroa' | 'Yavru Çürüklüğü' | 'Nosema' | 'Diğer';
  date: string;
}

export type QueenStatus = 'koza' | 'çıktı' | 'çiftleşme' | 'yumurtlama' | 'aktif' | 'satıldı' | 'kayıp' | 'transferred';

export interface Queen {
  id: string;
  userId: string;
  batchId?: string;
  hiveId?: string;
  birthDate: string;
  matingDate?: string;
  eggLayingDate?: string;
  status: QueenStatus;
  isArtificialInsemination?: boolean;
  color?: string;
  notes?: string;
  transferredToHiveId?: string;
  createdAt: string;
}

export type QueenBatchStatus = 'başlatıldı' | 'memeler_kapandı' | 'dağıtıldı' | 'tamamlandı';

export interface QueenBatch {
  id: string;
  userId: string;
  transferDate: string;
  breederHiveId?: string;
  breed?: QueenBreed;
  lineage?: QueenLineage;
  starterHiveId?: string;
  transferCount: number;
  nurturedCount?: number;
  status: QueenBatchStatus;
  notes?: string;
  createdAt: string;
}

export type SaleType = 'ana_ari' | 'ari_kolonisi' | 'bal' | 'diger';

export interface Sale {
  id: string;
  userId: string;
  type: SaleType;
  productName: string;
  quantity: number;
  unit: 'adet' | 'kg' | 'plaka';
  price: number;
  customerInfo?: string;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface Stock {
  id: string;
  userId: string;
  productName: string;
  quantity: number;
  unit: 'adet' | 'kg' | 'plaka';
  category: SaleType;
  updatedAt: string;
}
