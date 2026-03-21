export type Category = 'Student' | 'Guest' | 'VIP';
export type FoodPreference = 'Veg' | 'Non-Veg';
export type Attending = 'Lunch' | 'Dinner' | 'Both';

export interface Registration {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  category: Category;
  organization: string;
  numPersons: number;
  foodPreference: FoodPreference;
  attending: Attending;
  tokenId: string;
  entryPassId: string;
  lunchTokenId: string;
  dinnerTokenId: string;
  entryScanned: boolean;
  lunchScanned: boolean;
  dinnerScanned: boolean;
  createdAt: string;
}
