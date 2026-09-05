import type { NavigatorScreenParams } from '@react-navigation/native';
import type { DomaineId } from '../types';

export type DetailParamList = {
  Domain: { domaineId: DomaineId };
  ItemDetail: { itemId: string };
  MedicationDetail: { medicationId: string };
};

export type AccueilStackParamList = {
  AccueilHome: undefined;
  Legal: undefined;
  ItemDetail: { itemId: string };
  MedicationDetail: { medicationId: string };
};

export type CatalogueStackParamList = {
  CatalogueHome: undefined;
} & DetailParamList;

export type MedicamentsStackParamList = {
  MedicamentsHome: undefined;
} & Pick<DetailParamList, 'ItemDetail' | 'MedicationDetail'>;

export type TabParamList = {
  Accueil: NavigatorScreenParams<AccueilStackParamList> | undefined;
  Catalogue: NavigatorScreenParams<CatalogueStackParamList> | undefined;
  Medicaments: NavigatorScreenParams<MedicamentsStackParamList> | undefined;
};

/** Écrans de détail partagés (fiches domaine / item / médicament + mentions). */
export type RootStackParamList = DetailParamList & { Legal: undefined };
