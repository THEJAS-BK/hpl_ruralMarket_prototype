import type { CompareEntry, Language } from '../../api/types';
import type { RouteInfo } from '../../api/routing';

export type EntryWithRoute = CompareEntry & { route?: RouteInfo };
export type EntryPair = [EntryWithRoute, EntryWithRoute];

export interface PanelCardProps {
  entry: EntryWithRoute;
  better: boolean;
  language: Language;
  t: Record<string, string>;
}

export interface CostCardProps {
  entry: EntryWithRoute;
  language: Language;
  onClose: () => void;
}

export interface ComparePanelProps {
  entries: EntryPair;
  language: Language;
  onClose: () => void;
}